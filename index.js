const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')
dotenv.config()

const authRoute = require('./routes/auth')
const dealsRoute = require('./routes/deals')
const categoryRoute = require('./routes/categories')
const productsRoute = require('./routes/products')
const cartRoute = require('./routes/cart')
const paymentRoute = require('./routes/payments')
const addressRoute = require('./routes/address')
const ordersRoute = require('./routes/orders')
const subscriptionsRoute = require('./routes/subscriptions')

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to the MongoDB'))
  .catch((err) => {
    console.log(err)
  })

app.use('/api/payments', paymentRoute)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))


app.use('/api', authRoute)
app.use('/api/deals', dealsRoute)
app.use('/api/categories', categoryRoute)
app.use('/api/products', productsRoute)
app.use('/api/carts', cartRoute)
app.use('/api/address',addressRoute)
app.use('/api/orders', ordersRoute)
app.use('/api/subscriptions', subscriptionsRoute)

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})