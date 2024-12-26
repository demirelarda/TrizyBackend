const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/verifyToken')
const subscriptionController = require('../controllers/subscriptionController')

router.post('/create', verifyToken, subscriptionController.createSubscription)

router.delete('/:subscriptionId', verifyToken, subscriptionController.cancelSubscription)

router.get('/status', verifyToken, subscriptionController.getSubscriptionStatus)

module.exports = router