const TrialProduct = require('../models/TrialProduct')
const Category = require('../models/Category')


exports.getTrialProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params
    const { page = 1, limit = 10 } = req.query

    const subCategories = await Category.find({ parentCategory: categoryId, isActive: true }) // TODO: Use this to get all category ids

    const allCategoryIds = [categoryId, ...(await getAllSubCategoryIds(categoryId))] // TODO: HERE WE CALL THE getAllSubCateogryIds again, don't do this, instead use the above subCategories it would improve the performance

    const trialProducts = await TrialProduct.find({ category: { $in: allCategoryIds } })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('category', 'name description')
      .exec()

    const totalTrialProducts = await TrialProduct.countDocuments({ category: { $in: allCategoryIds } })

    res.status(200).json({
      success: true,
      subCategories,
      trialProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTrialProducts / limit),
        totalTrialProducts,
      },
    })
  } catch (error) {
    console.error('Error fetching trial products by category:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trial products by category',
      error: error.message,
    })
  }
}

exports.searchTrialProducts = async (req, res) => {
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

    const [trialProducts, totalTrialProducts] = await Promise.all([
      TrialProduct.find(searchFilter)
        .sort({ score: { $meta: 'textScore' } })
        .skip(skip)
        .limit(Number(limit))
        .populate('category', 'name description'),
      TrialProduct.countDocuments(searchFilter),
    ])

    const totalPages = Math.ceil(totalTrialProducts / limit)

    return res.status(200).json({
      success: true,
      trialProducts,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalTrialProducts,
        limit: Number(limit),
      },
    })
  } catch (error) {
    console.error('Error searching trial products:', error)
    res.status(500).json({
      success: false,
      message: 'An error occurred while searching for trial products.',
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

exports.getSingleTrialProduct = async (req, res) => {
  try {
    const { trialProductId } = req.params

    const trialProduct = await TrialProduct.findById(trialProductId)
      .populate('category', 'name description')
      .exec()

    if (!trialProduct) {
      return res.status(404).json({
        success: false,
        message: 'Trial product not found.',
      })
    }

    res.status(200).json({
      success: true,
      trialProduct,
    })
  } catch (error) {
    console.error('Error fetching trial product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trial product.',
      error: error.message,
    })
  }
}

exports.getLatestTrialProducts = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query

    const trialProducts = await TrialProduct.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate('category', 'name description')
      .exec()

    const totalTrialProducts = await TrialProduct.countDocuments()

    res.status(200).json({
      success: true,
      trialProducts,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalTrialProducts / limit),
        totalTrialProducts,
      },
    })
  } catch (error) {
    console.error('Error fetching latest trial products:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest trial products',
      error: error.message,
    })
  }
}