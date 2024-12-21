import express from 'express'
import {
  createOrder,
  getAllOrders,
  getOrderById,
  updateOrderAmount,
  updateOrderState,
  deleteOrder,
} from '../controllers/orderController.js'

const router = express.Router()

// POST: Create Order
router.post('/', createOrder)

// GET: Retrieve All Orders
router.get('/', getAllOrders)

// GET: Retrieve Order by ID
router.get('/:id', getOrderById)

// PATCH: Update Order Amount
router.patch('/:id/amount', updateOrderAmount)

// PATCH: Update Order State
router.patch('/:id/state', updateOrderState)

// DELETE: Delete Order
router.delete('/:id', deleteOrder)

export default router
