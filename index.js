const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
const rateLimit = require('express-rate-limit')
const { USE_REDIS } = require('./config/env')
const createRedisClient = require('./services/redisClient')
dotenv.config()
const cronJobs = require('./cronJobs')

const authRoute = require('./routes/auth')
const dealsRoute = require('./routes/deals')
const categoryRoute = require('./routes/categories')
const productsRoute = require('./routes/products')
const cartRoute = require('./routes/cart')
const paymentRoute = require('./routes/payments')
const addressRoute = require('./routes/address')
const ordersRoute = require('./routes/orders')
const subscriptionsRoute = require('./routes/subscriptions')
const trialProductsRoute = require('./routes/trialProducts')
const trialsRoute = require('./routes/trials')
const reviewsRoute = require('./routes/reviews')
const aiSuggestionsRoute = require('./routes/aiSuggestions')
const likesRoute = require('./routes/likes')
const trendingSearchesRoute = require('./routes/searchTrends')
const userProfilesRoute = require('./routes/userProfiles')

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to the MongoDB'))
  .catch((err) => {
    console.log(err)
  })

if (USE_REDIS) {
  createRedisClient()
}

const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 100,
  message: 'Too many requests!',
})

const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 10,
  message: 'Too many requests!.',
})

app.use(globalLimiter)

app.use('/api/payments', paymentLimiter, paymentRoute)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use('/api', authRoute)
app.use('/api/deals', dealsRoute)
app.use('/api/categories', categoryRoute)
app.use('/api/products', productsRoute)
app.use('/api/carts', cartRoute)
app.use('/api/address', addressRoute)
app.use('/api/orders', ordersRoute)
app.use('/api/subscriptions', subscriptionsRoute)
app.use('/api/trialProducts', trialProductsRoute)
app.use('/api/trials', trialsRoute)
app.use('/api/reviews', reviewsRoute)
app.use('/api/aiSuggestions', aiSuggestionsRoute)
app.use('/api/likes', likesRoute)
app.use('/api/trendingSearches', trendingSearchesRoute)
app.use('/api/userProfiles', userProfilesRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})