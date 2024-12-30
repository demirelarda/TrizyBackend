const Product = require('../models/Product')
const Category = require('../models/Category')
const SearchTerm = require('../models/SearchTerm')
const ProductView = require('../models/ProductView')


exports.getProductsByCategoryId = async (req, res) => {
  try {
    const { categoryId } = req.params
    const { page = 1, limit = 10 } = req.query

    const subCategories = await Category.find({ parentCategory: categoryId, isActive: true })  // TODO: Use this to get all category ids

    const allCategoryIds = [categoryId, ...(await getAllSubCategoryIds(categoryId))] // TODO: HERE WE CALL THE getAllSubCateogryIds again, don't do this, instead use the above subCategories it would improve the performance

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

    if (req.user) {
      (async () => {
        try {
          await SearchTerm.create({
            userId: req.user.id,
            searchTerm: query,
          })
        } catch (err) {
          console.error('Failed to log search term:', err.message)
        }
      })()
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

  
exports.getSingleProduct = async (req, res) => {
  try {
    const { productId } = req.params

    const product = await Product.findById(productId)
      .populate('category', 'name description')
      .exec()

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found.',
      })
    }

    if (req.user) {
      (async () => {
        try {
          await ProductView.create({
            userId: req.user.id,
            productId,
          })
        } catch (err) {
          console.error('Failed to log product view:', err.message)
        }
      })()
    }

    res.status(200).json({
      success: true,
      product,
    })
  } catch (error) {
    console.error('Error fetching product:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch product.',
      error: error.message,
    })
  }
}