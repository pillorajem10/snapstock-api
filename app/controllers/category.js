const Category = require('../models/Category.js');
const User = require('../models/User.js');
const Product = require('../models/Product.js');
const Order = require('../models/Order.js');
const OrderItem = require('../models/OrderItem.js');
const Delivery = require('../models/Delivery.js');
const Notification = require('../models/Notification.js');
const jwt = require('jsonwebtoken');

const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const decodedToken = jwt.decode(token);

    console.log('DECODED TOKEN', decodedToken.user.role);

    if (decodedToken.user.role === 3) {
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

      const categoryFieldsFilter = {
        stock: req.query.minimumPrice,
        name: name ? { $regex: name, $options: 'i' } : undefined,
      };


      // Will remove a key if that key is undefined
      Object.keys(categoryFieldsFilter).forEach(key => categoryFieldsFilter[key] === undefined && delete categoryFieldsFilter[key]);

      const filterOptions = [
        { $match: categoryFieldsFilter },
      ];

      const aggregateQuery = Category.aggregate(filterOptions);

      Category.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
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
    Category.create(req.body, function (err, cat) {
      if (err) {
        return sendError(res, err, 'Add category failed')
      } else {
        return sendSuccess(res, cat)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }*/


  Category.create(req.body, function (err, cat) {
    if (err) {
      return sendError(res, err, 'Add category failed')
    } else {
      return sendSuccess(res, cat)
    }
  });
}






//GET BY ID
exports.getById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Category.findById(req.params.id, function (err, cat) {
      if (err || !cat) {
        return sendError(res, err, 'Cannot get category')
      } else {
        return sendSuccess(res, cat)
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

    Category.findByIdAndUpdate(
      req.params.id,
      { ...req.body, name: capitalizedName },
      { new: true },
      function (err, updatedCategory) {
        if (err || !updatedCategory) {
          return sendError(res, err, 'Cannot update category');
        } else {
          return sendSuccess(res, updatedCategory);
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
    if (decodedToken.user.role === 3) {
      Category.findByIdAndRemove(req.params.id, req.body, function (err, category) {
        if (err || !category) {
          return sendError(res, {}, 'Cannot delete category');
        } else {
          // Delete related products
          const deleteRelatedDocuments = (Model, filter, res) => {
            Model.deleteMany(filter, (err, result) => {
              if (err) {
                return sendError(res, {}, 'Cannot delete related products');
              }
            });
          };

          deleteRelatedDocuments(User, { category: req.params.id }, res);
          deleteRelatedDocuments(Product, { category: req.params.id }, res);
          deleteRelatedDocuments(Order, { category: req.params.id }, res);
          deleteRelatedDocuments(OrderItem, { category: req.params.id }, res);
          deleteRelatedDocuments(Delivery, { category: req.params.id }, res);
          deleteRelatedDocuments(Notification, { category: req.params.id }, res);

          return sendSuccess(res, {}, 'Business and related items deleted successfully.');
        }
      });
    } else {
        return sendErrorUnauthorized(res, "", "You are not authorized to access this data.")
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}
