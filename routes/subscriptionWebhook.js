const express = require('express')
const router = express.Router()
const bodyParser = require('body-parser')
const subscriptionWebhookController = require('../controllers/subscriptionWebhookController')

router.post(
  '/webhook',
  bodyParser.raw({ type: 'application/json' }),
  subscriptionWebhookController.handleSubscriptionWebhook
)

module.exports = router