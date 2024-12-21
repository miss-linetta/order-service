import * as grpc from '@grpc/grpc-js'
import { getPriceData } from '../utils/priceUtils.js'

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

export default {
  ConfirmOrder,
}
