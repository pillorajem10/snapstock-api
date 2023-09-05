// controllers/userController.js
const User = require('../models/User.js');

// Create a new user
exports.createUser = (req, res) => {
  const newUser = new User(req.body);
  newUser.save((err, user) => {
    if (err) return res.status(400).json({ message: 'Error creating user' });
    res.json(user);
  });
};

// Get all users
exports.getAllUsers = (req, res) => {
  User.find({}, (err, users) => {
    if (err) return res.status(400).json({ message: 'Error fetching users' });
    res.json(users);
  });
};

// Get a user by ID
exports.getUserById = (req, res) => {
  User.findById(req.params.id, (err, user) => {
    if (err) return res.status(400).json({ message: 'Error fetching user' });
    res.json(user);
  });
};

// Update a user by ID
exports.updateUser = (req, res) => {
  User.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, user) => {
    if (err) return res.status(400).json({ message: 'Error updating user' });
    res.json(user);
  });
};

// Delete a user by ID
exports.deleteUser = (req, res) => {
  User.findByIdAndRemove(req.params.id, (err) => {
    if (err) return res.status(400).json({ message: 'Error deleting user' });
    res.json({ message: 'User deleted successfully' });
  });
};
