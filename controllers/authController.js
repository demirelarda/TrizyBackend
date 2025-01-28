const User = require("../models/User")
const jwt = require("jsonwebtoken")
const argon2 = require("argon2")
const Subscription = require("../models/Subscription")
const Like = require("../models/Like")
const Cart = require("../models/Cart")
const { createEmptyCartForUser } = require("../controllers/cartController")

// CREATE USER
exports.createUser = async (req, res) => {
  try {
    
    const hashedPassword = await argon2.hash(req.body.password, {
      type: argon2.argon2id,
    })

    const newUser = new User({
      userFirstName: req.body.userFirstName,
      userLastName: req.body.userLastName,
      email: req.body.email,
      password: hashedPassword,
    })

    const savedUser = await newUser.save()

    // Create an empty cart for the user
    const cartResult = await createEmptyCartForUser(savedUser._id)
    if (!cartResult.success) {
      await User.findByIdAndDelete(savedUser._id)
      return res.status(500).json({
        success: false,
        message: "Signup failed: Unable to create user cart.",
      })
    }

    const accessToken = jwt.sign(
      {
        id: savedUser._id,
        email: savedUser.email,
        userFirstName: savedUser.userFirstName,
        userLastName: savedUser.userLastName,
        emailVerified: savedUser.emailVerified,
      },
      process.env.JWT_SEC,
      { expiresIn: "1h" }
    )

    const refreshToken = jwt.sign(
      {
        id: savedUser._id,
      },
      process.env.JWT_REFRESH_SEC,
      { expiresIn: "7d" }
    )

    savedUser.refreshToken = refreshToken
    await savedUser.save()

    const { password, ...others } = savedUser._doc

    res.status(201).json({ ...others, isSubscriber: false, accessToken, refreshToken })
  } catch (error) {
    console.error("Error during user signup:", error)
    res.status(500).json({ success: false, message: "Signup failed", error: error.message })
  }
}

// LOGIN USER
exports.loginUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(401).json("Wrong Login Details")

    // Verify the password with Argon2
    const isPasswordValid = await argon2.verify(user.password, req.body.password)
    if (!isPasswordValid) {
      return res.status(401).json("Wrong Login Details")
    }

    // Check if user has an active subscription
    const activeSubscription = await Subscription.findOne({
      userId: user._id,
      isActive: true,
      status: "active",
    })

    const isSubscriber = !!activeSubscription

    // Generate Access Token
    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        userFirstName: user.userFirstName,
        userLastName: user.userLastName,
        emailVerified: user.emailVerified,
      },
      process.env.JWT_SEC,
      { expiresIn: "1h" }
    )

    let refreshToken

    try {
      // Verify the existing refresh token
      jwt.verify(user.refreshToken, process.env.JWT_REFRESH_SEC)
      refreshToken = user.refreshToken
    } catch (error) {
      // If the token has expired, create a new refresh token
      refreshToken = jwt.sign({ id: user._id }, process.env.JWT_REFRESH_SEC, { expiresIn: "7d" })
      user.refreshToken = refreshToken
      await user.save()
    }

    // Fetch liked product IDs
    const likedProducts = await Like.find({ userId: user._id }).select("productId")
    const likedProductIds = likedProducts.map((like) => like.productId.toString())

    // Fetch cart item IDs
    const cart = await Cart.findOne({ ownerId: user._id }).select("items")
    const cartItemIds = cart ? cart.items.map((item) => item.productId.toString()) : []

    const { password, stripeCustomerId, ...others } = user._doc

    res.status(200).json({
      ...others,
      isSubscriber,
      accessToken,
      refreshToken,
      likedProductIds,
      cartItemIds,
    })
  } catch (error) {
    console.error("Error logging in user:", error.message)
    res.status(500).json(error)
  }
}

// REFRESH TOKEN
exports.refreshToken = async (req, res) => {
  const { token } = req.body

  if (!token) {
    return res.status(403).json("Refresh token is required")
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SEC)
    const user = await User.findById(decoded.id)

    if (!user || user.refreshToken !== token) {
      return res.status(403).json("Invalid refresh token")
    }

    const newAccessToken = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SEC,
      { expiresIn: "1h" }
    )

    const newRefreshToken = jwt.sign(
      { id: user._id },
      process.env.JWT_REFRESH_SEC,
      { expiresIn: "7d" }
    )

    user.refreshToken = newRefreshToken
    await user.save()

    res.status(200).json({ accessToken: newAccessToken, refreshToken: newRefreshToken })
  } catch (error) {
    res.status(500).json({ message: "Internal Server Error", error: error.message })
  }
}

// LOGOUT USER
exports.logoutUser = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.status(403).json("User not found")

    user.refreshToken = ""
    await user.save()

    res.status(200).json("User logged out")
  } catch (error) {
    res.status(500).json(error)
  }
}

// CHECK TOKENS
exports.checkTokens = async (req, res) => {
  const { accessToken, refreshToken } = req.body

  if (!accessToken || !refreshToken) {
    return res.status(400).json({
      success: false,
      message: "Access token and refresh token are required",
    })
  }

  try {
    jwt.verify(accessToken, process.env.JWT_SEC, async (err) => {
      if (!err) {
        return res.status(200).json({
          success: true,
          message: "Access token is still valid",
          accessToken,
          refreshToken,
        })
      }

      const user = await User.findOne({ refreshToken })
      if (!user) {
        return res.status(403).json({
          success: false,
          message: "Invalid refresh token",
        })
      }

      jwt.verify(refreshToken, process.env.JWT_REFRESH_SEC, async (err) => {
        if (err) {
          return res.status(403).json({
            success: false,
            message: "Invalid or expired refresh token",
          })
        }

        const newAccessToken = jwt.sign(
          {
            id: user._id,
            email: user.email,
            userFirstName: user.userFirstName,
            userLastName: user.userLastName,
            emailVerified: user.emailVerified,
          },
          process.env.JWT_SEC,
          { expiresIn: "1h" }
        )

        const newRefreshToken = jwt.sign(
          { id: user._id },
          process.env.JWT_REFRESH_SEC,
          { expiresIn: "7d" }
        )

        user.refreshToken = newRefreshToken
        await user.save()

        return res.status(200).json({
          success: true,
          message: "Access token refreshed",
          accessToken: newAccessToken,
          refreshToken: newRefreshToken,
        })
      })
    })
  } catch (error) {
    console.error("Error in checkTokens function:", error)
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    })
  }
}