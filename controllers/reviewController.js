const Review = require('../models/Review')
const Product = require('../models/Product')
const Order = require('../models/Order')

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, comment, orderId } = req.body
    const userId = req.user.id

    // Check if the order exists, belongs to the user, is delivered, and contains the productId
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to review this order.',
      })
    }

    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        message: 'You can only review products from delivered orders.',
      })
    }

    const productInOrder = order.items.some(
      (item) => item.productId.toString() === productId
    )

    if (!productInOrder) {
      return res.status(400).json({
        success: false,
        message: 'The product is not part of the specified order.',
      })
    }

    // Check if a review already exists for the product with the same orderId
    const existingReview = await Review.findOne({ productId, orderId })
    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this product for this order.',
      })
    }

    const COMMENT_CHAR_LIMIT = 1500
    if (comment && comment.length > COMMENT_CHAR_LIMIT) {
      return res.status(400).json({
        success: false,
        message: `Comment exceeds the character limit of ${COMMENT_CHAR_LIMIT} characters.`,
      })
    }

    const review = new Review({
      productId,
      userId,
      orderId,
      rating,
      comment: comment || '',
    })
    await review.save()

    res.status(201).json({
      success: true,
      message: 'Review added successfully.',
    })

    // Increment reviewCount and update averageRating in the background
    const product = await Product.findById(productId)
    if (product) {
      product.reviewCount += 1
      product.averageRating =
        (product.averageRating * (product.reviewCount - 1) + rating) /
        product.reviewCount
      await product.save()
    }
  } catch (error) {
    console.error('Error adding review:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to add review.',
      error: error.message,
    })
  }
}

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params
    const { page = 1, limit = 10 } = req.query

    const reviews = await Review.find({ productId })
      .populate('userId', 'userFirstName userLastName')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    const totalReviews = await Review.countDocuments({ productId })

    const ratingAggregation = await Review.aggregate([
      { $match: { productId: productId } },
      { $group: { _id: null, averageRating: { $avg: '$rating' } } },
    ])

    const averageRating = ratingAggregation.length > 0 
      ? parseFloat(ratingAggregation[0].averageRating.toFixed(1)) 
      : 0.0

    res.status(200).json({
      success: true,
      reviews,
      averageRating,
      totalReviews,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalReviews / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching reviews:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch reviews.',
      error: error.message,
    })
  }
}

exports.deleteComment = async (req, res) => {
  try {
    const { reviewId } = req.params
    const userId = req.user.id

    const review = await Review.findById(reviewId)
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found.',
      })
    }

    if (review.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to delete this review.',
      })
    }

    const productId = review.productId
    const rating = review.rating

    await Review.deleteOne({ _id: reviewId })

    // Send success response
    res.status(200).json({
      success: true,
      message: 'Review deleted successfully.',
    })

    // Decrement reviewCount and update averageRating in the background
    const product = await Product.findById(productId)
    if (product && product.reviewCount > 0) {
      product.reviewCount -= 1
      if (product.reviewCount === 0) {
        product.averageRating = 0
      } else {
        product.averageRating =
          (product.averageRating * (product.reviewCount + 1) - rating) /
          product.reviewCount
      }
      await product.save()
    }
  } catch (error) {
    console.error('Error deleting review:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete review.',
      error: error.message,
    })
  }
}

exports.getReviewableProducts = async (req, res) => {
  try {
    const { orderId } = req.params
    const userId = req.user.id

    // Find the order and check if it belongs to the user
    const order = await Order.findById(orderId)
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      })
    }

    if (order.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to access this order.',
      })
    }

    const productIds = order.items.map((item) => item.productId)

    // Find all reviews the user has already made for this order
    const userReviews = await Review.find({ orderId, userId }).select('productId')

    // Get the productIds that the user has already reviewed
    const reviewedProductIds = userReviews.map((review) => review.productId.toString())

    // Filter out the reviewed products
    const reviewableProductIds = productIds.filter(
      (productId) => !reviewedProductIds.includes(productId.toString())
    )

    const reviewableProducts = await Product.find({ _id: { $in: reviewableProductIds } })
      .select('_id imageURLs title')

    res.status(200).json({
      success: true,
      reviewableProducts,
    })
  } catch (error) {
    console.error('Error retrieving reviewable products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve reviewable products.',
      error: error.message,
    })
  }
}