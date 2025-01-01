require('dotenv').config()

const USE_REDIS = process.env.USE_REDIS === 'true'
const REDIS_HOST = process.env.REDIS_HOST || '127.0.0.1'
const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10)
const REDIS_PASSWORD = process.env.REDISPASSWORD || null

module.exports = {
  USE_REDIS,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PASSWORD
}