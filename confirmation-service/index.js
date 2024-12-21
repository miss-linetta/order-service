import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import axios from 'axios'
import dotenv from 'dotenv'

dotenv.config({ path: './.env' })

const PROTO_PATH = './confirmation.proto'
const PORT = process.env.PORT || 4000

const packageDef = protoLoader.loadSync(PROTO_PATH, {})
const gRPCObject = grpc.loadPackageDefinition(packageDef)

const confirmationPackage = gRPCObject.confirmation

async function getPriceData (isin) {
  try {
    const response = await axios.get(
      `https://onlineweiterbildung-reutlingen-university.de/vswsp5/index.php?isin=${isin}`
    )

    const priceData = response.data

    if (
      typeof priceData === 'object' &&
      priceData !== null &&
      Object.keys(priceData).length > 0
    ) {

      const price = parseFloat(Object.values(priceData)[0])

      if (isNaN(price)) {
        throw new Error('Price data is not a valid number.')
      }

      return price
    } else {
      throw new Error('Invalid price data structure.')
    }
  } catch (error) {
    console.error('Price data could not be retrieved:', error.message)
    throw new Error('Error retrieving price data.')
  }
}

async function ConfirmOrder (call, callback) {
  const { isin } = call.request

  if (!isin) {
    return callback({
      code: grpc.status.INVALID_ARGUMENT,
      details: 'ISIN is required.',
    })
  }

  try {
    let confirmed = false
    let price = null

    try {

      price = await getPriceData(isin)
      confirmed = true
    } catch (error) {
      console.warn('Error during price fetch; setting confirmed to false.')
    }

    const result = {
      confirmed,
      price,
    }

    console.info(`Confirmation processed for ISIN ${isin}:`, result)
    return callback(null, result)
  } catch (error) {
    console.error('Error processing confirmation:', error.message)
    return callback({
      code: grpc.status.INTERNAL,
      details: error.message,
    })
  }
}

const server = new grpc.Server()

server.addService(confirmationPackage.Confirmation.service, {
  ConfirmOrder,
})

server.bindAsync(
  `0.0.0.0:${PORT}`,
  grpc.ServerCredentials.createInsecure(),
  (error, bindAddress) => {
    if (error) {
      console.error(`Failed to bind server: ${error.message}`)
      return
    }
    console.log(`gRPC Server is running at ${bindAddress}`)
    server.start()
  }
)
