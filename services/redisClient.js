const Redis = require('ioredis')
const { REDIS_HOST, REDIS_PORT } = require('../config/env')

let redis = null

function createRedisClient() {
  if (!redis) {
    redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT
    })

    redis.on('connect', () => {
      console.log('[Redis] Connected to Redis server')
    })

    redis.on('error', (err) => {
      console.error('[Redis] Redis error:', err)
    })
  }
  return redis
}

module.exports = createRedisClient