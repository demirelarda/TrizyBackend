const mongoose = require('mongoose')

const ReviewSchema = new mongoose.Schema({
    forProduct: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    fromUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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