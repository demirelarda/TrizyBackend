const express = require('express')
const router = express.Router()
const categoryController = require('../controllers/categoryController')

router.get('/get-root-categories', categoryController.getRootCategories)

router.get('/get-child-categories/:parentId', categoryController.getChildCategories)

module.exports = router