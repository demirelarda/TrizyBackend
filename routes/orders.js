const express = require('express')
const router = express.Router()
const orderController = require('../controllers/orderController')
const { verifyToken } = require('../middleware/verifyToken')

router.get('/get-user-orders', verifyToken, orderController.getUserOrders)

router.put('/cancel-order/:orderId', verifyToken, orderController.cancelOrder)

module.exports = router