const mongoose = require('mongoose')
const Product = require('../models/Product')
const Category = require('../models/Category')
const SearchTerm = require('../models/SearchTerm')
const ProductView = require('../models/ProductView')
const Like = require('../models/Like')
const { USE_REDIS } = require('../config/env')
const createRedisClient = require('../services/redisClient')

const ObjectId = mongoose.Types.ObjectId

const CACHE_TTL = 3600

exports.getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      exactRatings, // should look like: "1,2,3"
      minRatingCount,
      maxRatingCount,
      minLikeCount,
      maxLikeCount,
      sortBy, // options: "priceAsc", "priceDesc", "ratingCountDesc", "likeCountDesc"
    } = req.query

    let redisClient = null
    if (USE_REDIS) {
      redisClient = createRedisClient()
    }

    let categoriesTree = null
    const cacheKey = `descendants:${categoryId}`

    if (USE_REDIS && redisClient) {
      const cachedValue = await redisClient.get(cacheKey)
      if (cachedValue) {
        categoriesTree = JSON.parse(cachedValue)
      }
    }

    if (!categoriesTree) {
      categoriesTree = await Category.aggregate([
        {
          $match: { _id: new ObjectId(categoryId), isActive: true },
        },
        {
          $graphLookup: {
            from: "categories",
            startWith: "$_id",
            connectFromField: "_id",
            connectToField: "parentCategory",
            as: "descendants",
            restrictSearchWithMatch: { isActive: true },
          },
        },
      ])

      if (categoriesTree.length && USE_REDIS && redisClient) {
        await redisClient.set(cacheKey, JSON.stringify(categoriesTree), "EX", CACHE_TTL)
      }
    }

    if (!categoriesTree || !categoriesTree.length) {
      return res.status(404).json({
        success: false,
        message: "Category not found or inactive",
      })
    }

    const allCategoryIds = [
      categoriesTree[0]._id,
      ...categoriesTree[0].descendants.map((cat) => cat._id),
    ]

    const subCategories = await Category.find({
      parentCategory: categoryId,
      isActive: true,
    })

    const filters = { category: { $in: allCategoryIds } }

    if (minPrice || maxPrice) {
      filters.price = {}
      if (minPrice) filters.price.$gte = parseFloat(minPrice)
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice)
    }

    if (exactRatings) {
      const ratingsArray = exactRatings.split(",").map(Number)
      filters.averageRating = { $in: ratingsArray.flatMap(rating => {
        return Array.from({ length: 10 }, (_, i) => rating + i * 0.1)
      }) }
    }

    if (minRatingCount || maxRatingCount) {
      filters.reviewCount = {}
      if (minRatingCount) filters.reviewCount.$gte = parseInt(minRatingCount)
      if (maxRatingCount) filters.reviewCount.$lte = parseInt(maxRatingCount)
    }

    if (minLikeCount || maxLikeCount) {
      filters.likeCount = {}
      if (minLikeCount) filters.likeCount.$gte = parseInt(minLikeCount)
      if (maxLikeCount) filters.likeCount.$lte = parseInt(maxLikeCount)
    }

    const sortOptions = {}
    if (sortBy === "priceAsc") sortOptions.price = 1
    if (sortBy === "priceDesc") sortOptions.price = -1
    if (sortBy === "ratingCountDesc") sortOptions.reviewCount = -1
    if (sortBy === "likeCountDesc") sortOptions.likeCount = -1

    const products = await Product.find(filters)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("category", "name description")
      .exec()

    const totalProducts = await Product.countDocuments(filters)

    const transformedProducts = products.map((product) => ({
      ...product.toObject(),
      tags: [],
      description: "",
    }))

    res.status(200).json({
      success: true,
      subCategories,
      products: transformedProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      },
    })
  } catch (error) {
    console.error("Error fetching products by category:", error)
    res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
      error: error.message,
    })
  }
}

/*
const getAllSubCategoryIds = async (parentCategoryId) => {
  const subCategories = await Category.find({ parentCategory: parentCategoryId, isActive: true })
  const subCategoryIds = subCategories.map((sub) => sub._id)

  if (subCategoryIds.length > 0) {
    for (const subCategoryId of subCategoryIds) {
      const deeperSubCategoryIds = await getAllSubCategoryIds(subCategoryId)
      subCategoryIds.push(...deeperSubCategoryIds)
    }
  }

  return subCategoryIds
}
*/





