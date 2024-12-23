const express = require('express')
const router = express.Router()
const userAddressController = require('../controllers/userAddressController')
const { verifyToken } = require('../middleware/verifyToken')

router.post('/create-user-address', verifyToken, userAddressController.createAddress)

router.get('/get-all-addresses', verifyToken, userAddressController.getUserAddresses)

router.get('/get-default-address', verifyToken, userAddressController.getDefaultAddress)

router.delete('/delete-address/:addressId', verifyToken, userAddressController.deleteAddress)

router.put('/update-address/:addressId', verifyToken, userAddressController.updateAddress)

module.exports = router