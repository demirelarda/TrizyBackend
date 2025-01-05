const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const Cart = require('../models/Cart')
const Product = require('../models/Product')
const Order = require('../models/Order')
const UserAddress = require('../models/UserAddress')

exports.createPaymentIntent = async (req, res) => {
  try {
    const userId = req.user.id
    const cart = await Cart.findOne({ ownerId: userId }).populate({
      path: 'items.productId',
      select: 'price salePrice stockCount title',
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

      const price = item.productId.salePrice ?? item.productId.price

      if (typeof price !== 'number') {
        return res.status(400).json({
          success: false,
          message: `Invalid price for product: ${item.productId.title}`,
        })
      }

      totalAmount += item.quantity * price
    }

    if (typeof cart.cargoFee !== 'number' || cart.cargoFee < 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid cargo fee. Please check your cart.',
      })
    }

    totalAmount += cart.cargoFee

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

exports.fetchCartAndCreateOrder = async (userId, paymentIntent) => {
  try {
    const defaultAddress = await fetchUserDefaultAddress(userId)
    if (!defaultAddress) {
      return { success: false, message: 'Default address not found' }
    }

    const cart = await Cart.findOne({ ownerId: userId }).populate({
      path: 'items.productId',
      select: 'price salePrice title stockCount',
    })

    if (!cart || cart.items.length === 0) {
      return { success: false, message: 'Cart is empty' }
    }

    const orderItems = cart.items.map((item) => {
      const price = item.productId.salePrice ?? item.productId.price // Use salePrice if available
      return {
        productId: item.productId._id,
        quantity: item.quantity,
        price,
      }
    })

    const newOrder = new Order({
      userId: userId,
      deliveryAddress: defaultAddress._id,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: 'pending',
      items: orderItems,
    })

    await newOrder.save()

    // Clear the cart
    cart.items = []
    await cart.save()

    for (const item of orderItems) {
      const product = await Product.findById(item.productId)
      if (product) {
        if (product.stockCount < item.quantity) {
          throw new Error(
            `Insufficient stock for product ${product.title} (ID: ${item.productId})`
          )
        }
        product.stockCount -= item.quantity
        await product.save()
      }
    }

    return { success: true, order: newOrder }
  } catch (error) {
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
    throw error
  }
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
    res.status(500).json({
      success: false,
      message: 'Failed to check order status.',
      error: error.message,
    })
  }
}