const Product = require('../models/Product')
const Category = require('../models/Category')


exports.getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params
    const { page = 1, limit = 10 } = req.query

    const subCategories = await Category.find({ parentCategory: categoryId, isActive: true })

    const allCategoryIds = [categoryId, ...(await getAllSubCategoryIds(categoryId))]

    const products = await Product.find({ category: { $in: allCategoryIds } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('category', 'name description')
      .exec()

    const totalProducts = await Product.countDocuments({ category: { $in: allCategoryIds } })

    res.status(200).json({
      success: true,
      subCategories, // include subcategories (first level only)
      products,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      },
    })
  } catch (error) {
    console.error('Error fetching products by category:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch products by category',
      error: error.message,
    })
  }
}


exports.searchProducts = async (req, res) => {
  try {
    const { query, categoryId, page = 1, limit = 10 } = req.query

    if (!query || query.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Search query is required.',
      })
    }

    const searchFilter = {
      $text: { $search: query },
    }

    if (categoryId) {
      searchFilter.category = categoryId
    }

    const skip = (page - 1) * limit

    const [products, totalProducts] = await Promise.all([
      Product.find(searchFilter)
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name description'),
      Product.countDocuments(searchFilter),
    ])

    const totalPages = Math.ceil(totalProducts / limit)

    return res.status(200).json({
      success: true,
      products,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalProducts,
        limit: Number(limit),
      },
    })
  } catch (error) {
    console.error('Error searching products:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while searching for products.',
      error: error.message,
    })
  }
}


const getAllSubCategoryIds = async (parentCategoryId) => {
    const subCategories = await Category.find({ parentCategory: parentCategoryId, isActive: true })
    const subCategoryIds = subCategories.map((sub) => sub._id)
  
    if (subCategoryIds.length > 0) {
      for (const subCategoryId of subCategoryIds) {
        const deeperSubCategoryIds = await getAllSubCategoryIds(subCategoryId)
        subCategoryIds.push(...deeperSubCategoryIds)
      }
    }
  
    return subCategoryIds
  }