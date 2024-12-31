const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { optionalAuth, verifyToken } = require('../middleware/verifyToken')

router.get('/liked-products', verifyToken, productController.getLikedProducts)

router.get('/category/:categoryId', optionalAuth, productController.getProductsByCategoryId)

router.get('/search', optionalAuth, productController.searchProducts)

router.get('/:productId', optionalAuth, productController.getSingleProduct)



module.exports = router