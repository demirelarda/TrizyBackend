const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const dotenv = require('dotenv')


dotenv.config()

const authRoute = require('./routes/auth')

mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("Connected to the MongoDB")).catch((err) => { console.log(err) })


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use('/api', authRoute)


const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)


  
})