const Category = require('../models/Category')

// Get all root categories (categories without a parent)
exports.getRootCategories = async (req, res) => {
  try {
    const rootCategories = await Category.find({ parentCategory: null, isActive: true })
    res.status(200).json({
      success: true,
      categories: rootCategories,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch root categories',
      error: error.message,
    })
  }
}

// Get all child categories for a given parent category ID
exports.getChildCategories = async (req, res) => {
  const { parentId } = req.params

  try {
    const childCategories = await Category.find({ parentCategory: parentId, isActive: true })
    res.status(200).json({
      success: true,
      categories: childCategories,
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to fetch child categories',
      error: error.message,
    })
  }
}