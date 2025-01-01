const mongoose = require('mongoose')

const CartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    default: 1,
  },
})

const CartSchema = new mongoose.Schema({
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: [CartItemSchema],
  cargoFee: {
    type: Number,
    required: true,
    default: 0.0,
  },
}, { timestamps: true })

module.exports = mongoose.model('Cart', CartSchema)