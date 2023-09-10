const Order = require('../models/Order.js');
const OrderItem = require('../models/OrderItem.js');
const Product = require('../models/Product.js');
const mongoose = require('mongoose');

const { sendError, sendSuccess, convertMomentWithFormat, getToken, sendErrorUnauthorized } = require ('../utils/methods');

//LIST ALL ORDERS
exports.list = (req, res, next) => {
    let token = getToken(req.headers);
    console.log('TUKEEEEEEEEEEEEEEEEEEEEEEEEEEEEEN', token)
    if (token) {
      const { pageIndex, pageSize, sort_by, sort_direction, customerName } = req.query;

      console.log("REQ QUERYYYYYY ORDER", req.query)

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

      const orderFieldsFilter = {
        stock: req.query.minimumStock && req.query.maximumStock ? { $gte: +req.query.minimumStock, $lte: +req.query.maximumStock } : undefined,
        monthOrdered: req.query.monthOrdered ? +req.query.monthOrdered : undefined,
        dateOrdered: req.query.dateOrdered ? +req.query.dateOrdered : undefined,
        yearOrdered: req.query.yearOrdered ? +req.query.yearOrdered : undefined,
        // $text: req.query.customerName ? { $search: req.query.customerName } : undefined,
      };

      if (customerName) {
        orderFieldsFilter.customerName = { $regex: customerName, $options: 'i' }; // Case-insensitive regex search
      }

      // Will remove a key if that key is undefined
      Object.keys(orderFieldsFilter).forEach(key => orderFieldsFilter[key] === undefined && delete orderFieldsFilter[key]);

      const filterOptions = [
        { $match: orderFieldsFilter },
      ];

      const aggregateQuery = Order.aggregate(filterOptions);

      Order.aggregatePaginate(aggregateQuery,
        sortPageLimit,
        (err, result) => {
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






//LIST OF ORDER ITEMS PER ID
exports.listOrderItems = (req, res, next) => {
    let token = getToken(req.headers);
    if (token) {
      const { pageIndex, pageSize, sort_by, sort_direction } = req.query;

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

      const orderFieldsFilter = {
        orderId: new mongoose.Types.ObjectId(req.query.orderId),
        $text: req.query.name ? { $search: req.query.name } : undefined,
      };

      // Will remove a key if that key is undefined
      Object.keys(orderFieldsFilter).forEach(key => orderFieldsFilter[key] === undefined && delete orderFieldsFilter[key]);

      const filterOptions = [
        { $match: orderFieldsFilter },
      ];

      const aggregateQuery = OrderItem.aggregate(filterOptions);

      OrderItem.aggregatePaginate(aggregateQuery,
        sortPageLimit,
        (err, result) => {
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







//CREATE ORDER
exports.add = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Order.create(req.body, function (err, order) {
      if (err) {
        return sendError(res, err, 'Add order failed')
      } else {
        const convertedDate = convertMomentWithFormat(order.createdAt);
        const month = +convertedDate.split('/')[0];
        const date = +convertedDate.split('/')[1];
        const year = +convertedDate.split('/')[2];

        order.monthOrdered = month;
        order.dateOrdered = date;
        order.yearOrdered = year;

        order.credit = 'false';

        order.save();

        return sendSuccess(res, order)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}


//GET BY ID
exports.getById = (req, res, next)=>{
  let token = getToken(req.headers);
  if (token) {
    Order.findById(req.params.id).populate('orderItem').exec((err, order) => {
      if(err || !order){
        return sendSuccess(res, order)
      } else {
        return sendSuccess(res, order)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};


//UPDATE BY ID
exports.updateById = (req, res, next)=>{
  let token = getToken(req.headers);
  if (token) {
    Order.findByIdAndUpdate(req.params.id, req.body, { new: true } ).populate('orderItem').exec((err, order) => {
      console.log("REQ BODYYYYYYYYYYYYYY", req.body)
      if(err || !order){
        return sendSuccess(res, order)
      } else {
        return sendSuccess(res, order)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};




//DELETE BY ID
exports.deleteById = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    Order.findByIdAndRemove(req.params.id, req.body, function (err, order) {
      if (err || !order) {
        return sendError(res, {}, 'Cannot delete order');
      } else {
        return sendSuccess(res, order);
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
}







// ADD AN ORDER ITEM
exports.addOrderItem = (req, res, next) => {
  let token = getToken(req.headers);
  if (token) {
    const orderItem = new OrderItem(req.body);

    Order.findByIdAndUpdate(req.params.id).populate('orderItem').exec((err, callbackOrder) => {
        if(err || !callbackOrder){
          return sendError(res, err, 'Order not found.')
        } else {

          Product.findById(req.body.productId, function (err, product) {
            if (err || !product) {
              return sendError(res, err, 'Cannot get product')
            } else {

              if (product.stocks < orderItem.qty) {
                console.log("PASOK SA ERROR")
                return sendError(res, err, 'Sorry this product is short for stocks to fulfill your quantity')
              } else {
                callbackOrder.orderItem.push(orderItem);

                orderItem.total = product.price * orderItem.qty;
                orderItem.productName = product.name;
                orderItem.credit = 'false';

                callbackOrder.totalPrice = callbackOrder.totalPrice + orderItem.total;

                product.stocks = product.stocks - orderItem.qty;


                product.save();
                orderItem.save();
                callbackOrder.save();

                return sendSuccess(res, callbackOrder)
              }
            }
          });

          // return sendSuccess(res, callbackOrder);
        }
      })
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }



};
