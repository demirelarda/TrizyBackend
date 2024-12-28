const express = require('express')
const router = express.Router()
const trialProductController = require('../controllers/trialProductController')

router.get('/get-latest', trialProductController.getLatestTrialProducts)
router.get('/category/:categoryId', trialProductController.getTrialProductsByCategoryId)
router.get('/search', trialProductController.searchTrialProducts)
router.get('/:trialProductId', trialProductController.getSingleTrialProduct)

module.exports = router