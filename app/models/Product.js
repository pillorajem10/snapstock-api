'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

let ProductSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    price: { type: Number, default: 0 },
    stocks: { type: Number, default: 0 },
    category: { type: Schema.ObjectId, ref: 'Category' },
  },
  { timestamps: true }
);

ProductSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Product', ProductSchema);
