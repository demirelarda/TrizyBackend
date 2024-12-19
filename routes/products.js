const express = require('express')
const router = express.Router()
const productController = require('../controllers/productController')

router.get('/category/:categoryId', productController.getProductsByCategoryId)
router.get('/search', productController.searchProducts)


module.exports = router