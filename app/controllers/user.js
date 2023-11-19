// controllers/userController.js
const User = require('../models/User.js');
const Category = require('../models/Category.js');

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




const sendVerificationEmail = async (user) => {
  const token = jwt.sign({ userId: user._id }, 'your-secret-key', { expiresIn: '1w' });

  user.verificationToken = token;
  await user.save();

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'snapstockinventorychecker@gmail.com',
      pass: 'taps tdvk oilr iyyt',
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  const mailOptions = {
    from: 'snapstockinventorychecker@gmail.com',
    to: user.email,
    subject: 'Account Verification',
    text: `Click the following link to verify your account: http://localhost:3000/verify/${token}`,
  };

  await transporter.sendMail(mailOptions);
};


exports.add = (req, res) => {
  let username = req.body.username;
  let password = req.body.password;
  let repassword = req.body.repassword;

  if (username && password && repassword) {
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

                const user = new User({ email, password, username, fname, lname });
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
