const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const paymentController = require('../controllers/paymentController')
const { verifyToken } = require('../middleware/verifyToken')
const stripeWebhookController = require('../controllers/stripeWebhookController')


router.post('/create-payment-intent', verifyToken, paymentController.createPaymentIntent)
router.get('/check-order-status', verifyToken, paymentController.checkOrderStatus)

router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  stripeWebhookController.handleStripeWebhook
)


module.exports = router