const express = require('express')
const router = express.Router()
const { verifyToken } = require('../middleware/verifyToken')
const trialController = require('../controllers/trialController')

router.post('/create-trial', verifyToken, trialController.createTrial)
router.get('/active-trial-details', verifyToken, trialController.getTrialDetails)


module.exports = router