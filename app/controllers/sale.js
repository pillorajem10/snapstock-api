const Category = require('../models/Category.js');
const User = require('../models/User.js');
const Sale = require('../models/Sale.js');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const decodedToken = jwt.decode(token);

    console.log('DECODED TOKEN', decodedToken.user.role);

    if (decodedToken.user.role === 1 || decodedToken.user.role === 2) {
      const { pageIndex, pageSize, sort_by, sort_direction, name } = req.query;


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

      let categIds =
        req.query.category &&
        req.query.category.split(",").map(function (categ) {
          return mongoose.Types.ObjectId(categ);
        });

      const saleFieldsFilter = {
        stock: req.query.minimumPrice,
        name: name ? { $regex: name, $options: 'i' } : undefined,
        monthOrdered: req.query.monthOrdered ? +req.query.monthOrdered : undefined,
        dateOrdered: req.query.dateOrdered ? +req.query.dateOrdered : undefined,
        yearOrdered: req.query.yearOrdered ? +req.query.yearOrdered : undefined,
        category: req.query.category ? { $in: categIds } : undefined,
      };


      // Will remove a key if that key is undefined
      Object.keys(saleFieldsFilter).forEach(key => saleFieldsFilter[key] === undefined && delete saleFieldsFilter[key]);

      const filterOptions = [
        { $match: saleFieldsFilter },
      ];

      const aggregateQuery = Sale.aggregate(filterOptions);

      Sale.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
        if (err) {
          return sendError(res, err, 'Server Failed');
        } else {
          return sendSuccess(res, result);
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "You are not authorized to access this data.")
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }

};








//CREATE PRODUCT
exports.add = (req, res, next) => {
  /*let token = getToken(req.headers);
  if (token) {
    Sale.create(req.body, function (err, sale) {
      if (err) {
        return sendError(res, err, 'Add sale failed')
      } else {
        return sendSuccess(res, sale)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }*/


  Sale.create(req.body, function (err, sale) {
    if (err) {
      return sendError(res, err, 'Add sale failed')
    } else {
      return sendSuccess(res, sale, 'Sales for today added successfully.')
    }
  });
}






//GET BY ID
exports.getById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Sale.findById(req.params.id, function (err, sale) {
      if (err || !sale) {
        return sendError(res, err, 'Cannot get sale')
      } else {
        return sendSuccess(res, sale)
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

    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizedName = capitalizeFirstLetter(req.body.name);

    Sale.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: capitalizedName },
      { new: true },
      function (err, updatedSale) {
        if (err || !updatedSale) {
          return sendError(res, err, 'Cannot update sale');
        } else {
          return sendSuccess(res, updatedSale);
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
    const decodedToken = jwt.decode(token);
    Sale.findByIdAndRemove(req.params.id, req.body, function (err, sale) {
      if (err || !sale) {
        return sendError(res, {}, 'Cannot delete sale');
      } else {
        return sendSuccess(res, sale, 'Sale deleted successfully.');
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}
