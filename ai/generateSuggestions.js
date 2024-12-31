const fs = require('fs')
const path = require('path')
const { GoogleGenerativeAI } = require('@google/generative-ai')
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
const aiModel = "gemini-1.5-flash"
const SearchTerm = require('../models/SearchTerm')
const Order = require('../models/Order')
const Product = require('../models/Product') 
const ProductView = require('../models/ProductView')
const Review = require('../models/Review')
const mongoose = require('mongoose')

const generateSystemPrompt = () => {
  const filePath = path.join(__dirname, 'prompts/aiSuggestionSystemPrompt.txt')
  return fs.readFileSync(filePath, 'utf8')
}

const finalizerSystemPrompt = () => {
  const filePath = path.join(__dirname, 'prompts/finalizerAiSystemPrompt.txt')
  return fs.readFileSync(filePath, 'utf8')
}

const generateUserPrompt = (placeholders) => {
  const { searchTerms, purchaseHistory, viewedProducts, reviews} = placeholders
  const filePath = path.join(__dirname, 'prompts/aiSuggestionUserPrompt.txt')
  let userPrompt = fs.readFileSync(filePath, 'utf8')
  userPrompt = userPrompt.replace('{search_terms}', searchTerms)
  userPrompt = userPrompt.replace('{purchase_history}', purchaseHistory)
  userPrompt = userPrompt.replace('{viewed_products}', viewedProducts)
  userPrompt = userPrompt.replace('{reviews}', reviews)
  return userPrompt
}

/*
User Prompt Structure:

Search Terms (Search History): {search_terms}

Purchase History: {purchase_history}

Viewed Products: {viewed_products}

Reviews: {reviews}

*/


const getSearchHistory = async (userId) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new Error('Invalid user ID')
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const searchTerms = await SearchTerm.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .sort({ createdAt: -1 })
      .select('searchTerm')
      .lean()

    const searchTermsFormatted = searchTerms.map((term) => term.searchTerm).join(', ')


    return searchTermsFormatted
  } catch (error) {
    console.error(`Error fetching search history for User ID ${userId}:`, error.message)
    return ''
  }
}


const getPurchaseHistory = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const deliveredOrders = await Order.find({
      userId,
      status: 'delivered',
    })
      .select('items')
      .lean()

    const productIds = deliveredOrders
      .flatMap((order) => order.items.map((item) => item.productId))

    if (productIds.length === 0) {
      console.log(`No purchase history found for User ID: ${userId}`)
      return ''
    }

    const products = await Product.find({ _id: { $in: productIds } })
      .select('title') 
      .lean()

    const purchaseHistory = products.map((product) => product.title).join(', ')


    return purchaseHistory
  } catch (error) {
    console.error(`Error fetching purchase history for User ID ${userId}:`, error.message)
    return ''
  }
}


const getViewedProducts = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const viewedProducts = await ProductView.find({
      userId,
      createdAt: { $gte: thirtyDaysAgo },
    })
      .select('productId')
      .lean()

    const productIds = [...new Set(viewedProducts.map((view) => view.productId))]

    if (productIds.length === 0) {
      console.log(`No viewed products found for User ID: ${userId}`)
      return ''
    }

    const products = await Product.find({ _id: { $in: productIds } })
      .select('title')
      .lean()

    const viewedProductTitles = products.map((product) => product.title).join(', ')


    return viewedProductTitles
  } catch (error) {
    console.error(`Error fetching viewed products for User ID ${userId}:`, error.message)
    return ''
  }
}


const getReviews = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required')
    }

    const reviews = await Review.find({ userId })
      .populate({
        path: 'productId',
        select: 'title',
      })
      .select('rating comment productId')
      .lean()

    if (reviews.length === 0) {
      console.log(`No reviews found for User ID: ${userId}`)
      return ''
    }

    const reviewText = reviews
      .map((review) => {
        const productName = review.productId?.title || 'Unknown Product'
        const rating = review.rating
        const comment = review.comment || 'No comment provided.'
        return `Product Name: ${productName}\nRating Given: ${rating}/5\nUser Comment: ${comment}`
      })
      .join('\n\n')

    return reviewText
  } catch (error) {
    console.error(`Error fetching reviews for User ID ${userId}:`, error.message)
    return ''
  }
}


