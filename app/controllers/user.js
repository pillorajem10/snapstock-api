// controllers/userController.js
const User = require('../models/User.js');
const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');

// Get all users
exports.list = (req, res) => {
  const { pageIndex, pageSize, username } = req.query;

  console.log("REQ QUERYY", req.query);

  const page = pageIndex;
  const limit = pageSize;

  let sortPageLimit = {
    page,
    limit
  };


  const userFieldsFilter = {
    username: username ? { $regex: username, $options: 'i' } : undefined,
  };


  console.log("[[[[FILTER FIELDSSSSSSSSS]]]]", userFieldsFilter)

  // Will remove a key if that key is undefined
  Object.keys(userFieldsFilter).forEach(key => userFieldsFilter[key] === undefined && delete userFieldsFilter[key]);

  const filterOptions = [
    { $match: userFieldsFilter },
  ];

  const aggregateQuery = User.aggregate(filterOptions);

  /*User.find({}, (err, users) => {
    if (err) return res.status(400).json({ message: 'Error fetching users' });
    res.json(users);
  });*/

  User.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
    if (err) {
      console.log("ERRoRRRRRRRRRRRRRRRRR", err)
      return sendError(res, err, 'Server Failed');
    } else {
      return sendSuccess(res, result);
    }
  });
};

// Create a new user
exports.add = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    User.create(req.body, function (err, usr) {
      if (err) {
        return sendError(res, err, 'Add User failed')
      } else {
        return sendSuccess(res, usr)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};


// Get a user by ID
exports.getById = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    User.findById(req.params.id, (err, user) => {
      if (err) return res.status(400).json({ message: 'Error fetching user' });
      res.json(user);
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};

// Update a user by ID
exports.updateById = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    User.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, user) => {
      if (err) return res.status(400).json({ message: 'Error updating user' });
      res.json(user);
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};

// Delete a user by ID
exports.deleteById = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    User.findByIdAndRemove(req.params.id, (err) => {
      if (err) return res.status(400).json({ message: 'Error deleting user' });
      res.json({ message: 'User deleted successfully' });
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};
