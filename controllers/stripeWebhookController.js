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
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }
  switch (event.type) {
    case 'payment_intent.created': {
      break
    }
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object
      const userId = paymentIntent.metadata ? paymentIntent.metadata.userId : null
      if (userId) {
        const result = await fetchCartAndCreateOrder(userId, paymentIntent)
        if (!result.success) {
        } else {
        }
      }
      break
    }
    case 'payment_intent.payment_failed': {
      const failedIntent = event.data.object
      break
    }
    case 'customer.subscription.created': {
      const sub = event.data.object
      break
    }
    case 'customer.subscription.updated': {
      const subscription = event.data.object
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
      }
      break
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object
      const localSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id })
      if (localSub) {
        localSub.status = 'canceled'
        localSub.isActive = false
        localSub.canceledAt = new Date()
        await localSub.save()
      }
      break
    }
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
        if (localSub && localSub.status === 'incomplete') {
          localSub.status = 'active'
          localSub.isActive = true
          await localSub.save()
        }
      }
      break
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object
      if (invoice.subscription) {
        const localSub = await Subscription.findOne({ stripeSubscriptionId: invoice.subscription })
        if (localSub) {
          localSub.status = 'past_due'
          localSub.isActive = false
          await localSub.save()
        }
      }
      break
    }
    default: {
      break
    }
  }
  res.status(200).json({ received: true })
}