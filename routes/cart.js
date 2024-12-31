const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const { verifyToken } = require('../middleware/verifyToken') 

router.get('/get-cart', verifyToken, cartController.getCart)

router.get('/get-cart-items', verifyToken, cartController.getCartProductIds)

router.post('/add-item', verifyToken, cartController.addItemToCart)

router.post('/add-item-on-feed', verifyToken, cartController.addItemToCartOnFeed)

router.patch('/decrement-quantity', verifyToken, cartController.decrementQuantity)

router.delete('/delete-item/:productId', verifyToken, cartController.deleteItemFromCart)


module.exports = router