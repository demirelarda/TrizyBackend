const Order = require('../models/Order')
const Product = require('../models/Product')
const BestOfProduct = require('../models/BestOfProduct')

const setBestOfMonthProducts = async () => {
  const maxRetries = 3

  const executeJob = async (attempt = 1) => {
    try {
      console.log(`Starting best of month products cron job... (Attempt ${attempt})`)

      const now = new Date()
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      startOfLastMonth.setHours(0, 0, 0, 0)

      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)

      console.log(`Start of Last Month: ${startOfLastMonth}`)
      console.log(`End Date (today): ${endDate}`)

      const mostOrderedProducts = await Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startOfLastMonth, $lte: endDate },
          },
        },
        {
          $unwind: '$items',
        },
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
        console.log('No orders found for the last month.')
        return
      }

      const productIds = mostOrderedProducts.map((product) => product._id)
      console.log('Product IDs:', productIds)

      const productsWithRatings = await Product.find({ _id: { $in: productIds } })
        .select('averageRating title description tags')
        .sort({ averageRating: -1 })
        .limit(10)


      // Delete previous best of month products
      await BestOfProduct.deleteMany({ period: 'month' })

      const bestOfMonthProducts = new BestOfProduct({
        period: 'month',
        productIds: productsWithRatings.map((product) => product._id),
        startDate: startOfLastMonth,
      })

      await bestOfMonthProducts.save()
      console.log('Best of month products saved successfully:', bestOfMonthProducts)
    } catch (error) {
      console.error(`Error in setBestOfMonthProducts cron job (Attempt ${attempt}):`, error)
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

module.exports = setBestOfMonthProducts