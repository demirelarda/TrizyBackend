const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Order = require('../models/Order')
const UserAddress = require('./models/UserAddress')

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id

    // Fetch the user cart
    const cart = await Cart.findOne({ ownerId: userId }).populate({
      path: 'items.productId',
      select: 'price stockCount title',
    })

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Add items to your cart before proceeding to payment.',
      })
    }

    let totalAmount = 0
    for (const item of cart.items) {
      if (item.quantity > item.productId.stockCount) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for product: ${item.productId.title}`,
        })
      }
      totalAmount += item.quantity * item.productId.price
    }

    if (totalAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid total amount. Please check your cart.',
      })
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100),
      currency: 'usd',
      description: 'E-commerce Payment',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        userId: userId,
        cartId: cart._id.toString(),
      },
    })

    res.status(200).json({
      success: true,
      paymentIntent: {
        id: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      },
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create payment intent',
      error: error.message,
    })
  }
}

const fetchCartAndCreateOrder = async (userId, paymentIntent) => {
  try {
    // Fetch the user's default address
    const defaultAddress = await fetchUserDefaultAddress(userId)

    if (!defaultAddress) {
      return { success: false, message: 'Default address not found' }
    }

    // Get the user's cart
    const cart = await Cart.findOne({ ownerId: userId }).populate({
      path: 'items.productId',
      select: 'price title stockCount',
    })

    if (!cart || cart.items.length === 0) {
      console.error('Cart is empty for user:', userId)
      return { success: false, message: 'Cart is empty' }
    }

    const orderItems = cart.items.map((item) => ({
      productId: item.productId._id,
      quantity: item.quantity,
      price: item.productId.price,
    }))

    const newOrder = new Order({
      userId: userId,
      deliveryAddressId: defaultAddress._id,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'pending',
      items: orderItems,
    })

    await newOrder.save()

    cart.items = []
    await cart.save()

    // Decrement product stock counts
    for (const item of orderItems) {
      const product = await Product.findById(item.productId)

      if (product) {
        if (product.stockCount < item.quantity) {
          console.error(
            `Insufficient stock for product ${product.title} (ID: ${item.productId})`
          )
          throw new Error(
            `Insufficient stock for product ${product.title} (ID: ${item.productId})`
          )
        }

        product.stockCount -= item.quantity
        await product.save()
      }
    }

    console.log('Order created successfully and stock counts updated for user:', userId)
    return { success: true, order: newOrder }
  } catch (error) {
    console.error('Error creating order or updating stock counts:', error.message)
    return { success: false, message: error.message }
  }
}

const fetchUserDefaultAddress = async (userId) => {
  try {
    const defaultAddress = await UserAddress.findOne({
      userId: userId,
      isDefault: true,
    })

    if (!defaultAddress) {
      throw new Error('No default address found for the user.')
    }

    return defaultAddress
  } catch (error) {
    console.error('Error fetching default address:', error.message)
    throw error
  }
}

exports.stripeWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature']
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    // Verify the event with Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Webhook received: ${event.type}`)

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      const userId = paymentIntent.metadata.userId

      const result = await fetchCartAndCreateOrder(userId, paymentIntent)

      if (!result.success) {
        console.error('Order creation failed:', result.message)
      }
      break
    }

    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object
      console.error(`Payment failed for PaymentIntent: ${failedIntent.id}`)
      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  res.status(200).json({ received: true })
}


exports.checkOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentIntentId } = req.query

    if (!paymentIntentId) {
      return res.status(400).json({
        success: false,
        message: 'PaymentIntent ID is required.',
      })
    }

    const order = await Order.findOne({ userId, paymentIntentId })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found. Payment might still be processing.',
      })
    }

    res.status(200).json({
      success: true,
      message: 'Order found.',
      order,
    })
  } catch (error) {
    console.error('Error checking order status:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to check order status.',
      error: error.message,
    })
  }
}