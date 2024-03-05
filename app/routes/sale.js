const express = require('express');
const router = express.Router();

const {
  list,
  add,
  getById,
  updateById,
  deleteById
} = require('../controllers/sale');

router.get('/', list);
router.post('/', add);
router.get('/:id', getById);
router.put('/:id', updateById);
router.delete('/:id', deleteById);

module.exports = router;
