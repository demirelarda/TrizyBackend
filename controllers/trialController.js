const mongoose = require('mongoose')
const Trial = require('../models/Trial')
const TrialProduct = require('../models/TrialProduct')
const Subscription = require('../models/Subscription')

async function checkActiveSubscription(userId) {
  const activeSubscription = await Subscription.findOne({
    userId: userId,
    isActive: true,
    status: 'active'
  })
  return !!activeSubscription
}

exports.createTrial = async (req, res) => {
  try {
    const { trialProductId } = req.body
    const userId = req.user.id

    const isSubscribed = await checkActiveSubscription(userId)
    if (!isSubscribed) {
      return res.status(403).json({
        success: false,
        message: 'You must have an active subscription to create a trial.',
      })
    }

    const activeTrial = await Trial.findOne({
      userId: userId,
      status: { $in: ['shipping', 'active'] },
    })
    if (activeTrial) {
      return res.status(403).json({
        success: false,
        message: 'You already have an active trial. Please complete it before creating a new one.',
      })
    }

    const trialProduct = await TrialProduct.findById(trialProductId)
    if (!trialProduct) {
      return res.status(404).json({
        success: false,
        message: 'Trial product not found.',
      })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() + 2)

    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + trialProduct.trialPeriod)

    const trial = new Trial({
      userId: userId,
      trialProductId: trialProductId,
      startDate,
      endDate,
      status: 'shipping',
      feedback: null,
    })

    const savedTrial = await trial.save()

    return res.status(201).json({
      success: true,
      message: 'Trial created successfully.',
      trial: savedTrial,
    })
  } catch (error) {
    console.error('Error creating trial:', error)
    return res.status(500).json({
      success: false,
      message: 'Failed to create trial.',
      error: error.message,
    })
  }
}

exports.getTrialDetails = async (req, res) => {
    try {
      const userId = req.user.id
  
      const trial = await Trial.findOne({
        userId: userId,
        status: { $in: ['shipping', 'active'] },
      }).populate({
        path: 'trialProductId',
        select: 'title trialPeriod imageURLs',
      })
  
      if (!trial) {
        return res.status(404).json({
          success: false,
          message: 'No active trial found.',
        })
      }
  
      return res.status(200).json({
        success: true,
        message: 'Trial details retrieved successfully.',
        trial,
      })
    } catch (error) {
      console.error('Error fetching trial details:', error)
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch trial details.',
        error: error.message,
      })
    }
  }