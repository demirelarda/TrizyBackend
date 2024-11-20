const router = require("express").Router()
const authController = require("../controllers/authController")


router.post("/register", authController.createUser)

router.post("/login", authController.loginUser)

router.post("/refresh", authController.refreshToken)

router.post("/logout", authController.logoutUser)

router.post("/check-tokens", authController.checkTokens)


module.exports = router