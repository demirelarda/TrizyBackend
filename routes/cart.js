const express = require('express')
const router = express.Router()
const cartController = require('../controllers/cartController')
const { verifyToken } = require('../middleware/verifyToken') 

router.get('/get-cart', verifyToken, cartController.getCart)

router.post('/add-item', verifyToken, cartController.addItemToCart)

router.patch('/decrement-quantity', verifyToken, cartController.decrementQuantity)

router.delete('/delete-item/:productId', verifyToken, cartController.deleteItemFromCart)


module.exports = router