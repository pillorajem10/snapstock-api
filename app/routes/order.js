const express = require('express');
const router = express.Router();

const {
  list,
  add,
  getById,
  updateById,
  deleteById,
  addOrderItem,
  listOrderItems,
  getOrderItemById,
  deleteOrderItem,
  updateOrderItem
} = require('../controllers/order');

// Order-specific routes
router.post('/orderItem/:id', addOrderItem);
router.get('/orderItem/:id', listOrderItems);

// Generic order routes
router.get('/', list);
router.post('/', add);
router.get('/:id', getById);
router.put('/:id', updateById);
router.delete('/:id', deleteById);

// Route for getting an order item by ID
router.get('/orderitemgetbyid/:id', getOrderItemById);
router.delete('/orderitemdeletebyid/:orderId/:orderItemId', deleteOrderItem);
router.put('/orderitemupdatebyid/:orderId/:orderItemId', updateOrderItem);


module.exports = router;
