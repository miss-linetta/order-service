import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import { STATUS_BAD_REQUEST, STATUS_OK } from './utils/status.js'
import axios from 'axios'

dotenv.config({ path: './.env' })

const app = express()

app.use(bodyParser.json())
app.use(cors())

// Asynchronous function to fetch price data from the external Price Service
async function getPriceData (isin) {
  try {
    const response = await axios.get(
      `https://onlineweiterbildung-reutlingen-university.de/vswsp4/index.php?isin=${isin}`
    )
    return response.data
  } catch (error) {
    console.error('Price data could not be retrieved:', error.message)
    throw new Error('Error retrieving price data.')
  }
}

// GET: Confirmation Endpoint
app.get('/confirmation/:isin', async (req, res) => {
  const { isin } = req.query

  try {
    if (!isin) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'ISIN is required.' })
    }

    let confirmed = false
    let price = null

    try {
      // Fetch price from the Price Service
      price = await getPriceData(isin)
      confirmed = true // Set confirmed to true if price data is retrieved successfully
    } catch (error) {
      console.warn('Error during price fetch; setting confirmed to false.')
    }

    // Construct the response
    const result = {
      confirmed,
      price,
    }

    console.info(`Confirmation processed for ISIN ${isin}:`, result)
    res.status(STATUS_OK).send(result)
  } catch (error) {
    console.error('Error processing confirmation:', error.message)
    res.status(STATUS_BAD_REQUEST).send({ error: error.message })
  }
})

const PORT = process.env.PORT || 4000

function start () {
  try {
    app.listen(PORT, () => console.info(`Server started on port ${PORT}`))
  } catch (error) {
    console.error('Error starting the server:', error)
  }
}

start()