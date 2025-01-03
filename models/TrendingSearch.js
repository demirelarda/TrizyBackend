const mongoose = require('mongoose')

const TrendingSearchSchema = new mongoose.Schema(
  {
    trendingSearchTerm: {
        type: String,
        required: true,
    },
    occurrenceCount: {
        type: Number,
        required: true,
    }
  },
  {
    timestamps: true,
  }
)

module.exports = mongoose.model('TrendingSearch', TrendingSearchSchema)