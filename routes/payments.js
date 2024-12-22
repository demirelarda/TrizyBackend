const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const paymentController = require('../controllers/paymentController')
const { verifyToken } = require('../middleware/verifyToken')

router.post('/create-payment-intent', verifyToken, paymentController.createPaymentIntent)

router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  paymentController.stripeWebhook
)

module.exports = router