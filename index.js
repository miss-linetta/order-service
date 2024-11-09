import dotenv from 'dotenv'
import express from 'express'
import bodyParser from 'body-parser'
import pool from './dbConnection.js'
import cors from 'cors'
import { STATUS_BAD_REQUEST, STATUS_CREATED, STATUS_NOT_FOUND, STATUS_OK } from './utils/status.js'
import { validTransitions } from './utils/state.js'
import { randomBytes } from 'crypto'

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
    // Input validation
    if (!name || typeof name !== 'string') {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid or missing name' })
    }

    if (!isin || typeof isin !== 'string') {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid or missing ISIN' })
    }

    if (amount == null || typeof amount !== 'number' || amount <= 0) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid or missing amount. It must be a positive number.' })
    }

    // Insert the new order into the database
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
    // Validate new amount
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid amount. It must be a positive number.' })
    }

    // Retrieve the order from the database
    const [orderResult] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])

    if (orderResult.length === 0) {
      return res.status(STATUS_NOT_FOUND).send({ error: 'Order not found' })
    }

    const order = orderResult[0]

    // Convert State to an integer to ensure correct comparison
    const orderState = parseInt(order.State, 10)

    // Allow modifications only if the state is 0
    if (orderState !== 0) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Order cannot be modified in its current state.' })
    }

    // Update the amount in the database
    await pool.query('UPDATE orders SET Amount = ? WHERE ID = ?', [amount, id])

    // Log success and respond with the updated order
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
    const validNextStates = validTransitions[order.State]
    if (!validNextStates || !validNextStates.includes(state)) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Invalid state transition.' })
    }

    await pool.query('UPDATE orders SET State = ? WHERE ID = ?', [state, id])

    order.State = state
    console.info(`Order state updated: ID ${id}, New State: ${state}`)
    res.status(STATUS_OK).send(order)
  } catch (error) {
    console.error('Error updating the order state:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error updating the order state' })
  }
})

// DELETE: Delete Order
app.delete('/orders/:id', async (req, res) => {
  const { id } = req.params

  try {
    // Retrieve the order from the database
    const [orderResult] = await pool.query('SELECT * FROM orders WHERE ID = ?', [id])

    if (orderResult.length === 0) {
      return res.status(STATUS_NOT_FOUND).send({ error: 'Order not found' })
    }

    const order = orderResult[0]

    // Check if state is '0' or 0, depending on how it's stored in the DB
    const orderState = parseInt(order.State, 10) // convert to integer

    if (orderState !== 0) {
      return res.status(STATUS_BAD_REQUEST).send({ error: 'Order cannot be deleted in its current state.' })
    }

    // Delete the order from the database
    await pool.query('DELETE FROM orders WHERE ID = ?', [id])

    console.info(`Order deleted successfully: ID ${id}`)
    res.status(STATUS_OK).send(order)
  } catch (error) {
    console.error('Error deleting the order:', error)
    res.status(STATUS_BAD_REQUEST).send({ error: 'Error deleting the order' })
  }
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
