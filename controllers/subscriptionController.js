const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const User = require('../models/User')
const Subscription = require('../models/Subscription')

exports.createSubscription = async (req, res) => {
  try {
    const userId = req.user.id
    const { paymentMethodId } = req.body
    if (!paymentMethodId) {
      return res.status(400).json({ success: false, message: 'paymentMethodId is required.' })
    }
    const user = await User.findById(userId)
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' })
    }
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.userFirstName + ' ' + user.userLastName,
      })
      user.stripeCustomerId = customer.id
      await user.save()
    }
    await stripe.paymentMethods.attach(paymentMethodId, { customer: user.stripeCustomerId })
    await stripe.customers.update(user.stripeCustomerId, {
      invoice_settings: { default_payment_method: paymentMethodId },
    })
    const subscription = await stripe.subscriptions.create({
      customer: user.stripeCustomerId,
      items: [{ price: process.env.STRIPE_MONTHYLY_SUBSCRIPTION_PRICE_ID }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
      default_payment_method: paymentMethodId,
    })
    const latestInvoice = subscription.latest_invoice
    let clientSecret = null
    if (latestInvoice && latestInvoice.payment_intent) {
      clientSecret = latestInvoice.payment_intent.client_secret
    }
    const newSubscription = new Subscription({
      userId: user._id,
      stripeSubscriptionId: subscription.id,
      status: subscription.status,
      isActive: subscription.status === 'active',
      startedAt: subscription.start_date ? new Date(subscription.start_date * 1000) : null,
      expiresAt: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
    })
    await newSubscription.save()
    res.status(200).json({
      success: true,
      subscription: newSubscription,
      subscriptionStatus: subscription.status,
      clientSecret,
      message: 'Subscription created. Confirm PaymentIntent if required.',
    })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not create subscription.', error: error.message })
  }
}

exports.cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id
    const { subscriptionId } = req.params
    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'subscriptionId is required.' })
    }
    const subscription = await Subscription.findOne({ _id: subscriptionId, userId })
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found.' })
    }
    const canceledSub = await stripe.subscriptions.cancel(subscription.stripeSubscriptionId)
    subscription.status = canceledSub.status
    subscription.isActive = false
    subscription.canceledAt = new Date()
    await subscription.save()
    res.status(200).json({ success: true, message: 'Subscription canceled.', subscription })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Could not cancel subscription.', error: error.message })
  }
}

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const userId = req.user.id
    const subscription = await Subscription.findOne({ userId }).sort({ createdAt: -1 })
    if (!subscription) {
      return res.status(404).json({ success: false, message: 'No subscription found for this user.' })
    }
    res.status(200).json({ success: true, subscription })
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get subscription status.', error: error.message })
  }
}