// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = 'your-secret-key';

// Register a new user
router.post('/register', (req, res) => {
  const newUser = new User(req.body);
  newUser.save((err, user) => {
    if (err) return res.status(400).json({ message: 'Error creating user' });
    res.json(user);
  });
});

// Login a user
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  User.findOne({ username }, (err, user) => {
    if (err) return res.status(500).json({ message: 'Server error' });

    if (!user) {
      return res.status(401).json({ message: 'Authentication failed. User not found.' });
    }

    user.comparePassword(password, (err, isMatch) => {
      if (err) return res.status(500).json({ message: 'Server error' });

      if (!isMatch) {
        return res.status(401).json({ message: 'Authentication failed. Wrong password.' });
      }

      const token = jwt.sign({ id: user._id }, secretKey, {
        expiresIn: '24h',
      });

      res.json({ message: 'Authentication successful', token });
    });
  });
});

module.exports = router;
