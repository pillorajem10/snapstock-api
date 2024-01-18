const express = require('express');
const router = express.Router();

const { list, add, getById, updateById, deleteById, downloadPDF, downloadExcel } = require('../controllers/delivery');

router.get('/', list);
router.post('/', add);
router.get('/:id', getById);
router.put('/:id', updateById);
router.delete('/:id', deleteById);

// generate reports
router.post('/report/generatepdf', downloadPDF);
router.post('/report/generateexcel', downloadExcel);

module.exports = router;
