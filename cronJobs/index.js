const cron = require('node-cron')
const setSearchTrends = require('./setSearchTrends')
require('dotenv').config()

const cronSchedule = process.env.CRON_SEARCH_TERM_SCHEDULE || '0 0 * * *'

cron.schedule(cronSchedule, async () => {
  console.log(`Running cron job: setSearchTrends at schedule: ${cronSchedule}`)
  await setSearchTrends()
})