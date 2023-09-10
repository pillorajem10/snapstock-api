// routes/userRoutes.js
const express = require('express');
const router = express.Router();
const {
  list,
  add,
  getById,
  updateById,
  deleteById,
} = require('../controllers/user.js');

// CRUD operations
router.post('/', add);
router.get('/', list);
router.get('/:id', getById);
router.put('/:id', updateById);
router.delete('/:id', deleteById);

module.exports = router;
