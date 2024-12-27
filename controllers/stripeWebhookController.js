const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const { fetchCartAndCreateOrder } = require('./paymentController')
const Subscription = require('../models/Subscription')

exports.handleStripeWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET
  const sig = req.headers['stripe-signature']
  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.log('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  console.log('Webhook event type:', event.type)
  switch (event.type) {
    case 'payment_intent.created': {
      console.log('payment_intent.created:', event.data.object.id)
      break
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      console.log('payment_intent.succeeded:', paymentIntent.id)
      const userId = paymentIntent.metadata ? paymentIntent.metadata.userId : null
      if (userId) {
        console.log('Fetching cart and creating order for user:', userId)
        const result = await fetchCartAndCreateOrder(userId, paymentIntent)
        if (!result.success) {
          console.log('Order creation failed:', result.message)
        } else {
          console.log('Order created successfully')
        }
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object
      console.log('payment_intent.payment_failed:', failedIntent.id)
      break
    }
    case 'customer.subscription.created': {
      const sub = event.data.object
      console.log('customer.subscription.created:', sub.id)
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object
      console.log('customer.subscription.updated:', subscription.id, subscription.status)
      const localSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
      if (localSub) {
        localSub.status = subscription.status
        localSub.isActive = subscription.status === 'active'
        if (subscription.current_period_end) {
          localSub.expiresAt = new Date(subscription.current_period_end * 1000)
        }
        if (subscription.status === 'canceled') {
          localSub.isActive = false
          localSub.canceledAt = new Date()
        }
        await localSub.save()
        console.log('Local subscription updated:', localSub._id, localSub.status)
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      console.log('customer.subscription.deleted:', subscription.id)
      const localSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
      if (localSub) {
        localSub.status = 'canceled'
        localSub.isActive = false
        localSub.canceledAt = new Date()
        await localSub.save()
        console.log('Local subscription deleted:', localSub._id)
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      console.log('invoice.payment_succeeded:', invoice.id)
      if (invoice.subscription) {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
        if (localSub && localSub.status === 'incomplete') {
          localSub.status = 'active'
          localSub.isActive = true
          await localSub.save()
          console.log('Local subscription activated:', localSub._id)
        }
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      console.log('invoice.payment_failed:', invoice.id)
      if (invoice.subscription) {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
        if (localSub) {
          localSub.status = 'past_due'
          localSub.isActive = false
          await localSub.save()
          console.log('Local subscription marked past_due:', localSub._id)
        }
      }
      break
    }
    default: {
      console.log('Unhandled event type:', event.type)
      break
    }
  }
  res.status(200).json({ received: true })
}