// controllers/userController.js
const User = require('../models/User.js');
const Category = require('../models/Category.js');
const Notification = require('../models/Notification.js');
const mongoose = require('mongoose');

const { sendError, sendSuccess, getToken, sendErrorUnauthorized, decodeToken } = require ('../utils/methods');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
// const dotenv = require('dotenv').config();
const secretKey = process.env.JWT_SECRET_KEY;
const captchaSecret = process.env.CAPTCHA_SECRET_KEY;


const axios = require('axios'); // Require the axios library
const frontEndUrl = process.env.SERVER === 'LIVE' ? 'https://snapstock.site' : 'http://localhost:3000';

// Get all users
exports.list = (req, res) => {
  let token = getToken(req.headers);
  if (token) {
    const decodedToken = jwt.decode(token);
    if (decodedToken.user.role === 3 || decodedToken.user.role === 1) {
      const { pageIndex, pageSize, username } = req.query;

      // console.log("REQ QUERYY", req.query);

      const page = pageIndex;
      const limit = pageSize;

      let sortPageLimit = {
        page,
        limit
      };

      let categIds = req.query.category && req.query.category.split(',').map(function(categ) {
        return mongoose.Types.ObjectId(categ);
      });


      const userFieldsFilter = {
        username: username ? { $regex: username, $options: 'i' } : undefined,
        category: req.query.category ? { $in: categIds } : undefined,
      };

      // console.log("[[[[FILTER FIELDSSSSSSSSS]]]]", userFieldsFilter)

      // Will remove a key if that key is undefined
      Object.keys(userFieldsFilter).forEach(key => userFieldsFilter[key] === undefined && delete userFieldsFilter[key]);

      const filterOptions = [
        { $match: userFieldsFilter },
        // { $sort: { createdAt: 1 } },
      ];

      const aggregateQuery = User.aggregate(filterOptions);

      /*User.find({}, (err, users) => {
        if (err) return res.status(400).json({ message: 'Error fetching users' });
        res.json(users);
      });*/

      User.aggregatePaginate(aggregateQuery, sortPageLimit, (err, result) => {
        if (err) {
          // console.log("ERRoRRRRRRRRRRRRRRRRR", err)
          return sendError(res, err, 'Server Failed');
        } else {
          return sendSuccess(res, result);
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "You are not authorized to access this data.")
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};




const sendVerificationEmail = async (user) => {
  // console.log('FRONTEND URL', frontEndUrl);
  const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1w' });

  user.verificationToken = token;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: 'SnapStock <snapstockinventorychecker@gmail.com>',
    to: user.email,
    subject: 'Account Verification',
    html: `<html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  padding: 20px;
                  background-color: #f4f4f4;
                  color: #333;
                }
                h1 {
                  color: #007bff;
                }
                p {
                  line-height: 1.6;
                }
                a {
                  color: #007bff;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <h1>Welcome to Snap Stock Inventory Checker!</h1>
              <p>Dear ${user.fname},</p>
              <p>Thank you for registering with Snap Stock Inventory Checker! We are delighted to have you as a new member of our community.</p>
              <p>Your account is already added to our sytem. But before logging in, please verify your account by clicking the following link:</p>
              <p><a href="${frontEndUrl}/verify/${token}">Verify Your Account</a></p>
              <p>Once you've clicked the link to verify your account, you'll be routed to   the login page and you'll be able to login your account</p>
              <p>If you have any questions or need assistance, feel free to reach out to our support team at snapstockinventorychecker@gmail.com.</p>
              <p>We wish you a great experience with Snap Stock Inventory Checker!</p>
              <p>Best regards,<br/>The Snap Stock Inventory Checker Team</p>
            </body>
          </html>`,
  };

  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error:', error);
    } else {
        // console.log('Email sent: ' + info.response);
    }
  });;
};

