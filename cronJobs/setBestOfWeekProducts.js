const Order = require('../models/Order')
const Product = require('../models/Product')
const BestOfProduct = require('../models/BestOfProduct')

const setBestOfWeekProducts = async () => {
  const maxRetries = 3

  const executeJob = async (attempt = 1) => {
    try {
      console.log(`Starting best of week products cron job... (Attempt ${attempt})`)

      const now = new Date()
      const startOfLastWeek = new Date(now)
      startOfLastWeek.setDate(now.getDate() - now.getDay() - 7)
      startOfLastWeek.setHours(0, 0, 0, 0)

      const endOfLastWeek = new Date(now)
      endOfLastWeek.setDate(now.getDate() - now.getDay())
      endOfLastWeek.setHours(23, 59, 59, 999)

      console.log(`Fetching orders between ${startOfLastWeek} and ${endOfLastWeek}`)

      const mostOrderedProducts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfLastWeek, $lte: endOfLastWeek },
          },
        },
        { $unwind: '$items' },
        {
          $group: {
            _id: '$items.productId',
            totalOrders: { $sum: '$items.quantity' },
          },
        },
        { $sort: { totalOrders: -1 } },
        { $limit: 10 }, 
      ])

      console.log('Most ordered products:', mostOrderedProducts)

      if (mostOrderedProducts.length === 0) {
        console.log('No orders found for the last week.')
        return
      }

      const productIds = mostOrderedProducts.map((product) => product._id)

      const productsWithRatings = await Product.find({ _id: { $in: productIds } })
        .select('averageRating')
        .sort({ averageRating: -1 })
        .limit(10)

      console.log('Products sorted by average rating:', productsWithRatings)

      // Delete previous best of week products
      await BestOfProduct.deleteMany({ period: 'week' })

      const bestOfWeekProducts = new BestOfProduct({
        period: 'week',
        productIds: productsWithRatings.map((product) => product._id),
        startDate: startOfLastWeek,
      })

      await bestOfWeekProducts.save()

      console.log('Best of week products saved successfully:', bestOfWeekProducts)
    } catch (error) {
      console.error(`Error in setBestOfWeekProducts cron job (Attempt ${attempt}):`, error)

      if (attempt < maxRetries) {
        console.log('Retrying...')
        await executeJob(attempt + 1)
      } else {
        console.error('Max retry attempts reached. Cron job failed.')
      }
    }
  }

  await executeJob()
}

module.exports = setBestOfWeekProducts