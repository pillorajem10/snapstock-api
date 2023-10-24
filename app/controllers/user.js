// controllers/userController.js
const User = require('../models/User.js');
const { sendError, sendSuccess, getToken, sendErrorUnauthorized, decodeToken } = require ('../utils/methods');

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
  /*
  let token = getToken(req.headers);
  if (token) {
    const user = decodeToken(token);
    if (user && user.user.role === 1) {
      User.create(req.body, function (err, user) {
        if (err) {
          console.log('ERRRRRRRRRRRR', err)
          return sendError(res, err, 'Add User failed');
        } else {
          return sendSuccess(res, user);
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "You are not authorized to create a new user.");
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }*/

  User.create(req.body, function (err, user) {
    if (err) {
      console.log('ERRRRRRRRRRRR', err)
      return sendError(res, err, 'Add User failed');
    } else {
      return sendSuccess(res, user);
    }
  });
};



// Get a user by ID
exports.getById = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    User.findById(req.params.id, function (err, user) {
      if (err || !user) {
        return sendError(res, err, 'Cannot get user')
      } else {
        return sendSuccess(res, user)
      }
    });
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.")
  }
};

// Update a user by ID
exports.updateById = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    const user = decodeToken(token);
    if (user && user.user.role === 1) {
      User.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, user) => {
        console.log('UPDATEEEEEEEEEEEE USER PAYLOADDD', user)
        if (err || !user) {
          return sendError(res, err, 'Cannot update user')
        } else {
          return sendSuccess(res, user)
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "You are not authorized to update a new user.");
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};

// Delete a user by ID
exports.deleteById = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    const user = decodeToken(token);
    if (user && user.user.role === 1) {
      User.findByIdAndRemove(req.params.id, (err) => {
        if (err || !user) {
          return sendError(res, err, 'Cannot delete user')
        } else {
          return sendSuccess(res, user)
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "You are not authorized to delete a new user.");
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};
