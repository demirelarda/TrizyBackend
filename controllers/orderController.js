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
        select: 'title price',
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