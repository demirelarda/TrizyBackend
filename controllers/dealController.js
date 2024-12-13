const Deal = require('../models/Deal')

exports.getDeals = async (req, res) => {
  try {
    const deals = await Deal.find().sort({ dealOrder: 1 })
    res.status(200).json(deals)
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deals', error })
  }
}

exports.createDeal = async (req, res) => {
  try {
    const { dealOrder, imageUrl, title, description, action, aspectRatio } = req.body

    const newDeal = new Deal({
      dealOrder,
      imageUrl,
      title,
      description,
      action,
      aspectRatio,
    })

    await newDeal.save()
    res.status(201).json({ message: 'Deal created successfully', deal: newDeal })
  } catch (error) {
    res.status(500).json({ message: 'Failed to create deal', error })
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