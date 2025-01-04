const TrendingSearch = require('../models/TrendingSearch')

exports.getTrendingSearches = async (req, res) => {
  try {
    const trendingSearches = await TrendingSearch.find()
      .sort({ occurrenceCount: -1 })
      .limit(5) 
      .select('trendingSearchTerm occurrenceCount') 

    res.status(200).json({
      success: true,
      trendingSearches,
    })
  } catch (error) {
    console.error('Error fetching trending searches:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trending searches',
      error: error.message,
    })
  }
}