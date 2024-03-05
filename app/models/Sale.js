'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

let SaleSchema = new mongoose.Schema(
  {
    date: { type: String, default: '' },
    price: { type: Number, default: 0 },
    category: { type: Schema.ObjectId, ref: 'Category' },
  },
  { timestamps: true }
);

SaleSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Sale', SaleSchema);
