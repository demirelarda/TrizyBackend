const jwt = require("jsonwebtoken")

exports.verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1]
    if (!token) return res.status(403).json("No token provided")

    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
        if (err) return res.status(403).json("Invalid or expired token")

        req.user = user
        next()
    })
}

exports.optionalAuth = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (!authHeader) {
        return next()
    }

    const token = authHeader.split(" ")[1]
    jwt.verify(token, process.env.JWT_SEC, (err, user) => {
        if (err) {
            return next()
        }

        req.user = user
        next()
    })
}