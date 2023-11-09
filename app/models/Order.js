'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { ObjectId } = mongoose.Schema;
// const Schema = mongoose.Schema;

let OrderSchema = new mongoose.Schema(
  {
    customerName: { type: String, default: '' },
    totalPrice: { type: Number, default: 0 },
    orderItem: [{ type: ObjectId, ref: 'OrderItem' }],
    monthOrdered: { type: Number, default: 0 },
    dateOrdered: { type: Number, default: 0 },
    yearOrdered: { type: Number, default: 0 },
    credit: { type: String, default: '' },
    category: { type: ObjectId, ref: 'Category' },
  },
  { timestamps: true }
);

OrderSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Order', OrderSchema);
