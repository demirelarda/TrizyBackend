const UserAddress = require('../models/UserAddress')

exports.createAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { fullName, phoneNumber, address, city, state, postalCode, country, addressType, isDefault } = req.body

    const newAddress = new UserAddress({
      userId,
      fullName,
      phoneNumber,
      address,
      city,
      state,
      postalCode,
      country,
      addressType,
      isDefault,
    })

    await newAddress.save()
    res.status(201).json({
      success: true,
      message: 'Address created successfully',
      address: newAddress,
    })
  } catch (error) {
    console.error('Error creating address:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to create address',
      error: error.message,
    })
  }
}


exports.getUserAddresses = async (req, res) => {
  try {
    const userId = req.user.id

    const addresses = await UserAddress.find({ userId })
    res.status(200).json({
      success: true,
      addresses,
    })
  } catch (error) {
    console.error('Error fetching user addresses:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to fetch addresses',
      error: error.message,
    })
  }
}


exports.deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { addressId } = req.params

    const address = await UserAddress.findById(addressId)

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      })
    }

    if (address.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this address',
      })
    }

    await UserAddress.findByIdAndDelete(addressId)
    res.status(200).json({
      success: true,
      message: 'Address deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting address:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to delete address',
      error: error.message,
    })
  }
}


exports.updateAddress = async (req, res) => {
  try {
    const userId = req.user.id
    const { addressId } = req.params
    const { fullName, phoneNumber, address, city, state, postalCode, country, addressType, isDefault } = req.body

    const addressToUpdate = await UserAddress.findById(addressId)

    if (!addressToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Address not found',
      })
    }

    if (addressToUpdate.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this address',
      })
    }

    addressToUpdate.fullName = fullName || addressToUpdate.fullName
    addressToUpdate.phoneNumber = phoneNumber || addressToUpdate.phoneNumber
    addressToUpdate.address = address || addressToUpdate.address
    addressToUpdate.city = city || addressToUpdate.city
    addressToUpdate.state = state || addressToUpdate.state
    addressToUpdate.postalCode = postalCode || addressToUpdate.postalCode
    addressToUpdate.country = country || addressToUpdate.country
    addressToUpdate.addressType = addressType || addressToUpdate.addressType
    addressToUpdate.isDefault = isDefault || addressToUpdate.isDefault

    await addressToUpdate.save()

    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      address: addressToUpdate,
    })
  } catch (error) {
    console.error('Error updating address:', error)
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message,
    })
  }
}