const User = require('../models/User')
const Subscription = require('../models/Subscription')

exports.getUserProfileDetails = async (req, res) => {
  try {
    const userId = req.user.id

    const user = await User.findById(userId).select(
      'userFirstName userLastName email'
    )

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      })
    }

    const subscription = await Subscription.findOne({
      userId,
      isActive: true,
      status: 'active',
    })

    const response = {
      userFirstName: user.userFirstName,
      userLastName: user.userLastName,
      email: user.email,
      hasActiveSubscription: !!subscription,
    }

    res.status(200).json({
      success: true,
      data: response,
    })
  } catch (error) {
    console.error('Error fetching user profile details:', error.message)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile details',
    })
  }
}