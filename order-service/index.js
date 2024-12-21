import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import pool from './dbConnection.js'
import cors from 'cors'
import { STATUS_BAD_REQUEST, STATUS_CREATED, STATUS_NOT_FOUND, STATUS_OK } from './utils/status.js'
import { STATE_CONFIRMED, STATE_CREATED, validTransitions } from './utils/state.js'
import { callConfirmationService } from './client.js'

dotenv.config({ path: './.env' })

const app = express()

app.use(bodyParser.json())
app.use(cors())

// POST: Create Order with Error Handling
app.post('/orders', async (req, res) => {
  const { name, isin, amount } = req.body
  const state = 0
  const price = 0

  try {
    if (!name || typeof name !== 'string') {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid or missing name' })
    }

    if (!isin || typeof isin !== 'string') {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid or missing ISIN' })
    }

    if (amount == null || typeof amount !== 'number' || amount <= 0) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid or missing amount. It must be a positive number.' })
    }

    const [result] = await pool.query(
      'INSERT INTO orders (Name, ISIN, Amount, Price, State) VALUES (?, ?, ?, ?, ?)',
      [name, isin, amount, price, state]
    )

    const newOrder = {
      id: result.insertId,
      name,
      isin,
      amount,
      price,
      state
    }

    console.info(`Order created successfully: ${JSON.stringify(newOrder)}`)
    res.status(STATUS_CREATED).send(newOrder)
  } catch (error) {
    console.error('Error creating order:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error creating order' })
  }
})

// GET: Retrieve All Orders with Optional State Filtering
app.get('/orders', async (req, res) => {
  const state = req.query.state !== undefined ? parseInt(req.query.state, 10) : null
  try {
    const query = state !== null
      ? 'SELECT * FROM orders WHERE State = ?'
      : 'SELECT * FROM orders'

    const [rows] = state !== null
      ? await pool.query(query, [state])
      : await pool.query(query)

    console.info(`Orders retrieved. Filter state: ${state}`)
    res.status(STATUS_OK).send(rows)
  } catch (error) {
    console.error('Error retrieving orders:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error retrieving orders' })
  }
})

// GET: Retrieve Order by ID
app.get('/orders/:id', async (req, res) => {
  const { id } = req.params
  try {
    const [rows] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])

    if (rows.length === 0) {
      return res.status(STATUS_NOT_FOUND).send({ error: 'Order not found' })
    }

    console.info(`Order retrieved by ID: ${id}`)
    res.status(STATUS_OK).send(rows[0])
  } catch (error) {
    console.error('Error retrieving order:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error retrieving order' })
  }
})

// PATCH: Update Order Amount
app.patch('/orders/:id/amount', async (req, res) => {
  const { id } = req.params
  const { amount } = req.body

  try {
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid amount. It must be a positive number.' })
    }

    const [orderResult] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])

    if (orderResult.length === 0) {
      return res.status(STATUS_NOT_FOUND).send({ error: 'Order not found' })
    }

    const order = orderResult[0]

    const orderState = parseInt(order.State, 10)

    if (orderState !== STATE_CREATED) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Order cannot be modified in its current state.' })
    }

    await pool.query('UPDATE orders SET Amount = ? WHERE ID = ?', [amount, id])

    console.info(`Order amount updated: ID ${id}, New Amount: ${amount}`)
    res.status(STATUS_OK).send({ ...order, Amount: amount })
  } catch (error) {
    console.error('Error updating the order amount:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error updating the order' })
  }
})

// PATCH: Update Order State
app.patch('/orders/:id/state', async (req, res) => {
  const { id } = req.params
  const { state } = req.body

  try {
    const [orderResult] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])

    if (orderResult.length === 0) {
      return res.status(STATUS_NOT_FOUND).send({ error: 'Order not found' })
    }

    const order = orderResult[0]
    const currentState = order.State !== undefined ? Number(order.State) : NaN

    if (isNaN(currentState)) {
      console.error(`Invalid or missing state for Order ID ${id}: ${order.State}`)
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid current state in database.' })
    }

    const validNextStates = validTransitions[currentState]

    if (!validNextStates) {
      console.error(`No valid transitions for state ${currentState}`)
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid current state.' })
    }

    if (!validNextStates.includes(state)) {
      console.warn(`Invalid state transition: Current State: ${currentState}, Desired State: ${state}`)
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid state transition.' })
    }

    if (currentState === STATE_CREATED && state === STATE_CONFIRMED) {
      try {
        const confirmationResult = await callConfirmationService(order.ISIN)
        console.log('Confirmation Service Response:', confirmationResult)

        if (confirmationResult.confirmed) {
          const price = confirmationResult.price
          console.log('Extracted Price:', price)

          const updateResult = await pool.query('UPDATE orders SET State = ?, Price = ? WHERE ID = ?', [
            state,
            price,
            id,
          ])

          const [updatedOrderResult] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])
          const updatedOrder = updatedOrderResult[0]
          console.log('Updated Order:', updatedOrder)

          order.State = updatedOrder.State
          order.Price = updatedOrder.Price

          console.info(`Order state updated to confirmed: ID ${id}`)
          return res.status(STATUS_OK).send(order)
        } else {
          return res
            .status(STATUS_BAD_REQUEST)
            .send({ error: 'Confirmation failed. Order not updated.' })
        }
      } catch (error) {
        console.error('Error during confirmation:', error.message)
        return res
          .status(STATUS_BAD_REQUEST)
          .send({ error: 'Error during confirmation. Order not updated.' })
      }
    }

    await pool.query('UPDATE orders SET State = ? WHERE ID = ?', [state, id])
    order.State = state

    console.info(`Order state updated: ID ${id}, New State: ${state}`)
    res.status(STATUS_OK).send(order)
  } catch (error) {
    console.error('Error updating the order state:', error.message)
    return res.status(STATUS_BAD_REQUEST).send({ error: 'Failed to update state.' })
  }
})

// DELETE: Delete Order
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params

  try {
    const [orderResult] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])

    if (orderResult.length === 0) {
      return res.status(STATUS_NOT_FOUND).send({ error: 'Order not found' })
    }

    const order = orderResult[0]

    const orderState = parseInt(order.state, 10)

    if (orderState !== STATE_CREATED && orderState !== STATE_CONFIRMED) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Order cannot be deleted in its current state.' })
    }

    await pool.query('DELETE FROM orders WHERE ID = ?', [id])

    console.info(`Order deleted successfully: ID ${id}`)
    res.status(STATUS_OK).send(order)
  } catch (error) {
    console.error('Error deleting the order:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error deleting the order' })
  }
})

app.get('/overload', async (req, res) => {
  for (let i = 0; i < 100; i++) {
    console.log(`------------------------- Log iteration: ${i} -------------------------`)
    for (let j = 0; j < 100000; j++) {}
  }
  res.status(200).send('Success')
})

const PORT = process.env.PORT || 3000

function start () {
  try {
    app.listen(PORT, () => console.info(`Server started on port ${PORT}`))
  } catch (error) {
    console.error('Error starting the server:', error)
  }
}

start()
