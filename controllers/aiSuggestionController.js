const { getSuggestedProducts } = require('../ai/generateSuggestions')

exports.getProductSuggestions = async (req, res) => {
  try {
    const userId = req.user.id
    const suggestions = await getSuggestedProducts(userId)

    res.status(200).json({
      success: true,
      suggestions,
    })
  } catch (error) {
    console.error('Error fetching product suggestions:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product suggestions.',
      error: error.message,
    })
  }
}