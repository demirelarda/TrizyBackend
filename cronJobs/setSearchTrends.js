const SearchTerm = require('../models/SearchTerm')
const TrendingSearch = require('../models/TrendingSearch')

const setSearchTrends = async () => {
  const maxRetries = 3

  const executeJob = async (attempt = 1) => {
    try {
      console.log(`Starting trending search terms cron job... (Attempt ${attempt})`)

      const oneMonthAgo = new Date()
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1)

      const searchTerms = await SearchTerm.aggregate([
        {
          $match: {
            createdAt: { $gte: oneMonthAgo },
          },
        },
        {
          $project: {
            normalizedSearchTerm: { $toLower: '$searchTerm' },
          },
        },
        {
          $group: {
            _id: '$normalizedSearchTerm',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
      ])

      console.log('Found trending search terms:', searchTerms)

      const trendingSearches = searchTerms.map((term) => ({
        trendingSearchTerm: term._id,
        occurrenceCount: term.count,
      }))

      console.log('Inserting new trending search terms...')
      await TrendingSearch.insertMany(trendingSearches)
      console.log('New trending search terms inserted:', trendingSearches)

      console.log('Clearing previous trending search terms...')
      await TrendingSearch.deleteMany({
        _id: { $nin: trendingSearches.map((t) => t._id) },
      })
      console.log('Cleared previous trending search terms.')

      console.log('Trending search terms cron job completed successfully.')
    } catch (error) {
      console.error(`Error in setSearchTrends cron job (Attempt ${attempt}):`, error)

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

module.exports = setSearchTrends