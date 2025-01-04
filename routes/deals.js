const express = require('express')
const router = express.Router()
const dealController = require('../controllers/dealController')

router.get('/get-deals', dealController.getDeals)


module.exports = router