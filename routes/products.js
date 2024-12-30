const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')
const { optionalAuth } = require('../middleware/verifyToken')

router.get('/category/:categoryId', optionalAuth, productController.getProductsByCategoryId)

router.get('/search', optionalAuth, productController.searchProducts)

router.get('/:productId', optionalAuth, productController.getSingleProduct)

module.exports = router