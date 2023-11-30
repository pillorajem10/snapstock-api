const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const aggregatePaginate = require("mongoose-aggregate-paginate-v2");
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  username: {
    type: String,
    unique: true,
    required: true,
  },
  role: {
    type: Number,
    default: 1
  },
  verified: {
    type: Boolean,
    default: false
  },
  verificationToken: {
    type: String,
  },
  password: {
    type: String,
    required: true,
  },
  category: {
    type: Schema.ObjectId,
    ref: 'Category'
  },
}, { timestamps: true });

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

UserSchema.pre('findOneAndUpdate', function (next) {
  const update = this._update;

  if (update.password) {
    bcrypt.genSalt(10, (err, salt) => {
      if (err) return next(err);

      bcrypt.hash(update.password, salt, (err, hash) => {
        if (err) return next(err);
        this._update.$set.password = hash;
        next();
      });
    });
  } else {
    next();
  }
});

UserSchema.plugin(aggregatePaginate);

module.exports = mongoose.model('User', UserSchema);
