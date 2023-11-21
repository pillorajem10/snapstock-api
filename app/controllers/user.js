// controllers/userController.js
const User = require('../models/User.js');
const Category = require('../models/Category.js');
const mongoose = require('mongoose');

const { sendError, sendSuccess, getToken, sendErrorUnauthorized, decodeToken } = require ('../utils/methods');
const nodemailer = require('nodemailer');
const smtpTransport = require('nodemailer-smtp-transport');
const jwt = require('jsonwebtoken');

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

  let categIds = req.query.category && req.query.category.split(',').map(function(categ) {
    return mongoose.Types.ObjectId(categ);
  });


  const userFieldsFilter = {
    username: username ? { $regex: username, $options: 'i' } : undefined,
    category: req.query.category ? { $in: categIds } : undefined,
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




const sendVerificationEmail = async (user) => {
  const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1w' });

  user.verificationToken = token;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'snapstockinventorychecker@gmail.com',
      pass: 'tvuw hhos jsvj celm',
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
              <p><a href="http://localhost:3000/verify/${token}">Verify Your Account</a></p>
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
        console.log('Email sent: ' + info.response);
    }
});;
};

const sendVerificationEmailForEmployeeUser = async (emailNeeds) => {
  console.log('EMAIL NEEEDSSSSS', emailNeeds);
  const token = jwt.sign({ userId: emailNeeds.user._id }, 'your-secret-key', { expiresIn: '1w' });

  emailNeeds.user.verificationToken = token;
  await emailNeeds.user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'snapstockinventorychecker@gmail.com',
      pass: 'tvuw hhos jsvj celm',
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
              <p><a href="http://localhost:3000/verify/${token}">Verify Your Account</a></p>
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
        console.log('Email sent: ' + info.response);
    }
});;
};


exports.add = (req, res) => {
  let username = req.body.username;
  let email = req.body.email;
  let fname = req.body.fname;
  let lname = req.body.lname;
  let password = req.body.password;
  let repassword = req.body.repassword;
  let category = req.body.category;

  if (username && password && repassword && email && fname && lname && category) {
    if (password === repassword) {
      /* IN THIS SECTION ONCE YOU SUBMITED THE REQUEST THE CATEGORY FROM THE REQ.BODY WILL CREATE THE
       CATEGORY FIRST ON THE DATABASE*/

      req.body.name = req.body.category;
      Category.create(req.body, function (err, cat) {
        console.log('CATEGORY NAMEEEEEEEEE', req.body)
        if (err) {
          console.log('ERROR SA ADD CATEGORY', err);
          return sendError(res, err, 'Add category failed')
        } else {
          /* ONCE THE CATEGORY ON THE DATABASE WAS CREATE THE OBJECT ID FROM THE RESPONSE WILL BE THE CATEGORY ON THE USER*/
          req.body.category = cat._id.toString();
          try {
              const { email, password, username, fname, lname } = req.body;

              User.findOne({ email }).then(existingUser => {
                if (existingUser) {
                  return sendError(res, err, 'User with this email already exists');
                }

                const user = new User(req.body);
                user.save().then(() => {
                  // Send verification email
                  sendVerificationEmail(user)
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
              });
            } catch (error) {
              console.error('Error creating user:', error);
              return res.status(500).json({ error: 'Internal server error' });
            }
        }
      });
    } else {
      return sendError(res, '', 'Password did not matched.');
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

      req.body.role = 0;
      req.body.password = generateRandomPassword(); // Set a random 6-digit password

      User.findOne({ email }).then(existingUser => {
        if (existingUser) {
          return sendError(res, 'User with this email already exists');
        }

        const user = new User(req.body);
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
      });
    } catch (error) {
      console.error('Error creating user:', error);
      return res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    return sendError(res, '', 'Please fill up the required fields.');
  }
};

/*exports.add = async (req, res) => {
  // Function to generate a random verification token
  function generateVerificationToken() {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'pillorajem10@gmail.com',
      pass: 'kmwa cuuz ovxt ygcv',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  try {
    const { username, password, repassword } = req.body;
    const email = 'pillorajem7@gmail.com'; // Use the email from req.body or any other source

    if (username && password && repassword && email) {
      if (password === repassword) {
        const verificationToken = generateVerificationToken();

        // Send verification email
        const mailOptions = {
          from: 'pillorajem10@gmail.com',
          to: email,
          subject: 'Email Verification',
          text: `Click the following link to verify your email: http://your-website.com/verify/${verificationToken}`
        };

        transporter.sendMail(mailOptions, async (error, info) => {
          if (error) {
            console.error('Error sending verification email:', error);
            return res.status(500).json({ error: 'Email verification failed' });
          } else {
            // Save user to the database with verification token
            const user = await User.create({
              username,
              password,
              repassword,
              email,
              verificationToken,
            });

            return res.status(200).json({ message: 'Email verification sent. Please check your email.', user });
          }
        });
      } else {
        return res.status(400).json({ error: 'Password did not match.' });
      }
    } else {
      return res.status(400).json({ error: 'Please fill up the required fields.' });
    }
  } catch (error) {
    console.error('Error creating user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};*/

// Function to handle email verification
exports.verifyUser = async (req, res) => {
  const token = req.params.token;

  try {
    // Decode the token
    const decoded = jwt.verify(token, 'your-secret-key');

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
