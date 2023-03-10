const User = require('../models/user');
const {validationResult} = require('express-validator');
const bcrypt = require('bcryptjs');

exports.signup = (req,res,next) => {
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

    bcrypt
        .hash(password, 12)
        .then(hashPassword => {
            const user = new User({
                email: email,
                password: hashPassword,
                name: name
            })
            return user.save()
        })
        .then(result => {
            res.status(201).json({ message: "User Created!", userId: result._id });
        })
        .catch(error => {
            if (!error.statusCode) {
            error.statusCode = 500;
            }
            next(error);
        })

}