const generateQueries = async (searchTerms, purchaseHistory, viewedProducts, reviews) => {
    const systemPrompt = generateSystemPrompt()
    const userPrompt = generateUserPrompt({
      searchTerms,
      purchaseHistory,
      viewedProducts,
      reviews
    })
  
    const model = genAI.getGenerativeModel({
      model: aiModel,
      systemInstruction: systemPrompt,
    })
  
    const result = await model.generateContent(userPrompt)
    const response = await result.response
    let text = await response.text()
    text = text.replace(/```json|```/g, '').trim()
    const jsonResponse = JSON.parse(text)
    return jsonResponse.queries
  
}


const generateFinalProductSuggestions = async (finalPrompt) => {
  try {
    const systemPrompt = finalizerSystemPrompt()

    const model = genAI.getGenerativeModel({
      model: aiModel,
      systemInstruction: systemPrompt,
    })
  
    const result = await model.generateContent(finalPrompt)
    const response = await result.response
    let text = await response.text()
    text = text.replace(/```json|```/g, '').trim()
    const jsonResponse = JSON.parse(text)
    return jsonResponse
  } catch (error) {
    console.error(error)
  }

}


const searchForQueries = async (queries) => {
  try {
    const suggestedQueryResults = []
    const foundProductIds = new Set() 

    for (const queryObj of queries) {
      const { query, reason } = queryObj

      if (!query || query.trim() === '') {
        console.error(`Skipping empty or invalid query: ${query}`)
        continue
      }

      const searchFilter = {
        $text: { $search: query },
        _id: { $nin: Array.from(foundProductIds) },
      }

      const products = await Product.find(searchFilter)
        .select('_id title')
        .lean()

      products.forEach((product) => {
        suggestedQueryResults.push({
          _id: product._id.toString(),
          productName: product.title, 
        })

        foundProductIds.add(product._id.toString())
      })
    }

    const finalResult = { suggestedQueryResults }

    return finalResult
  } catch (error) {
    console.error('Error in searchForQueries:', error.message)
    return { suggestedQueryResults: [] }
  }
}


const getFinalSuggestedProducts = async (finalSuggestions) => {
  try {
    const productIds = finalSuggestions.suggestedProducts.map((product) => product._id)

    const products = await Product.find({ _id: { $in: productIds } })
      .select('-__v -createdAt -updatedAt')
      .lean()

    const enrichedSuggestions = finalSuggestions.suggestedProducts.map((suggestion) => {
      const product = products.find((p) => p._id.toString() === suggestion._id)
      if (product) {
        return {
          ...product,
          reason: suggestion.reason,
        }
      }
      return null
    }).filter(Boolean)

    return enrichedSuggestions
  } catch (error) {
    console.error('Error in getFinalSuggestedProducts:', error.message)
    return []
  }
}




const getSuggestedProducts = async (userId) => {
  const searchTerms = await getSearchHistory(userId)
  const purchaseHistory = await getPurchaseHistory(userId)
  const viewedProducts = await getViewedProducts(userId)
  const reviews = await getReviews(userId)

  const queries = await generateQueries(searchTerms, purchaseHistory, viewedProducts, reviews)
  const searchResults = await searchForQueries(queries)

  const userActivity = {
    searchTerms: searchTerms.split(', ').filter(Boolean),
    purchaseHistory: purchaseHistory.split(', ').filter(Boolean),
    viewedProducts: viewedProducts.split(', ').filter(Boolean),
    reviews: reviews.split('\n\n').filter(Boolean),
  }

  const finalPrompt = {
    suggestedQueryResults: searchResults.suggestedQueryResults,
    userActivity,
  }

  const finalPromptText = JSON.stringify(finalPrompt, null, 2)

  const finalSuggestions = await generateFinalProductSuggestions(finalPromptText)

  const returnedProducts = await getFinalSuggestedProducts(finalSuggestions)

  return returnedProducts
}


module.exports = { getSuggestedProducts }