const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');


const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  try {
    let token = getToken(req.headers);
    if (token) {
      const { pageIndex, pageSize, sort_by, sort_direction, name, category } =
        req.query;

      const page = pageIndex;
      const limit = pageSize;
      const sortDirection = sort_direction
        ? sort_direction.toLowerCase()
        : undefined;

      let sortPageLimit = {
        page,
        limit,
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
        req.query.category
          .split(",")
          .filter((categ) => categ !== "undefined")
          .map(function (categ) {
            return mongoose.Types.ObjectId(categ);
          });

      let userIds =
        req.query.user &&
        req.query.user
          .split(",")
          .filter((user) => user !== "undefined")
          .map(function (user) {
            return mongoose.Types.ObjectId(user);
          });


      const notifFieldsFilter = {
        stock: req.query.minimumPrice,
        name: name ? { $regex: name, $options: "i" } : undefined,
        category: req.query.category ? { $in: categIds } : undefined,
        user: req.query.user ? { $in: userIds } : undefined,
      };

      // Will remove a key if that key is undefined
      Object.keys(notifFieldsFilter).forEach(
        (key) =>
          notifFieldsFilter[key] === undefined && delete notifFieldsFilter[key]
      );

      const filterOptions = [
        { $match: notifFieldsFilter },
        { $sort: { createdAt: -1 } }, // Sorting in descending order by createdAt
      ];

      const aggregateQuery = Notification.aggregate(filterOptions);

      Notification.aggregatePaginate(
        aggregateQuery,
        sortPageLimit,
        (err, result) => {
          if (err) {
            return sendError(res, err, "Server Failed");
          } else {
            return sendSuccess(res, result);
          }
        }
      );
    } else {
      return sendErrorUnauthorized(res, "", "Please login first.");
    }
  } catch (err) {
    console.error("[ERROR IN NOTIFICATION]", err);
  }
};


exports.updateById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const ids = req.body.ids; // Assuming you pass an array of IDs in the request body
    const updateData = req.body.updateData; // Assuming you pass the update data in the request body

    Notification.updateMany({ _id: { $in: ids } }, updateData, { new: true }, function (err, result) {
      if (err || !result) return sendError(res, {}, 'Update failed.');
      return sendSuccess(res, result, 'Updated.');
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};
