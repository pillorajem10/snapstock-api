const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');


const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const { pageIndex, pageSize, sort_by, sort_direction, name, category } = req.query;


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

    const notifFieldsFilter = {
      stock: req.query.minimumPrice,
      name: name ? { $regex: name, $options: 'i' } : undefined,
      category: req.query.category ? { $in: categIds } : undefined,
    };


    // Will remove a key if that key is undefined
    Object.keys(notifFieldsFilter).forEach(key => notifFieldsFilter[key] === undefined && delete notifFieldsFilter[key]);

    const filterOptions = [
      { $match: notifFieldsFilter },
      { $sort: { createdAt: -1 } },
    ];

    const aggregateQuery = Notification.aggregate(filterOptions);

    Notification.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
      if (err) {
        return sendError(res, err, 'Server Failed');
      } else {
        return sendSuccess(res, result);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }

};
