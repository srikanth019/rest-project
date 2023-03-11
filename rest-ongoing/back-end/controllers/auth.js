const User = require('../models/user');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.signup = async (req,res,next) => {
  const errors = validationResult(req);
  console.log(errors);
  if (!errors.isEmpty()) {
      const error = new Error('Validation Failed. Please Enter correct data');
      error.statusCode = 422;
      errors.data = errors.array(); 
      throw error;
  }
  const email = req.body.email;
  const name = req.body.name;
  const password = req.body.password;
  try {
    const hashPassword = await bcrypt.hash(password, 12);
      const user = new User({
          email: email,
          password: hashPassword,
          name: name
      })
    const result = await user.save()
    res.status(201).json({ message: "User Created!", userId: result._id });
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }

}

// exports.login = (req,res,next) => {
//     const email = req.body.email;
//     const password = req.body.password;
//     let loadedUser;

//     User.findOne({email: email}).then(user => {
//         if (!user) {
//             const error = new Error('User could not find with this email');
//             error.statusCode = 401;
//             throw error;
//         }
//     return bcrypt.compare(password, user.password)
//     })
//     .then(isEqual => {
//         if (!isEqual) {
//             const error = new Error("Wrong Password!")
//             error.statusCode = 401;
//             throw error;
//         }
//         const token = jwt.sign(
//             {
//             email: loadedUser.email,
//             userId: loadedUser._id.toString()
//             },
//             "secretMsg",
//             {expiresIn: '1h '}
//         );
//         res.status(200).json({ token: token, userId: loadedUser._id.toString() });
//     }) 
//     .catch(error => {
//         if (!error.statusCode) {
//         error.statusCode = 500;
//         }
//         next(error);
//     })

// }

exports.login = async (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  let loadedUser;
  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error('A user with this email could not be found.');
      error.statusCode = 401;
      throw error;
    }
    loadedUser = user;
    const isEqual = bcrypt.compare(password, user.password);
      if (!isEqual) {
        const error = new Error('Wrong password!');
        error.statusCode = 401;
        throw error;
      }
      const token = jwt.sign(
        {
          email: loadedUser.email,
          userId: loadedUser._id.toString()
        },
        'secretMesssage',
        { expiresIn: '1h' }
      );
      res.status(200).json({ token: token, userId: loadedUser._id.toString() });
  }
  catch (error) {
    if (!error.statusCode) {
      error.statusCode = 500;
    }
    next(error);
  }
};