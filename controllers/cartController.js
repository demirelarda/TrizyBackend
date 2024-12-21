const Cart = require("../models/Cart")
const Product = require("../models/Product")

exports.createEmptyCartForUser = async (userId) => {
  try {
    const newCart = new Cart({
      ownerId: userId,
      items: [],
    })

    await newCart.save()
    return { success: true, cart: newCart }
  } catch (error) {
    console.error("Error creating empty cart for user:", error)
    return { success: false, error }
  }
}


exports.getCart = async (req, res) => {
  try {
    const userId = req.user.id

    const cart = await Cart.findOne({ ownerId: userId })
      .populate({
        path: 'items.productId',
        select: 'imageURLs title cargoWeight stockCount price',
      })

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found',
      })
    }

    const transformedItems = cart.items.map(item => ({
      productId: item.productId._id,
      title: item.productId.title,
      imageURL: item.productId.imageURLs[0] || null,
      cargoWeight: item.productId.cargoWeight,
      stockCount: item.productId.stockCount,
      price: item.productId.price,
      quantity: item.quantity,
    }))

    res.status(200).json({
      success: true,
      cart: {
        ownerId: cart.ownerId,
        items: transformedItems,
        updatedAt: cart.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error fetching cart:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch cart',
      error: error.message,
    })
  }
}


exports.addItemToCart = async (req, res) => {
    try {
      const { productId, quantity } = req.body
      const userId = req.user.id
  
      // Check if product exists
      const product = await Product.findById(productId)
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        })
      }
  
      // Check product stock
      if (product.stockCount < quantity) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient stock for the requested quantity',
        })
      }
  
      // Find or create cart for the user
      let cart = await Cart.findOne({ ownerId: userId })
      if (!cart) {
        cart = new Cart({ ownerId: userId, items: [] })
      }
  
      // Check if product already exists in the cart
      const existingCartItem = cart.items.find((item) =>
        item.productId.equals(productId)
      )
  
      if (existingCartItem) {
        // Update the quantity if product already exists in cart
        existingCartItem.quantity += quantity
  
        // check updated quantity doesn't exceed stock
        if (existingCartItem.quantity > product.stockCount) {
          return res.status(400).json({
            success: false,
            message: 'Not enough stock to fulfill the cart update',
            updatedQuantity: existingCartItem.quantity - 1,
          })
        }
      } else {
        // Add new product to the cart
        cart.items.push({ productId, quantity })
      }
  
      await cart.save()
  
      res.status(200).json({
        success: true,
        message: 'Item added to cart successfully',
        cart: {
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      })
    } catch (error) {
      console.error('Error adding item to cart:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to add item to cart',
        error: error.message,
      })
    }
}


exports.deleteItemFromCart = async (req, res) => {
    try {
      const { productId } = req.params
      const userId = req.user.id
  
      const cart = await Cart.findOne({ ownerId: userId })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        })
      }
  
      const itemIndex = cart.items.findIndex((item) =>
        item.productId.equals(productId)
      )
  
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart',
        })
      }
  
      // Remove the item from the cart
      cart.items.splice(itemIndex, 1)
      await cart.save()
  
      res.status(200).json({
        success: true,
        message: 'Item removed from cart successfully',
        cart: {
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      })
    } catch (error) {
      console.error('Error removing item from cart:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to remove item from cart',
        error: error.message,
      })
    }
}


exports.decrementQuantity = async (req, res) => {
    try {
      const { productId } = req.body
      const userId = req.user.id
  
      const cart = await Cart.findOne({ ownerId: userId })
      if (!cart) {
        return res.status(404).json({
          success: false,
          message: 'Cart not found',
        })
      }
  
      const itemIndex = cart.items.findIndex((item) =>
        item.productId.equals(productId)
      )
  
      if (itemIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Item not found in cart',
        })
      }
  
      cart.items[itemIndex].quantity -= 1
  
      // if the quantity is 0 or less remove the item from the cart
      if (cart.items[itemIndex].quantity <= 0) {
        cart.items.splice(itemIndex, 1)
      }
  
      await cart.save()
  
      res.status(200).json({
        success: true,
        message: 'Quantity decremented successfully',
        cart: {
          items: cart.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          })),
        },
      })
    } catch (error) {
      console.error('Error decrementing item quantity in cart:', error)
      res.status(500).json({
        success: false,
        message: 'Failed to decrement item quantity',
        error: error.message,
      })
    }
}