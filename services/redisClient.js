const Redis = require('ioredis')
const { REDIS_URL } = require('../config/env')

let redis = null

function createRedisClient() {
  if (!redis) {
    redis = new Redis(REDIS_URL)

    redis.on('connect', () => {
      console.log('[Redis] Connected to Redis (dual-stack family=0)')
    })
    redis.on('error', (err) => {
      console.error('[Redis] Redis error:', err)
    })
  }
  return redis
}

module.exports = createRedisClient