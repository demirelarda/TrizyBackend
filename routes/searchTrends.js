const express = require('express')
const router = express.Router()
const searchTrendsController = require('../controllers/searchTrendsController')

router.get('/get-trending-searches', searchTrendsController.getTrendingSearches)

module.exports = router