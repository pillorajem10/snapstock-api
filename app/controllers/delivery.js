const Delivery = require('../models/Delivery.js');
const Product = require('../models/Product.js');

const { sendError, sendSuccess, convertMomentWithFormat, getToken, sendErrorUnauthorized } = require ('../utils/methods');

//LIST ALL PRODUCTS
exports.list = (req, res, next) => {
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

    const deliveryFieldsFilter = {
      stock : req.query.minimumPrice,
      monthOrdered: req.query.monthOrdered ? +req.query.monthOrdered : undefined,
      dateOrdered: req.query.dateOrdered ? +req.query.dateOrdered : undefined,
      yearOrdered: req.query.yearOrdered ? +req.query.yearOrdered : undefined,
      $text: req.query.name ? { $search: req.query.name } : undefined,
    };

    // Will remove a key if that key is undefined
    Object.keys(deliveryFieldsFilter).forEach(key => deliveryFieldsFilter[key] === undefined && delete deliveryFieldsFilter[key]);

    const filterOptions = [
      { $match: deliveryFieldsFilter },
    ];

    const aggregateQuery = Delivery.aggregate(filterOptions);

    Delivery.aggregatePaginate(aggregateQuery,
      sortPageLimit,
      (err, result) => {
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
  console.log("ADDING PRODDUCTSSSSSSSSSSSSSSSSSS");
  Delivery.create(req.body, function (err, delivery) {
    if (err) {
      return sendError(res, err, 'Add delivery failed')
    } else {
      Product.findById(req.body.productId, function (err, product) {
        if (err || !product) {
          return sendError(res, err, 'Cannot get product')
        } else {
          /*
          callbackOrder.orderItem.push(orderItem);

          orderItem.total = product.price * orderItem.qty;
          orderItem.productName = product.name;
          orderItem.credit = 'false';

          callbackOrder.totalPrice = callbackOrder.totalPrice + orderItem.total;

          product.stocks = product.stocks - orderItem.qty;


          product.save();
          orderItem.save();
          callbackOrder.save();
          */
          const convertedDate = convertMomentWithFormat(delivery.createdAt);
          const month = +convertedDate.split('/')[0];
          const date = +convertedDate.split('/')[1];
          const year = +convertedDate.split('/')[2];

          delivery.monthDelivered = month;
          delivery.dateDelivered = date;
          delivery.yearDelivered = year;

          delivery.total = product.price * delivery.qty;
          delivery.productName = product.name;

          product.stocks = product.stocks + delivery.qty;


          product.save();
          delivery.save();

          return sendSuccess(res, delivery)
        }
      });
    }
  });
}






//GET BY ID
exports.getById = (req, res, next) => {
  Delivery.findById(req.params.id).populate('productId').exec((err, delivery) => {
    if(err || !delivery){
      return sendSuccess(res, delivery)
    } else {
      return sendSuccess(res, delivery)
    }
  });
}






//UPDATE BY ID
exports.updateById = (req, res, next) => {
  Delivery.findByIdAndUpdate(req.params.id, req.body, { new: true } ).populate('productId').exec((err, delivery) => {
    console.log("REQ BODYYYYYYYYYYYYYY", req.body)
    if(err || !delivery){
      return sendSuccess(res, delivery)
    } else {
      return sendSuccess(res, delivery)
    }
  });
}






//DELETE BY ID
exports.deleteById = (req, res, next) => {
  Delivery.findByIdAndRemove(req.params.id, req.body, function (err, delivery) {
    if (err || !delivery) {
      return sendError(res, {}, 'Cannot delete delivery');
    } else {
      return sendSuccess(res, delivery);
    }
  });
}
