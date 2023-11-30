const Product = require('../models/Product.js');
const mongoose = require('mongoose');


const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const { pageIndex, pageSize, sort_by, sort_direction, name, category } = req.query;

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

    let categIds = req.query.category && req.query.category.split(',').map(function(categ) {
      return mongoose.Types.ObjectId(categ);
    });

    const productFieldsFilter = {
      stock: req.query.minimumPrice,
      name: name ? { $regex: name, $options: 'i' } : undefined,
      category: req.query.category ? { $in: categIds } : undefined,
    };


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
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }

};








//CREATE PRODUCT
exports.add = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    // Capitalize the first letter of the "name" field in the request body
    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizedName = capitalizeFirstLetter(req.body.name);

    Product.create({ ...req.body, name: capitalizedName }, function (err, product) {
      if (err) {
        return sendError(res, err, 'Add product failed');
      } else {
        return sendSuccess(res, product);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};







//GET BY ID
exports.getById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Product.findById(req.params.id, function (err, prod) {
      if (err || !prod) {
        return sendError(res, err, 'Cannot get product')
      } else {
        return sendSuccess(res, prod)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}






//UPDATE BY ID
exports.updateById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    // Capitalize the first letter of the "name" field in the request body
    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizedName = capitalizeFirstLetter(req.body.name);

    Product.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: capitalizedName },
      { new: true },
      function (err, updatedProduct) {
        if (err || !updatedProduct) {
          return sendError(res, err, 'Cannot update product');
        } else {
          console.log("REQ BODYYYYYYYYYYYYYY", req.body);
          return sendSuccess(res, updatedProduct);
        }
      }
    );
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};







//DELETE BY ID
exports.deleteById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Product.findByIdAndRemove(req.params.id, req.body, function (err, product) {
      if (err || !product) {
        return sendError(res, {}, 'Cannot delete product');
      } else {
        return sendSuccess(res, product);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}


//ADD QUANTITY IN PRODUCTS
exports.addQuantityOfProds = (req, res, next) => {
  /*let token = getToken(req.headers);
  if (token) {
    console.log("TOKEN???", token)
    Product.findById(req.params.id, function (err, prod) {
      if (err || !prod) {
        return sendError(res, err, 'Cannot get product')
      } else {
        prod.stocks = prod.stocks + req.body.addedStocks;
        prod.save();

        return sendSuccess(res, prod)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }*/
  console.log("GETTING THIS FUNCTION?????????? ADDING QUANTITY")
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
