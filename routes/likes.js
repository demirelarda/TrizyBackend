const express = require('express')
const router = express.Router()
const { likeProduct, removeLike, getLikedProductIds } = require('../controllers/likeController')
const { verifyToken } = require('../middleware/verifyToken')

router.post('/like', verifyToken, likeProduct)

router.delete('/unlike/:productId', verifyToken, removeLike)

router.get('/get-liked-products', verifyToken, getLikedProductIds)

module.exports = router