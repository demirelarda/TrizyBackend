const express = require('express')
const router = express.Router()
const dealController = require('../controllers/dealController')

router.get('/get-deals', dealController.getDeals)

router.post('/create-deal', dealController.createDeal)

router.put('/update-deal/:id', dealController.updateDeal)

router.delete('/delete-deal/:id', dealController.deleteDeal)

module.exports = router