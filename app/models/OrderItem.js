'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

let OrderItemSchema = new mongoose.Schema (
  {
    productId: { type: String, default: '' },
  	productName: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
    credit: { type: String, default: '' },
  },
  {
    timestamps: true,
  }
);

OrderItemSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('OrderItem', OrderItemSchema);
