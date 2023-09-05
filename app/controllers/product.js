const Product = require('../models/Product.js');

const { sendError, sendSuccess } = require ('../utils/methods');

//LIST ALL PRODUCTS
/*exports.list = (req, res, next) => {
    const { pageIndex, pageSize, sort_by, sort_direction } = req.query;

    console.log("REQ QUERYY", req.query)

    const page = pageIndex;
    const limit = pageSize;
    const sortDirection = sort_direction ? sort_direction.toLowerCase() : undefined;

    let sortPageLimit = {
      page,
      limit
    };

    if (sort_by && sortDirection) {
      sortPageLimit = {
        sort: { [sort_by] : sortDirection },
        page,
        limit,
      };
    }

    const productFieldsFilter = {
      stock : req.query.minimumPrice,
      $text: req.query.name ? { $search: req.query.name } : undefined,
    };

    // Will remove a key if that key is undefined
    Object.keys(productFieldsFilter).forEach(key => productFieldsFilter[key] === undefined && delete productFieldsFilter[key]);

    const filterOptions = [
      { $match: productFieldsFilter },
    ];

    const aggregateQuery = Product.aggregate(filterOptions);

    Product.aggregatePaginate(aggregateQuery,
      sortPageLimit,
      (err, result) => {
      if (err) {
        console.log("ERRoRRRRRRRRRRRRRRRRR", err)
        return sendError(res, err, 'Server Failed');
      } else {
        return sendSuccess(res, result);
      }
    });
};*/


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  const { pageIndex, pageSize, sort_by, sort_direction, name } = req.query;

  console.log("REQ QUERYY", req.query);

  const page = pageIndex;
  const limit = pageSize;
  const sortDirection = sort_direction ? sort_direction.toLowerCase() : undefined;

  let sortPageLimit = {
    page,
    limit
  };

  if (sort_by && sortDirection) {
    sortPageLimit = {
      sort: { [sort_by]: sortDirection },
      page,
      limit,
    };
  }

  const productFieldsFilter = {
    stock: req.query.minimumPrice,
  };

  // Add search by product name if 'name' query parameter is provided
  if (name) {
    productFieldsFilter.name = { $regex: name, $options: 'i' }; // Case-insensitive regex search
  }

  // Will remove a key if that key is undefined
  Object.keys(productFieldsFilter).forEach(key => productFieldsFilter[key] === undefined && delete productFieldsFilter[key]);

  const filterOptions = [
    { $match: productFieldsFilter },
  ];

  const aggregateQuery = Product.aggregate(filterOptions);

  Product.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
    if (err) {
      console.log("ERRoRRRRRRRRRRRRRRRRR", err)
      return sendError(res, err, 'Server Failed');
    } else {
      return sendSuccess(res, result);
    }
  });
};








//CREATE PRODUCT
exports.add = (req, res, next) => {
  Product.create(req.body, function (err, prod) {
    if (err) {
      return sendError(res, err, 'Add product failed')
    } else {
      return sendSuccess(res, prod)
    }
  });
}






//GET BY ID
exports.getById = (req, res, next) => {
  Product.findById(req.params.id, function (err, prod) {
    if (err || !prod) {
      return sendError(res, err, 'Cannot get product')
    } else {
      return sendSuccess(res, prod)
    }
  });
}






//UPDATE BY ID
exports.updateById = (req, res, next) => {
  Product.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (err, prod) {
    if (err || !prod) {
      return sendError(res, err, 'Cannot update product')
    } else {
      console.log("REQ BODYYYYYYYYYYYYYY", req.body)
      return sendSuccess(res, prod)
    }
  });
}






//DELETE BY ID
exports.deleteById = (req, res, next) => {
  Product.findByIdAndRemove(req.params.id, req.body, function (err, product) {
    if (err || !product) {
      return sendError(res, {}, 'Cannot delete product');
    } else {
      return sendSuccess(res, product);
    }
  });
}


//ADD QUANTITY IN PRODUCTS
exports.addQuantityOfProds = (req, res, next) => {
  Product.findById(req.params.id, function (err, prod) {
    if (err || !prod) {
      return sendError(res, err, 'Cannot get product')
    } else {
      prod.stocks = prod.stocks + req.body.addedStocks;
      prod.save();

      return sendSuccess(res, prod)
    }
  });
}
