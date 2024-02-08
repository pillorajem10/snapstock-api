const express = require('express');
const router = express.Router();

const { list, updateById } = require('../controllers/notification');

router.get('/', list);
router.post('/', updateById);

module.exports = router;
