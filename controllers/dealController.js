const Deal = require('../models/Deal')

exports.getDeals = async (req, res) => {
  try {
    const deals = await Deal.find().sort({ dealOrder: 1 })
    res.status(200).json({ deals: deals })
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch deals', error })
  }
}