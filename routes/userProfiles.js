const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/verifyToken')
const userProfileController = require('../controllers/userProfileController')

router.get('/get-user-profile', verifyToken, userProfileController.getUserProfileDetails)

module.exports = router