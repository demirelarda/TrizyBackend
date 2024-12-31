const Like = require('../models/Like')
const Product = require('../models/Product')

exports.likeProduct = async (req, res) => {
    try {
        const { productId } = req.body

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' })
        }

        const productExists = await Product.findById(productId)
        if (!productExists) {
            return res.status(404).json({ success: false, message: 'Product not found.' })
        }

        const existingLike = await Like.findOne({ userId: req.user.id, productId })
        if (existingLike) {
            return res.status(400).json({ success: false, message: 'Product already liked.' })
        }

        const like = new Like({
            userId: req.user.id,
            productId,
        })
        await like.save()

        return res.status(201).json({ success: true, message: 'Product liked successfully.' })
    } catch (error) {
        console.error('Error liking product:', error.message)
        res.status(500).json({ success: false, message: 'An error occurred while liking the product.' })
    }
}

exports.removeLike = async (req, res) => {
    try {
        const { productId } = req.params

        if (!productId) {
            return res.status(400).json({ success: false, message: 'Product ID is required.' })
        }

        const productExists = await Product.findById(productId)
        if (!productExists) {
            return res.status(404).json({ success: false, message: 'Product not found.' })
        }

        const deletedLike = await Like.findOneAndDelete({
            userId: req.user.id,
            productId,
        })

        if (!deletedLike) {
            return res.status(404).json({ success: false, message: 'Like not found.' })
        }

        return res.status(200).json({ success: true, message: 'Product unliked successfully.' })
    } catch (error) {
        console.error('Error unliking product:', error.message)
        res.status(500).json({ success: false, message: 'An error occurred while unliking the product.' })
    }
}

exports.getLikedProductIds = async (req, res) => {
    try {
        const userId = req.user.id

        if (!userId) {
            return res.status(400).json({ success: false, message: 'User ID is required.' })
        }

        const likedProducts = await Like.find({ userId }).select('productId')
        const likedProductIds = likedProducts.map((like) => like.productId.toString())

        return res.status(200).json({
            success: true,
            likedProductIds,
        })
    } catch (error) {
        console.error('Error fetching liked product IDs:', error.message)
        res.status(500).json({
            success: false,
            message: 'An error occurred while fetching liked product IDs.',
        })
    }
}