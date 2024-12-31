const express = require('express')
const router = express.Router()
const { likeProduct, removeLike } = require('../controllers/likeController')
const { verifyToken } = require('../middleware/verifyToken')

router.post('/like', verifyToken, likeProduct)

router.delete('/unlike/:productId', verifyToken, removeLike)

module.exports = router