const sendResetPasswordEmail = async (user, token) => {
  // console.log('FRONT URL', frontEndUrl);
  const resetPasswordLink = `${frontEndUrl}/changepassword/${token}`;
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: 'SnapStock <snapstockinventorychecker@gmail.com>',
    to: user.email,
    subject: 'Password Reset Request',
    html: `<html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  padding: 20px;
                  background-color: #f4f4f4;
                  color: #333;
                }
                h1 {
                  color: #007bff;
                }
                p {
                  line-height: 1.6;
                }
                a {
                  color: #007bff;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <h1>Snap Stock Password Reset</h1>
              <p>Dear ${user.fname},</p>
              <p>We received a request to reset your password for Snap Stock Inventory Checker. To proceed, please click the following link:</p>
              <p><a href="${resetPasswordLink}">Reset Your Password</a></p>
              <p>If you did not initiate this request, you can safely ignore this email. Your account security is important to us.</p>
              <p>If you have any questions or need assistance, feel free to reach out to our support team at snapstockinventorychecker@gmail.com.</p>
              <p>Best regards,<br/>The Snap Stock Inventory Checker Team</p>
            </body>
          </html>`,
  };


  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error:', error);
    } else {
        // console.log('Email sent: ' + info.response);
    }
  });;
};

const sendVerificationEmailForEmployeeUser = async (emailNeeds) => {
  // console.log('FRONTEND URL', frontEndUrl);
  const token = jwt.sign({ userId: emailNeeds.user._id }, secretKey, { expiresIn: '1w' });

  emailNeeds.user.verificationToken = token;
  await emailNeeds.user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: 'SnapStock <snapstockinventorychecker@gmail.com>',
    to: emailNeeds.user.email,
    subject: 'Account Verification',
    html: `<html>
            <head>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  margin: 20px;
                  padding: 20px;
                  background-color: #f4f4f4;
                  color: #333;
                }
                h1 {
                  color: #007bff;
                }
                p {
                  line-height: 1.6;
                }
                a {
                  color: #007bff;
                  text-decoration: none;
                }
                a:hover {
                  text-decoration: underline;
                }
              </style>
            </head>
            <body>
              <h1>Welcome to Snap Stock!</h1>
              <p>Hello ${emailNeeds.user.fname},</p>
              <p>Looks like you're now part of the Snap Stock community. We are thrilled to have you on board!</p>
              <p>Your employee account is now active. Before you log in, please take a moment to verify your account by clicking the following link:</p>
              <p><a href="${frontEndUrl}/verify/${token}">Verify Your Account</a></p>
              <p>Your initial password is: ${emailNeeds.password}. Make sure to complete the verification process before logging in for the first time.</p>
              <p>Once you've clicked the link to verify your account, you'll be routed to   the login page and you'll be able to login your account</p>
              <p>If you have any questions or need assistance, feel free to reach out to our support team at snapstockinventorychecker@gmail.com.</p>
              <p>We wish you a great experience with Snap Stock Inventory Checker!</p>
              <p>Best regards,<br/>The Snap Stock Inventory Checker Team</p>
            </body>
          </html>`,
  };


  await transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error:', error);
    } else {
        // console.log('Email sent: ' + info.response);
    }
});;
};


