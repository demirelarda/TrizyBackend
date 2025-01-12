const cron = require('node-cron')
const setSearchTrends = require('./setSearchTrends')
const setBestOfWeekProducts = require('./setBestOfWeekProducts')
const setBestOfMonthProducts = require('./setBestOfMonthProducts')
require('dotenv').config()

const searchTrendsSchedule = process.env.CRON_SEARCH_TRENDS_SCHEDULE || '0 0 * * *'
const bestOfWeekSchedule = process.env.CRON_BEST_OF_WEEK_SCHEDULE || '0 0 * * *'
const bestOfMonthSchedule = process.env.CRON_BEST_OF_MONTH_SCHEDULE || '0 0 * * *'

cron.schedule(searchTrendsSchedule, async () => {
  console.log(`Running cron job: setSearchTrends at schedule: ${searchTrendsSchedule}`)
  try {
    await setSearchTrends()
    console.log('setSearchTrends completed successfully.')
  } catch (error) {
    console.error('Error occurred while running setSearchTrends:', error)
  }
})

cron.schedule(bestOfWeekSchedule, async () => {
  console.log(`Running cron job: setBestOfWeekProducts at schedule: ${bestOfWeekSchedule}`)
  try {
    await setBestOfWeekProducts()
    console.log('setBestOfWeekProducts completed successfully.')
  } catch (error) {
    console.error('Error occurred while running setBestOfWeekProducts:', error)
  }
})

cron.schedule(bestOfMonthSchedule, async () => {
  console.log(`Running cron job: setBestOfMonthProducts at schedule: ${bestOfMonthSchedule}`)
  try {
    await setBestOfMonthProducts()
    console.log('setBestOfMonthProducts completed successfully.')
  } catch (error) {
    console.error('Error occurred while running setBestOfMonthProducts:', error)
  }
})