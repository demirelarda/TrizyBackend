const Deal = require('../models/Deal')

exports.getDeals = async (req, res) => {
  try {
    const deals = await Deal.find().sort({ dealOrder: 1 })
    res.status(200).json({ deals: deals })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deals', error })
  }
}

exports.createDeal = async (req, res) => {
    try {
      const deals = req.body
  
      const dealsToCreate = Array.isArray(deals) ? deals : [deals]
  
      const createdDeals = await Deal.insertMany(dealsToCreate)
  
      res.status(201).json({ message: 'Deals created successfully', deals: createdDeals })
    } catch (error) {
      if (error.code === 11000) {
        res.status(400).json({ message: 'Deal order must be unique', error })
      } else {
        res.status(500).json({ message: 'Failed to create deals', error })
      }
    }
  }

exports.updateDeal = async (req, res) => {
  try {
    const { id } = req.params
    const updates = req.body

    const updatedDeal = await Deal.findByIdAndUpdate(id, updates, { new: true })
    if (!updatedDeal) {
      return res.status(404).json({ message: 'Deal not found' })
    }

    res.status(200).json({ message: 'Deal updated successfully', deal: updatedDeal })
  } catch (error) {
    res.status(500).json({ message: 'Failed to update deal', error })
  }
}

exports.deleteDeal = async (req, res) => {
  try {
    const { id } = req.params

    const deletedDeal = await Deal.findByIdAndDelete(id)
    if (!deletedDeal) {
      return res.status(404).json({ message: 'Deal not found' })
    }

    res.status(200).json({ message: 'Deal deleted successfully', deal: deletedDeal })
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete deal', error })
  }
}