const express = require('express');
const router = express.Router();

module.exports = (io) => {
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
    updateOrderItem,
    downloadPDF,
    downloadExcel
  } = require('../controllers/order');

  // Order-specific routes
  router.post('/orderItem/:id', addOrderItem);
  router.get('/orderItem/:id', listOrderItems);

  // Generic order routes
  router.get('/', list);
  router.post('/', (req, res) => add(req, res, io));
  router.get('/:id', getById);
  router.put('/:id', updateById);
  router.delete('/:id', (req, res) => deleteById(req, res, io));

  // Route for getting an order item by ID
  router.get('/orderitemgetbyid/:id', getOrderItemById);
  router.delete('/orderitemdeletebyid/:orderId/:orderItemId', deleteOrderItem);
  router.put('/orderitemupdatebyid/:orderId/:orderItemId', updateOrderItem);

  // generate reports
  router.post('/report/generatepdf', downloadPDF);
  router.post('/report/generateexcel', downloadExcel);

  return router; // This line was missing in your original code
};
