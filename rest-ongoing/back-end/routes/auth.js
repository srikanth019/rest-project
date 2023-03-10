const express = require('express');
const {body} = require('express-validator');

const User = require('../models/user')
const authController = require('../controllers/auth');


const router = express.Router();

router.put('/signup',[
    body('email')
        .trim()
        .isEmail()
        .withMessage('Enter valid E-mail address')
        .custom((value, { req }) => {
            return User.findOne({email: value}).then(userDoc => {
                if (userDoc) {
                    return Promise.reject('This E-mail address Already exist');
                }
            })
        })
        .normalizeEmail(),
    body('password')
        .trim()
        .isLength({min: 5}),
    body('name')
        .trim()
        .not()
        .isEmpty()
], authController.signup)


module.exports = router;