exports.add = async (req, res, io) => {
  const {
    username,
    email,
    fname,
    lname,
    password,
    repassword,
    category
  } = req.body;

  let token;
  if (!req.headers || Object.keys(req.headers).length === 0) {
      token = '';
  } else {
      token = getToken(req.headers);
  }

  // console.log('REQ BODY REGISTER', req.body);

  if (username && password && repassword && email && fname && lname && category) {
    if (password === repassword) {
      // Extract the reCAPTCHA response from the request body
      const recaptchaValue = req.body['g-recaptcha-response'];

      // console.log('ReCAPTCHA VALUE', recaptchaValue);

      if (!recaptchaValue) {
        return sendError(res, '', 'Please answer reCAPTCHA.');
      }

      // Verify the reCAPTCHA response using axios
      try {
        const googleVerifyUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${captchaSecret}&response=${recaptchaValue}`;
        const response = await axios.post(googleVerifyUrl);
        const {
          success
        } = response.data;

        // console.log('Google reCAPTCHA Response:', response.data);

        if (success) {
          // Continue with the user registration process

          const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
          const capitalizedFname = capitalizeFirstLetter(req.body.category);
          req.body.name = capitalizedFname;

          Category.create(req.body, (err, cat) => {
            const capitalizedFname = capitalizeFirstLetter(req.body.name);
            // console.log('CATEGORY NAMEEEEEEEEE', req.body);

            if (err) {
              // console.log('ERROR SA ADD CATEGORY', err);
              return sendError(res, err, 'Add category failed', 400, 101, 'Category');
            }

            req.body.category = cat._id.toString();

            User.findOne({ $or: [{ email }, { username }] }).then(existingUser => {
              if (existingUser) {
                if (existingUser.email === email) {
                  return sendError(res, err, 'User with this email already exists');
                } else if (existingUser.username === username) {
                  return sendError(res, err, 'User with this username already exists');
                }
              }

              const capitalizedFname = capitalizeFirstLetter(req.body.fname);
              const capitalizedLname = capitalizeFirstLetter(req.body.lname);

              const user = new User({
                ...req.body,
                fname: capitalizedFname,
                lname: capitalizedLname,
              });

              User.find({ category: '65d70c80bb027ec6cce7e8d9' })
              .exec((err, admins) => {
                if (err) {
                  console.error('Error getting users with the same category:', err);
                  return;
                }

                // Create notifications for each user
                admins.forEach(admin => {
                  let notificationMessage =  `${user.fname} joined SnapStock with a business named ${cat.name}`;

                  const notification = new Notification({
                    category: '65d70c80bb027ec6cce7e8d9',
                    message: notificationMessage,
                    user: admin._id // Add user ID to the notification
                  });

                  // Save the notification to the database
                  notification.save((err) => {
                    if (err) {
                      console.error('Error saving notification:', err);
                      return;
                    }
                  });
                });
              });

              user.save()
                .then(() => {
                  sendVerificationEmail(user)
                    .then(() => {
                      if (io) {
                        io.to('65d70c80bb027ec6cce7e8d9').emit(
                          "notify",
                          {
                            token,
                            message: `${user.fname} joined SnapStock with a business named ${cat.name}`,
                          },
                          (error) => {
                            if (error) {
                              console.error("Emit failed:", error);
                            } else {
                              console.log("Emit successful");
                            }
                          }
                        );
                      }

                      return sendSuccess(res, user);
                    })
                    .catch((error) => {
                      console.error('Error sending verification email:', error);
                      return sendError(res, error, 'Add user failed', 400, 101, 'User');
                    });
                })
                .catch((error) => {
                  console.error('Error creating user:', error);
                  return sendError(res, error, 'Add user failed', 400, 101, 'User');
                });
            }).catch((error) => {
              console.error('Error checking existing user:', error);
              return sendError(res, error, 'Add user failed', 400, 101, 'User');
            });
          });
        } else {
          return sendError(res, '', 'Invalid reCAPTCHA.');
        }
      } catch (e) {
        console.error('Recaptcha verification error:', e);
        return sendError(res, e, 'Recaptcha verification failed', 400, 102, 'User');
      }
    } else {
      return sendError(res, '', 'Password did not match.');
    }
  } else {
    return sendError(res, '', 'Please fill up the required fields.');
  }
};

exports.addEmplooyeeUser = (req, res) => {
  let username = req.body.username;
  let category = req.body.category;
  let email = req.body.email;
  let fname = req.body.fname;
  let lname = req.body.lname;

  const generateRandomPassword = () => {
    const min = 100000; // Minimum 6-digit number
    const max = 999999; // Maximum 6-digit number
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  if (username && email && fname && lname && category) {
    try {
      const { email, username, fname, lname } = req.body;

      // req.body.role = 0;
      req.body.password = generateRandomPassword(); // Set a random 6-digit password

      User.findOne({ $or: [{ email }, { username }] }).then(existingUser => {
        if (existingUser) {
          if (existingUser.email === email) {
            return sendError(res, '', 'User with this email already exists');
          } else if (existingUser.username === username) {
            return sendError(res, '', 'User with this username already exists');
          }
        }

        const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);

        const capitalizedFname = capitalizeFirstLetter(req.body.fname);
        const capitalizedLname = capitalizeFirstLetter(req.body.lname);

        const user = new User({
          ...req.body,
          fname: capitalizedFname,
          lname: capitalizedLname,
        });

        let password = req.body.password;

        const emailNeeds = {
          user,
          password
        }

        user.save().then(() => {
          // Send verification email
          sendVerificationEmailForEmployeeUser(emailNeeds)
            .then(() => {
              return sendSuccess(res, user);
            })
            .catch((error) => {
              console.error('Error sending verification email:', error);
              return res.status(500).json({ error: 'Internal server error' });
            });
        }).catch((error) => {
          console.error('Error creating user:', error);
          return res.status(500).json({ error: 'Internal server error' });
        });
      }).catch((error) => {
        console.error('Error checking existing user:', error);
        return res.status(500).json({ error: 'Internal server error' });
      });

    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return sendError(res, '', 'Please fill up the required fields.');
  }
};


// Function to handle email verification
exports.verifyUser = async (req, res) => {
  const token = req.params.token;

  try {
    // Decode the token
    const decoded = jwt.verify(token, secretKey);

    // Find the user with the decoded user ID
    const user = await User.findById(decoded.userId);

    if (!user) {
      return sendError(res, '', 'User not found.');
    }

    // Update the user's verified status to "TRUE"
    user.verified = true;
    await user.save();

    return sendSuccess(res, user, 'User verified successfully.');
  } catch (error) {
    console.error('Error verifying user:', error);
    return res.status(500).json({ error: 'Error verifying user' });
  }
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

    // Check if password and retype password match
    if (req.body.password !== req.body.repassword) {
      return sendError(res, null, "Password and retype password do not match");
    }

    const capitalizeFirstLetter = (str) => str.charAt(0).toUpperCase() + str.slice(1);
    const capitalizedFname = capitalizeFirstLetter(req.body.fname);
    const capitalizedLname = capitalizeFirstLetter(req.body.lname);

    // If the request includes a new password, hash it before updating
    User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, fname: capitalizedFname, lname: capitalizedLname },
      { new: true },
      (err, updatedUser) => {
        if (err || !updatedUser) {
          return sendError(res, err, 'Cannot update user');
        } else {
          return sendSuccess(res, updatedUser, 'User updated successfully.');
        }
      }
    );
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};


// Update a user by ID
// Controller function to request a new password
exports.requestNewPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate a reset token and save it to the user document
    const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h' });

    user.verificationToken = token;
    await user.save();

    // Send an email with the reset password link
    sendResetPasswordEmail(user, token);

    return sendSuccess(res, user, 'Request for new password already sent through your email. Please wait for the email.');
  } catch (error) {
    console.error('Error requesting new password:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


// ... (previous code)



exports.changePassword = async (req, res) => {
  const { password, repassword } = req.body;

  if (password === repassword) {
    const token = req.params.token;

    try {
      // Verify the token
      const decodedToken = jwt.verify(token, secretKey);
      bcrypt.genSalt(10, (err, salt) => {
        if (err) {
          return sendError(res, err, "Error generating salt for password update");
        }

        bcrypt.hash(req.body.password, salt, (err, hash) => {
          if (err) {
            return sendError(res, err, "Error hashing password for update");
          }

          // Update the user with the hashed password
          User.findByIdAndUpdate(
            decodedToken.userId,
            { ...req.body, password: hash },
            { new: true },
            (err, updatedUser) => {
              if (err || !updatedUser) {
                return sendError(res, err, 'Cannot update user');
              } else {
                return sendSuccess(res, updatedUser, 'Password changed successfully');
              }
            }
          );
        });
      });

      // return res.status(200).json({ message: 'Password changed successfully' });
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }

      console.error('Error changing password:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return res.status(400).json({ error: 'Password and Re-type password did not match.' });
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
          return sendSuccess(res, user, 'User deleted successfully.')
        }
      });
    } else {
      return sendErrorUnauthorized(res, "", "You are not authorized to delete a new user.");
    }
  } else {
    return sendErrorUnauthorized(res, "", "Please login first.");
  }
};
