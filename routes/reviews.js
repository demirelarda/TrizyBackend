const express = require('express')
const router = express.Router()
const reviewController = require('../controllers/reviewController')
const { verifyToken } = require('../middleware/verifyToken')

router.get('/get-product-reviews/:productId', reviewController.getProductReviews)

router.get('/get-reviewable-products/:orderId', verifyToken, reviewController.getReviewableProducts)

router.post('/create-review', verifyToken, reviewController.createReview)

router.delete('/delete-review/:reviewId', verifyToken, reviewController.deleteComment)

module.exports = router