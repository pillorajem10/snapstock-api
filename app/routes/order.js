const express = require('express');
const router = express.Router();

const { list, add, getById, updateById, deleteById, addOrderItem, listOrderItems } = require('../controllers/order');

router.get('/', list);
router.post('/', add);
router.get('/:id', getById);
router.put('/:id', updateById);
router.delete('/:id', deleteById);
router.post('/orderItem/:id', addOrderItem);
router.get('/orderItem/:id', listOrderItems);

module.exports = router;
