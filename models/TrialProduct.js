const mongoose = require('mongoose');

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
        type: String,
        required: true
    },
    tags: {
        type: [String],
        default: []
    }
}, { timestamps: true });

module.exports = mongoose.model('TrialProduct', TrialProductSchema);