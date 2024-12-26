const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Subscription = require('../models/Subscription')

exports.handleSubscriptionWebhook = async (req, res) => {
  const endpointSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret)
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  console.log(`Webhook Event Type: ${event.type}`)

  try {
    switch (event.type) {
      case 'payment_intent.created':
        console.log('PaymentIntent created:', event.data.object.id)
        break
      case 'payment_intent.succeeded':
        console.log('PaymentIntent succeeded:', event.data.object.id)
        break
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object)
        break
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object)
        break
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Error handling webhook event:', error.message)
    return res.status(500).json({ error: 'Internal Server Error' })
  }
}


async function handleSubscriptionCreated(subscription) {
  console.log('Subscription created in Stripe:', subscription.id)
  // Maybe we can update the local subscription if needed
}


async function handleSubscriptionUpdated(subscription) {
  const localSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id,
  })
  if (!localSub) return

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


async function handleSubscriptionDeleted(subscription) {
  const localSub = await Subscription.findOne({
    stripeSubscriptionId: subscription.id,
  })
  if (!localSub) return

  localSub.status = 'canceled'
  localSub.isActive = false
  localSub.canceledAt = new Date()
  await localSub.save()
}


async function handleInvoicePaymentSucceeded(invoice) {
  console.log('Invoice payment succeeded:', invoice.id)
  // If invoice is for a subscription
  if (invoice.subscription) {
    const localSub = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    })
    if (localSub) {
      // set status to active if it was incomplete
      if (localSub.status === 'incomplete') {
        localSub.status = 'active'
        localSub.isActive = true
      }
      await localSub.save()
    }
  }
}


async function handleInvoicePaymentFailed(invoice) {
  console.log('Invoice payment failed:', invoice.id)
  if (invoice.subscription) {
    const localSub = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription,
    })
    if (localSub) {
      // we can also use unpaid maybe
      localSub.status = 'past_due'
      localSub.isActive = false
      await localSub.save()
    }
  }
}