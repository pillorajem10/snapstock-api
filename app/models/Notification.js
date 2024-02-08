'use strict';

const mongoose = require('mongoose');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

let NotificationSchema = new mongoose.Schema(
  {
    category: { type: Schema.ObjectId, ref: 'Category' },
    message: { type: String, default: '' },
    unread: { type: Boolean, default: true },
    user: { type: Schema.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);


NotificationSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('Notification', NotificationSchema);
