import express from 'express'
import bodyParser from 'body-parser'
import cors from 'cors'
import orderRoutes from './routes/orderRoutes.js'

const app = express()

app.use(bodyParser.json())
app.use(cors())

app.use('/orders', orderRoutes)

export default app