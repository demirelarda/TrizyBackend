const mongoose = require('mongoose')

const TrialProductSchema = new mongoose.Schema({
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
    trialPeriod: {
        type: Number,
        default: 30
    },
    availableCount: {
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
    }
}, { timestamps: true })

TrialProductSchema.index({ title: 'text', description: 'text', tags: 'text' })
TrialProductSchema.index({ category: 1 })

module.exports = mongoose.model('TrialProduct', TrialProductSchema)