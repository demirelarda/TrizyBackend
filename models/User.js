const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    userFirstName: { type: String, required: true },
    userLastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    emailVerified: { type: Boolean, default: false},
    password: { type: String, required: true },
    refreshToken: { type: String },
    stripeCustomerId: { type: String, default: null },
}, { timestamps: true })

module.exports = mongoose.model('User', UserSchema)