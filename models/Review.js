const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    orderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    rating: {
        type: Number,
        required: true
    },
    comment: {
        type: String,
        default: ''
    }
}, { timestamps: true })

module.exports = mongoose.model('Review', ReviewSchema)