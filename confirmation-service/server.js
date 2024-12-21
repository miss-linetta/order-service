import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import dotenv from 'dotenv'
import confirmationService from './services/confirmationService.js'

dotenv.config({ path: './.env' })

const PROTO_PATH = './confirmation.proto'
const PORT = process.env.PORT || 4000

const packageDef = protoLoader.loadSync(PROTO_PATH, {})
const gRPCObject = grpc.loadPackageDefinition(packageDef)

const confirmationPackage = gRPCObject.confirmation

const server = new grpc.Server()

server.addService(confirmationPackage.Confirmation.service, {
  ConfirmOrder: confirmationService.ConfirmOrder,
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
