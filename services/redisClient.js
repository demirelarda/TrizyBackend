const Redis = require('ioredis')
const { REDIS_HOST, REDIS_PORT, REDIS_PASSWORD } = require('../config/env')

let redis = null

function createRedisClient() {
  if (!redis) {
    redis = new Redis({
      host: REDIS_HOST,
      port: REDIS_PORT,
      password: REDIS_PASSWORD
    })

    redis.on('connect', () => {
      console.log(`[Redis] Connected to Redis server at ${REDIS_HOST}:${REDIS_PORT}`)
    })

    redis.on('error', (err) => {
      console.error('[Redis] Redis error:', err)
    })
  }
  return redis
}

module.exports = createRedisClient