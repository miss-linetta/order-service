import * as grpc from '@grpc/grpc-js'
import * as protoLoader from '@grpc/proto-loader'
import dotenv from 'dotenv'
import { ConfirmOrder } from './index.js'

dotenv.config({ path: './.env' })

const PROTO_PATH = './confirmation.proto'
const PORT = process.env.PORT || 4000

// Load the proto file
const packageDef = protoLoader.loadSync(PROTO_PATH, {})
const gRPCObject = grpc.loadPackageDefinition(packageDef)

// Extract the confirmation package
const confirmationPackage = gRPCObject.confirmation

// Create the gRPC server
const server = new grpc.Server()

// Register the Confirmation service with the ConfirmOrder method
server.addService(confirmationPackage.Confirmation.service, {
  ConfirmOrder,
})

// Bind the server to an address and start it
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