exports.searchProducts = async (req, res) => {
  try {
    const {
      query,
      categoryId,
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      exactRatings,
      minRatingCount,
      maxRatingCount,
      minLikeCount,
      maxLikeCount,
      sortBy,
    } = req.query

    if (!query || query.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Search query is required.",
      })
    }

    if (req.user) {
      (async () => {
        try {
          await SearchTerm.create({
            userId: req.user.id,
            searchTerm: query,
          })
        } catch (err) {
          console.error("Failed to log search term:", err.message)
        }
      })()
    }

    const searchFilter = {
      $text: { $search: query },
    }

    if (categoryId) {
      searchFilter.category = categoryId
    }

    if (minPrice || maxPrice) {
      searchFilter.price = {}
      if (minPrice) searchFilter.price.$gte = parseFloat(minPrice)
      if (maxPrice) searchFilter.price.$lte = parseFloat(maxPrice)
    }

    if (exactRatings) {
      const ratingsArray = exactRatings.split(",").map(Number)
      searchFilter.averageRating = {
        $in: ratingsArray.flatMap((rating) =>
          Array.from({ length: 10 }, (_, i) => rating + i * 0.1)
        ),
      }
    }

    if (minRatingCount || maxRatingCount) {
      searchFilter.reviewCount = {}
      if (minRatingCount) searchFilter.reviewCount.$gte = parseInt(minRatingCount)
      if (maxRatingCount) searchFilter.reviewCount.$lte = parseInt(maxRatingCount)
    }

    if (minLikeCount || maxLikeCount) {
      searchFilter.likeCount = {}
      if (minLikeCount) searchFilter.likeCount.$gte = parseInt(minLikeCount)
      if (maxLikeCount) searchFilter.likeCount.$lte = parseInt(maxLikeCount)
    }

    const sortOptions = {}
    if (sortBy === "priceAsc") sortOptions.price = 1
    if (sortBy === "priceDesc") sortOptions.price = -1
    if (sortBy === "ratingCountDesc") sortOptions.reviewCount = -1
    if (sortBy === "likeCountDesc") sortOptions.likeCount = -1

    const skip = (page - 1) * limit

    const [products, totalProducts] = await Promise.all([
      Product.find(searchFilter)
        .sort({ ...sortOptions, score: { $meta: "textScore" } })
        .skip(skip)
        .limit(Number(limit))
        .populate("category", "name description"),
      Product.countDocuments(searchFilter),
    ])

    const totalPages = Math.ceil(totalProducts / limit)

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        limit: Number(limit),
      },
    })
  } catch (error) {
    console.error("Error searching products:", error)
    res.status(500).json({
      success: false,
      message: "An error occurred while searching for products.",
      error: error.message,
    })
  }
}



exports.getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params

    const product = await Product.findById(productId)
      .populate('category', 'name description')
      .exec()

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    if (req.user) {
      (async () => {
        try {
          await ProductView.create({
            userId: req.user.id,
            productId,
          })
        } catch (err) {
          console.error('Failed to log product view:', err.message)
        }
      })()
    }

    res.status(200).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product.',
      error: error.message,
    })
  }
}


exports.getLikedProducts = async (req, res) => {
  try {
    const userId = req.user.id
    const {
      page = 1,
      limit = 10,
      minPrice,
      maxPrice,
      exactRatings,
      minRatingCount,
      maxRatingCount,
      minLikeCount,
      maxLikeCount,
      sortBy, 
    } = req.query

    if (!userId) {
      return res.status(400).json({
        success: false,
        message: 'User ID is required.',
      })
    }

    const likedProducts = await Like.find({ userId })
      .select('productId')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))

    if (likedProducts.length === 0) {
      return res.status(200).json({
        success: true,
        products: [],
        message: 'No liked products found.',
        pagination: {
          currentPage: parseInt(page),
          totalPages: 0,
          totalProducts: 0,
        },
      })
    }

    const totalLikedProducts = await Like.countDocuments({ userId })

    const productIds = likedProducts.map((like) => like.productId)

    const filters = { _id: { $in: productIds } }

    if (minPrice || maxPrice) {
      filters.price = {}
      if (minPrice) filters.price.$gte = parseFloat(minPrice)
      if (maxPrice) filters.price.$lte = parseFloat(maxPrice)
    }

    if (exactRatings) {
      const ratingsArray = exactRatings.split(',').map(Number)
      filters.averageRating = { 
        $in: ratingsArray.flatMap(rating => 
          Array.from({ length: 10 }, (_, i) => rating + i * 0.1)
        ) 
      }
    }

    if (minRatingCount || maxRatingCount) {
      filters.reviewCount = {}
      if (minRatingCount) filters.reviewCount.$gte = parseInt(minRatingCount)
      if (maxRatingCount) filters.reviewCount.$lte = parseInt(maxRatingCount)
    }

    if (minLikeCount || maxLikeCount) {
      filters.likeCount = {}
      if (minLikeCount) filters.likeCount.$gte = parseInt(minLikeCount)
      if (maxLikeCount) filters.likeCount.$lte = parseInt(maxLikeCount)
    }

    const sortOptions = {}
    if (sortBy === 'priceAsc') sortOptions.price = 1
    if (sortBy === 'priceDesc') sortOptions.price = -1
    if (sortBy === 'ratingCountDesc') sortOptions.reviewCount = -1
    if (sortBy === 'likeCountDesc') sortOptions.likeCount = -1

    const products = await Product.find(filters)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('category', 'name description')
      .exec()

    return res.status(200).json({
      success: true,
      products,
      message: 'Liked products fetched successfully.',
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalLikedProducts / limit),
        totalProducts: totalLikedProducts,
      },
    })
  } catch (error) {
    console.error('Error fetching liked products:', error.message)
    return res.status(500).json({
      success: false,
      message: 'An error occurred while fetching liked products.',
      error: error.message,
    })
  }
}