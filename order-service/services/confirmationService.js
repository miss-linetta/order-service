import * as protoLoader from '@grpc/proto-loader'
import * as gRPC from '@grpc/grpc-js'

const packageDefinition = protoLoader.loadSync('./confirmation.proto', {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
})

const confirmationProto = gRPC.loadPackageDefinition(packageDefinition).confirmation

const confirmationService = new confirmationProto.Confirmation(
  'confirmation-service:9090',
  gRPC.credentials.createInsecure()
)

export function callConfirmationService (isin) {
  return new Promise((resolve, reject) => {
    confirmationService.ConfirmOrder({ isin }, (error, response) => {
      if (error) {
        console.error('Error calling ConfirmOrder:', error.message)
        return reject(error)
      }

      console.info('Received response from ConfirmOrder:', response)
      resolve(response)
    })
  })
}
