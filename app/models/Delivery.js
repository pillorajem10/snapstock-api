'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const { ObjectId } = mongoose.Schema;

let DeliverySchema = new mongoose.Schema (
  {
    monthDelivered: { type: Number, default: 0 },
    dateDelivered: { type: Number, default: 0 },
    yearDelivered: { type: Number, default: 0 },
    productId: { type: ObjectId, ref: "Product" },
    productName: { type: String, default: '' },
    qty: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

DeliverySchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Delivery', DeliverySchema);
