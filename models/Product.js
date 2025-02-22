const mongoose = require('mongoose')

const ProductSchema = new mongoose.Schema({
    imageURLs: { 
        type: [String], 
        required: true 
    },
    title: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    oldPrice:{
        type: Number,
        default: null
    },
    salePrice: {
        type: Number,
        default: null
    },
    stockCount: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    cargoWeight: {
        type: Number,
        required: true
    },
    reviewCount: {
        type: Number,
        required: true,
        default: 0 
    },
    likeCount: {
        type: Number,
        required: true,
        default: 0 
    },
    averageRating: {
        type: Number,
        required: true,
        default: 0 
    }
}, { timestamps: true })

ProductSchema.index({ title: 'text', description: 'text', tags: 'text' })
ProductSchema.index({ category: 1 })

module.exports = mongoose.model('Product', ProductSchema)