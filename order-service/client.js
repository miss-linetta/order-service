// Load the proto file
import * as protoLoader from '@grpc/proto-loader'
import * as gRPC from '@grpc/grpc-js'

// Load the proto file
const packageDefinition = protoLoader.loadSync('./confirmation.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

// Load the gRPC object from the proto file definition
const confirmationProto = gRPC.loadPackageDefinition(packageDefinition).confirmation

// Create the gRPC client instance
const client = new confirmationProto.Confirmation(
  'confirmation-service:9090',
  gRPC.credentials.createInsecure()
)

/**
 * Call the ConfirmOrder method of the Confirmation Service.
 * @param {string} isin - The ISIN to confirm.
 * @returns {Promise<Object>} - The confirmation response.
 */
export function callConfirmationService (isin) {
  return new Promise((resolve, reject) => {
    client.ConfirmOrder({ isin }, (error, response) => {
      if (error) {
        console.error('Error calling ConfirmOrder:', error.message)
        return reject(error)
      }

      console.info('Received response from ConfirmOrder:', response)
      resolve(response)
    })
  })
}
