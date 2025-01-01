const Redis = require('ioredis')
const { REDIS_PUBLIC_URL } = process.env

let redis = null

function createRedisClient() {
  if (!redis) {
    redis = new Redis(REDIS_PUBLIC_URL)

    redis.on('connect', () => {
      console.log('[Redis] Connected via public URL')
    })

    redis.on('error', (err) => {
      console.error('[Redis] Redis error:', err)
    })
  }
  return redis
}

module.exports = createRedisClient