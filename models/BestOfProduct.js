const mongoose = require('mongoose')

const BestOfProductSchema = new mongoose.Schema(
  {
    period: {
      type: String,
      required: true,
      enum: ['week', 'month'],
    },
    productIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: 'Product',
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('BestOfProduct', BestOfProductSchema)