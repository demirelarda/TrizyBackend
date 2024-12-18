const mongoose = require('mongoose')

const TrialSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    trialProductId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TrialProduct',
        required: true
    },
    startDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['active', 'completed', 'cancelled', 'overdue'],
        default: 'active'
    },
    feedback: {
        type: String,
        default: null
    }
}, { timestamps: true })

module.exports = mongoose.model('Trial', TrialSchema)