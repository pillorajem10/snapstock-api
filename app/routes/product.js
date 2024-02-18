const express = require('express');
const router = express.Router();


module.exports = (io) => {
  const { list, add, getById, updateById, deleteById, addQuantityOfProds, downloadPDF, downloadExcel } = require('../controllers/product');

  router.get('/', list);
    router.post('/', (req, res) => add(req, res, io));
  router.get('/:id', getById);
  router.put('/:id', updateById);
  router.delete('/:id', deleteById);
  router.post('/:id', addQuantityOfProds);

  // generate reports
  router.post('/report/generatepdf', downloadPDF);
  router.post('/report/generateexcel', downloadExcel);

  return router;
};
