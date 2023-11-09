const Category = require('../models/Category.js');

const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');


// LIST ALL PRODUCTS
exports.list = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
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
  console.log('CATEGORY ADD');
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
    Category.findByIdAndUpdate(req.params.id, req.body, { new: true }, function (err, cat) {
      if (err || !cat) {
        return sendError(res, err, 'Cannot update category')
      } else {
        console.log("REQ BODYYYYYYYYYYYYYY", req.body)
        return sendSuccess(res, cat)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}






//DELETE BY ID
exports.deleteById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Category.findByIdAndRemove(req.params.id, req.body, function (err, category) {
      if (err || !category) {
        return sendError(res, {}, 'Cannot delete category');
      } else {
        return sendSuccess(res, category);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}
