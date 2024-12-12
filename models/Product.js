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
    stockCount: {
        type: Number,
        required: true,
        default: 0
    },
    category: {
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    },
    cargoWeight: {
        type: Number,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Product', ProductSchema)