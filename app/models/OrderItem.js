'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { ObjectId } = mongoose.Schema;

let OrderItemSchema = new mongoose.Schema (
  {
    orderId: { type: ObjectId, ref: "Order" },
    productId: { type: String, default: '' },
  	productName: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    credit: { type: String, default: '' },
    category: { type: ObjectId, ref: 'Category' },
  },
  {
    timestamps: true,
  }
);

OrderItemSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('OrderItem', OrderItemSchema);
