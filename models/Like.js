const mongoose = require('mongoose')

const LikeSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    }
}, { timestamps: true })

// prevent duplicate likes
LikeSchema.index({ userId: 1, productId: 1 }, { unique: true })

// for faster querying
LikeSchema.index({ userId: 1 })
LikeSchema.index({ productId: 1 })

module.exports = mongoose.model('Like', LikeSchema)