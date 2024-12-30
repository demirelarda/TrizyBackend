const express = require('express')
const router = express.Router()
const aiSuggestionController = require('../controllers/aiSuggestionController')
const { verifyToken } = require('../middleware/verifyToken') 


router.get('/ai-product-suggestions', verifyToken, aiSuggestionController.getProductSuggestions)

module.exports = router