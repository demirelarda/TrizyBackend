const Order = require('../models/Order')


exports.getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'items.productId',
        select: 'title price imageURLs',
      })
      .populate({
        path: 'deliveryAddress',
        select: '_id city state country address',
      })

    const totalOrders = await Order.countDocuments({ userId })

    res.status(200).json({
      success: true,
      orders,
      currentPage: page,
      totalPages: Math.ceil(totalOrders / limit),
    })
  } catch (error) {
    console.error('Error fetching user orders:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch orders',
    })
  }
}

exports.cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id
    const { orderId } = req.params

    const order = await Order.findOne({ _id: orderId, userId })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found',
      })
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Only orders with "pending" status can be cancelled',
      })
    }

    order.status = 'cancelled'
    await order.save()

    // TODO: INCREMENT STOCK COUNT

    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      order,
    })
  } catch (error) {
    console.error('Error cancelling order:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
    })
  }
}


exports.getOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id
    const { orderId } = req.params

    const order = await Order.findOne({ _id: orderId, userId })
      .populate({
        path: 'deliveryAddress',
        select: 'fullName phoneNumber address city state postalCode country',
      })
      .populate({
        path: 'items.productId',
        select: 'imageURLs title',
      })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found or does not belong to the user.',
      })
    }

    const orderDetails = {
      orderId: order._id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item) => ({
        productId: item.productId._id,
        productTitle: item.productId.title,
        productImage: item.productId.imageURLs[0] || null,
        quantity: item.quantity,
        price: item.price,
      })),
    }

    res.status(200).json({
      success: true,
      order: orderDetails,
    })
  } catch (error) {
    console.error('Error fetching order details:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch order details.',
    })
  }
}

exports.getLatestOrderDetails = async (req, res) => {
  try {
    const userId = req.user.id

    const order = await Order.findOne({ userId })
      .sort({ createdAt: -1 }) 
      .populate({
        path: 'deliveryAddress',
        select: 'fullName phoneNumber address city state postalCode country',
      })
      .populate({
        path: 'items.productId',
        select: 'imageURLs title',
      })

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'No orders found for the user.',
      })
    }

    const orderDetails = {
      orderId: order._id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
      createdAt: order.createdAt,
      deliveryAddress: order.deliveryAddress,
      items: order.items.map((item) => ({
        productId: item.productId._id,
        productTitle: item.productId.title,
        productImage: item.productId.imageURLs[0] || null,
        quantity: item.quantity,
        price: item.price,
      })),
    }

    res.status(200).json({
      success: true,
      order: orderDetails,
    })
  } catch (error) {
    console.error('Error fetching latest order details:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest order details.',
    })
  }
}