// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User.js');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const secretKey = 'your-secret-key';

const { sendError, sendSuccess, getToken, sendErrorUnauthorized } = require ('../utils/methods');

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
    console.log('req bodyyyyyyyyyyyyyyy', req.body)
    if (err) {
      sendError(res, {}, 'Failed to store refreshments.');
      console.log("ERRRRRRRRRRRRRRORRRRR 1", err)
    }

    if (!user) {
      return sendErrorUnauthorized(res, "", "User not found.")
    }

    user.comparePassword(password, (err, isMatch) => {
      if (err) {
        sendError(res, {}, 'SERVER ERRRORRRR.');
        console.log("ERRRRRRRRRRRRRRORRRRR 2", err)
      }

      if (!isMatch) {
        return sendErrorUnauthorized(res, "", "Wrong password.")
      }

      const token = jwt.sign({ id: user._id }, secretKey, {
        expiresIn: '24h',
      });

      return sendSuccess(res, { token });
    });
  });
});

module.exports = router;
