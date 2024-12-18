const mongoose = require('mongoose')

const DealSchema = new mongoose.Schema(
  {
    dealOrder: {
      type: Number,
      required: true,
      unique: true
    },
    imageUrl: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    action: {
      type: String,
      required: true,
    },
    aspectRatio: {
      type: String,
      required: true,
      enum: ['16:9', '4:5', '3:4', '1:1'],
      default: '16:9',
    },
  },
  { timestamps: true }
)

module.exports = mongoose.model('Deal', DealSchema)