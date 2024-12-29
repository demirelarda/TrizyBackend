const express = require('express')
const router = express.Router()
const trialProductController = require('../controllers/trialProductController')
const { verifyToken } = require('../middleware/verifyToken')


router.get('/get-latest', verifyToken, trialProductController.getLatestTrialProducts)
router.get('/category/:categoryId', trialProductController.getTrialProductsByCategoryId)
router.get('/search', trialProductController.searchTrialProducts)
router.get('/:trialProductId', trialProductController.getSingleTrialProduct)

module.exports = router