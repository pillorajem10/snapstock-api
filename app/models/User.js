// models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  role: { type: Number, default: 0 },
  password: {
    type: String,
    required: true,
  },
});

UserSchema.pre('save', function (next) {
  const user = this;

  if (!user.isModified('password')) return next();

  bcrypt.genSalt(10, (err, salt) => {
    if (err) return next(err);

    bcrypt.hash(user.password, salt, (err, hash) => {
      if (err) return next(err);
      user.password = hash;
      next();
    });
  });
});

UserSchema.methods.comparePassword = function (candidatePassword, callback) {
  bcrypt.compare(candidatePassword, this.password, (err, isMatch) => {
    if (err) return callback(err);
    callback(null, isMatch);
  });
};

UserSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('User', UserSchema);
