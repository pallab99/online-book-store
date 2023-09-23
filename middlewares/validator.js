const { body, param } = require('express-validator');
const { PHONE_REGEX, SPECIAL_CHARACTERS } = require('../constants/regex');
const mongoose = require('mongoose');
const containsSpecialCharacters = (value) => {
    const specialCharactersRegex = SPECIAL_CHARACTERS;
    return !specialCharactersRegex.test(value);
};
const validator = {
    createBook: [
        body('title')
            .exists()
            .notEmpty()
            .withMessage('Title is required.')
            .bail()
            .isString()
            .withMessage('Title must be a string.')
            .bail()
            .isLength({ min: 3, max: 50 })
            .withMessage('Title length must be between 3 to 50')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('description')
            .exists()
            .notEmpty()
            .withMessage('Description is required.')
            .bail()
            .isString()
            .withMessage('Description must be a string.')
            .bail()
            .isLength({ min: 15, max: 200 })
            .withMessage('Title length must be between 15 to 200')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('price')
            .exists()
            .isFloat({ min: 0, max: 10000 })
            .withMessage('Price must be a valid number between 0 and 100.')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Price must be a number');
                } else {
                    return true;
                }
            }),
        body('rating')
            .exists()
            .isFloat({ min: 1, max: 5 })
            .withMessage('Rating is required and must be between 1 and 5.')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Rating must be a number');
                } else {
                    return true;
                }
            }),
        body('stock')
            .exists()
            .isFloat({ min: 10, max: 500 })
            .withMessage('Stock must be a valid number between 10 and 500.')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Stock must be a number');
                } else {
                    return true;
                }
            }),
        body('author')
            .exists()
            .notEmpty()
            .withMessage('Author is required.')
            .bail()
            .isString()
            .withMessage('Author must be a string')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Author name is too long')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('category')
            .exists()
            .notEmpty()
            .withMessage('Category is required.')
            .bail()
            .isString()
            .withMessage('Category must be a string')
            .bail()
            .isLength({ min: 3, max: 50 })
            .withMessage('Category length must be between 3 to 50')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('publishedAt')
            .not()
            .equals('')
            .withMessage('Published At cannot be empty')
            .bail()
            .isDate()
            .withMessage('Published at must be of type Date')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Date is too long'),
        body('isbn')
            .exists()
            .not()
            .equals()
            .withMessage('ISBN number cannot be empty')
            .bail()
            .isISBN()
            .withMessage('Invalid ISBN number')
            .bail()
            .isLength({ max: 40 })
            .withMessage('ISBN number is too long'),
    ],

    updateBook: [
        param('bookId')
            .exists()
            .withMessage('Please provide book id')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('title')
            .optional()
            .isString()
            .withMessage('Title must be a string')
            .bail()
            .isLength({ min: 3, max: 50 })
            .withMessage('Title length must be between 3 to 50')
            .bail()
            .custom((value) => typeof value === 'string' && value.trim() !== '')
            .withMessage('Title is required.')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('description')
            .optional()
            .isString()
            .withMessage('Description must be a string')
            .bail()
            .isLength({ min: 15, max: 200 })
            .withMessage('Title length must be between 15 to 200')
            .bail()
            .custom((value) => typeof value === 'string' && value.trim() !== '')
            .withMessage('Description is required.')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('price')
            .optional()
            .isFloat({ min: 10, max: 10000 })
            .withMessage('Price must be a valid number between 0 and 100.')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Price must be a number');
                } else {
                    return true;
                }
            }),
        body('rating')
            .optional()
            .isFloat({ min: 1, max: 5 })
            .withMessage('Rating must be a valid number between 1 and 5.')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Rating must be a number');
                } else {
                    return true;
                }
            }),
        body('stock')
            .optional()
            .isFloat({ min: 10, max: 500 })
            .withMessage('Stock must be a valid number between 10 and 500.')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Stock must be a number');
                } else {
                    return true;
                }
            }),
        body('author')
            .optional()
            .isString()
            .withMessage('Author must be a string')
            .bail()
            .custom((value) => typeof value === 'string' && value.trim() !== '')
            .withMessage('Author is required.')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Author name is too long')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('category')
            .optional()
            .optional()
            .isString()
            .withMessage('Category must be a string')
            .bail()
            .custom((value) => typeof value === 'string' && value.trim() !== '')
            .withMessage('Category is required.')
            .bail()
            .isLength({ min: 3, max: 50 })
            .withMessage('Category length must be between 3 to 50')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('publishedAt')
            .optional()
            .isDate()
            .withMessage('Invalid published At date provided')
            .custom((value) => value.trim() !== '')
            .withMessage('publishedAt is required.')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Date is too long'),
        body('isbn')
            .optional()
            .isISBN()
            .withMessage('Invalid ISBN provided')
            .bail()
            .custom((value) => value.trim() !== '')
            .withMessage('ISBN is required.')
            .bail()
            .isLength({ max: 40 })
            .withMessage('ISBN number is too long'),
    ],

    signUpUser: [
        body('name')
            .exists()
            .not()
            .equals('')
            .withMessage('Name is required')
            .bail()
            .isString()
            .withMessage('Name Must be a string')
            .bail()
            .isLength({ max: 50 })
            .withMessage('Name cannot be greater than 50')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('email')
            .exists()
            .not()
            .equals('')
            .withMessage('Email is required')
            .bail()
            .isString()
            .withMessage('Email Must be a string')
            .bail()
            .isEmail()
            .withMessage('Invalid email address')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Email is too long'),
        body('password')
            .exists()
            .not()
            .equals('')
            .withMessage('Password is required')
            .bail()
            .isString()
            .withMessage('Password Must be a string')
            .bail()
            .isStrongPassword({
                minLength: 8,
                minLowerCase: 1,
                minUpperCase: 1,
                minSymbols: 1,
                minNumbers: 1,
            })
            .withMessage(
                'Password must be at least 8 characters with a lowercase ,a uppercase,a number and a special character'
            ),
        body('confirmPassword')
            .exists()
            .not()
            .equals('')
            .withMessage('Password is required')
            .bail()
            .isString()
            .withMessage('Confirm password Must be a string')
            .bail()
            .isStrongPassword({
                minLength: 8,
                minLowerCase: 1,
                minUpperCase: 1,
                minSymbols: 1,
                minNumbers: 1,
            })
            .withMessage(
                'Password must be at least 8 characters with a lowercase ,a uppercase,a number and a special character'
            ),

        body('phoneNumber')
            .exists()
            .not()
            .equals('')
            .withMessage('PhoneNumber is required')
            .bail()
            .isNumeric()
            .withMessage('PhoneNumber must be a number')
            .bail()
            .custom((data) => {
                if (PHONE_REGEX.test(data)) {
                    return true;
                } else {
                    throw new Error('This is not a valid phone number');
                }
            }),
        body('address.country')
            .exists()
            .not()
            .equals('')
            .withMessage('Country is required')
            .bail()
            .isString()
            .withMessage('Country must be a string')
            .bail()
            .isLength({ max: 20 })
            .withMessage('Country cannot be greater than 20')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('address.city')
            .exists()
            .not()
            .equals('')
            .withMessage('City is required')
            .bail()
            .isString()
            .withMessage('City must be a string')
            .bail()
            .isLength({ max: 20 })
            .withMessage('City cannot be greater than 20')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('address.area')
            .exists()
            .not()
            .equals('')
            .withMessage('Area is required')
            .bail()
            .isString()
            .withMessage('Area must be a string')
            .bail()
            .isLength({ max: 20 })
            .withMessage('Area cannot be greater than 20')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('address.street')
            .exists()
            .not()
            .equals('')
            .withMessage('Street is required')
            .bail()
            .isString()
            .withMessage('Street must be a string')
            .bail()
            .isLength({ max: 20 })
            .withMessage('Street cannot be greater than 20')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
    ],

    loginUser: [
        body('email')
            .not()
            .equals('')
            .withMessage('Email is required')
            .bail()
            .isString()
            .withMessage('Email Must be a string')
            .bail()
            .isEmail()
            .withMessage('Invalid email address')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Email is too long'),
        body('password')
            .not()
            .equals('')
            .withMessage('Password is required')
            .bail()
            .isString()
            .withMessage('Password Must be a string')
            .bail()
            .isStrongPassword({
                minLength: 8,
                minLowerCase: 1,
                minUpperCase: 1,
                minSymbols: 1,
                minNumbers: 1,
            })
            .withMessage(
                'Password must be at least 8 characters with a lowercase ,a uppercase,a number and a special character'
            ),
    ],

    verifyAccount: [
        body('email')
            .exists()
            .not()
            .equals('')
            .withMessage('Email is required')
            .bail()
            .isString()
            .withMessage('Email Must be of type string')
            .bail()
            .isEmail()
            .withMessage('Invalid email address')
            .bail()
            .isLength({ max: 40 })
            .withMessage('Date is too long'),
        body('verificationCode')
            .exists()
            .withMessage('Verification code is required')
            .bail()
            .isNumeric()
            .withMessage('Verification code must contain only number')
            .bail()
            .isLength({ max: 6 })
            .withMessage('Verification code is too long')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Verification code must be a number');
                } else {
                    return true;
                }
            }),
    ],

    addBalance: [
        body('amount')
            .exists()
            .withMessage('Amount is required')
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Amount must be a number');
                }
                if (value <= 0 || isNaN(value) || value > 30000) {
                    throw new Error(
                        'Amount must be a positive number less than 30000'
                    );
                } else {
                    return true;
                }
            }),
    ],

    deleteBook: [
        param('bookId')
            .exists()
            .withMessage('Please provide book id')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
    ],

    deleteUser: [
        param('userId')
            .exists()
            .withMessage('Please provide user id')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
    ],

    updateUser: [
        param('userId')
            .exists()
            .withMessage('Please provide user id')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided')
            .bail(),
        body('name')
            .optional()
            .isString()
            .withMessage('Name only be a string')
            .bail()
            .custom((value) => {
                if (value.trim() === '') {
                    throw new Error('Name is required');
                } else {
                    return true;
                }
            })
            .bail()
            .isLength({ max: 50 })
            .withMessage('Name cannot be greater than 50')
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('rank')
            .optional()
            .custom((value) => {
                if (value > 2) {
                    throw new Error('Invalid rank provided');
                } else if (!value) {
                    throw new Error('Rank can not be empty');
                } else if (typeof value != 'number') {
                    throw new Error('Rank must be a number');
                } else {
                    return true;
                }
            }),
        body('isVerified')
            .optional()
            .custom((value) => {
                if (typeof value === 'boolean') {
                    return true;
                } else {
                    throw new Error('Invalid value provided');
                }
            }),
    ],

    addBookReview: [
        param('bookId')
            .exists()
            .not()
            .equals('')
            .withMessage('book id cannot be empty')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('message')
            .optional()
            .not()
            .equals('')
            .withMessage('Message  cannot be empty')
            .bail()
            .isLength({ min: 5, max: 200 })
            .withMessage('Review message must be between 5 to 200 words')
            .bail()
            .custom((value) => {
                if (typeof value != 'string') {
                    throw new Error('Review message must be a string');
                } else {
                    return true;
                }
            })
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
        body('rating')
            .exists()
            .withMessage('Rating can not be null')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Rating must be a number');
                }
                if (!isNaN(value)) {
                    if (value >= 1 && value <= 5) return true;
                    throw new Error('Rating must be between 1 and 5');
                } else {
                    throw new Error('Rating only accepts numeric values');
                }
            }),
    ],

    updateBookReview: [
        param('bookId')
            .optional()
            .not()
            .equals('')
            .withMessage('book id cannot be empty')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('rating')
            .exists()
            .withMessage('Rating can not be null')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Rating must be a number');
                }
                if (!isNaN(value)) {
                    if (value >= 1 && value <= 5) return true;
                    throw new Error('Rating must be between 1 and 5');
                } else {
                    throw new Error('Rating only accepts numeric values');
                }
            }),
        body('message')
            .optional()
            .not()
            .equals('')
            .withMessage('Message  cannot be empty')
            .bail()
            .isLength({ min: 5, max: 200 })
            .withMessage('Review message must be between 5 to 200 words')
            .bail()
            .custom((value) => {
                if (typeof value != 'string') {
                    throw new Error('Review message must be a string');
                } else {
                    return true;
                }
            })
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
    ],

    deleteBookReview: [
        param('bookId')
            .optional()
            .not()
            .equals('')
            .withMessage('book id cannot be empty')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
    ],

    addDiscount: [
        body('discountPercentage')
            .exists()
            .withMessage('Discount Percentage is required')
            .bail()
            .isNumeric()
            .withMessage('Discount Percentage can only be of type number')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Discount Percentage must be a number');
                }
                if (value < 5) {
                    throw new Error(
                        'Discount Percentage can not be less than 5'
                    );
                }
                if (value > 40) {
                    throw new Error(
                        'Discount Percentage can not be greater than 40'
                    );
                } else {
                    return true;
                }
            }),
        body('bookId')
            .exists()
            .withMessage('Book ID is required')
            .bail()
            .custom((value) => {
                const allBookIdAvailable = value.every(
                    (ele) => ele.trim() != ''
                );
                const allBookIdType = value.every((ele) =>
                    mongoose.Types.ObjectId.isValid(ele)
                );
                if (!value.length) {
                    throw new Error('Book ID is required');
                }
                if (!allBookIdAvailable) {
                    throw new Error('Book ID is required');
                }
                if (allBookIdType) {
                    return true;
                } else {
                    throw new Error('Invalid Book id');
                }
            }),
        body('startDate')
            .exists()
            .withMessage('Start Date is required')
            .bail()
            .isISO8601()
            .withMessage('Start date can only be of type of date')
            .custom((value) => {
                if (value.trim() === '') {
                    throw new Error('Start date is required');
                } else {
                    return true;
                }
            }),
        body('endDate')
            .exists()
            .withMessage('End Date is required')
            .bail()
            .isISO8601()
            .withMessage('End date can only be of type of date')
            .custom((value) => {
                if (value.trim() === '') {
                    throw new Error('End date is required');
                } else {
                    return true;
                }
            }),
        body('country')
            .exists()
            .withMessage('County is required')
            .bail()
            .custom((value) => {
                const allCountryType = value.every(
                    (ele) => typeof ele === 'string'
                );
                let allCountyAvailable;
                if (allCountryType) {
                    allCountyAvailable = value.every(
                        (ele) => ele?.trim() != ''
                    );
                }
                if (!value.length) {
                    throw new Error('Country is required');
                }
                if (!allCountyAvailable) {
                    throw new Error('Country is required');
                } else if (!allCountryType) {
                    throw new Error('Country type must be string');
                } else {
                    return true;
                }
            }),
    ],

    updateDiscount: [
        param('discountId')
            .exists()
            .withMessage('Discount id is required')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('discountPercentage')
            .optional()
            .isNumeric()
            .withMessage('Discount Percentage can only be of type number')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Discount Percentage must be a number');
                }
                if (value < 5) {
                    throw new Error(
                        'Discount Percentage can not be less than 5'
                    );
                }
                if (value > 40) {
                    throw new Error(
                        'Discount Percentage can not be greater than 40'
                    );
                } else {
                    return true;
                }
            }),
        body('bookId')
            .optional()
            .custom((value) => {
                const allBookIdAvailable = value.every(
                    (ele) => ele.trim() != ''
                );
                const allBookIdType = value.every((ele) =>
                    mongoose.Types.ObjectId.isValid(ele)
                );
                if (!value.length) {
                    throw new Error('Book ID is required');
                }
                if (!allBookIdAvailable) {
                    throw new Error('Book ID is required');
                }
                if (allBookIdType) {
                    return true;
                } else {
                    throw new Error('Invalid Book id');
                }
            }),
        body('startDate')
            .optional()
            .isISO8601()
            .withMessage('Start date can only be of type of date')
            .custom((value) => {
                if (value.trim() === '') {
                    throw new Error('Start date is required');
                } else {
                    return true;
                }
            }),
        body('endDate')
            .optional()
            .isISO8601()
            .withMessage('End date can only be of type of date')
            .custom((value) => {
                if (value.trim() === '') {
                    throw new Error('End date is required');
                } else {
                    return true;
                }
            }),
        body('country')
            .optional()
            .custom((value) => {
                const allCountryType = value.every(
                    (ele) => typeof ele === 'string'
                );
                let allCountyAvailable;
                if (allCountryType) {
                    allCountyAvailable = value.every(
                        (ele) => ele?.trim() != ''
                    );
                }
                if (!value.length) {
                    throw new Error('Country is required');
                }
                if (!allCountyAvailable) {
                    throw new Error('Country is required');
                } else if (!allCountryType) {
                    throw new Error('Country type must be string');
                } else {
                    return true;
                }
            }),
    ],

    deleteDiscount: [
        param('discountId')
            .exists()
            .withMessage('Discount id is required')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('bookId')
            .optional()
            .custom((value) => {
                const allBookIdAvailable = value.every(
                    (ele) => ele.trim() != ''
                );
                const allBookIdType = value.every((ele) =>
                    mongoose.Types.ObjectId.isValid(ele)
                );
                if (!value.length) {
                    throw new Error('Book ID is required');
                }
                if (!allBookIdAvailable) {
                    throw new Error('Book ID is required');
                }
                if (allBookIdType) {
                    return true;
                } else {
                    throw new Error('Invalid Book id');
                }
            }),
    ],

    addToCart: [
        body('book')
            .exists()
            .withMessage('Book id is required')
            .bail()
            .not()
            .equals('')
            .withMessage('Book id is required')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('quantity')
            .exists()
            .withMessage('Quantity is required')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Quantity must be a number');
                }
                if (value <= 0) {
                    throw new Error('Quantity can not be less than 1');
                } else if (value > 10000000) {
                    throw new Error(
                        'Quantity can not be greater than 10000000'
                    );
                } else {
                    return true;
                }
            }),
    ],

    updateCart: [
        body('book')
            .exists()
            .withMessage('Book id is required')
            .bail()
            .not()
            .equals('')
            .withMessage('Book id is required')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided')
            .bail(),
        body('quantity')
            .exists()
            .withMessage('Quantity is required')
            .bail()
            .custom((value) => {
                if (typeof value != 'number') {
                    throw new Error('Quantity must be a number');
                }
                if (value <= 0) {
                    throw new Error('Quantity can not be less than 1');
                } else if (value > 10000000) {
                    throw new Error(
                        'Quantity can not be greater than 10000000'
                    );
                } else {
                    return true;
                }
            }),
    ],

    createTransaction: [
        body('cart')
            .exists()
            .withMessage('Cart id is required')
            .bail()
            .not()
            .equals('')
            .withMessage('Cart id is required')
            .bail()
            .isMongoId()
            .withMessage('Invalid object id provided'),
        body('paymentMethod')
            .exists()
            .withMessage('Payment method is required')
            .bail()
            .not()
            .equals('')
            .withMessage('Payment method is required')
            .custom((value) => {
                const allowedPaymentMethods = ['online', 'cash', 'card'];
                if (typeof value != 'string') {
                    throw new Error('Payment method must be a string');
                }
                if (!allowedPaymentMethods.includes(value)) {
                    throw new Error('Invalid payment method provided');
                } else if (value.length > 20) {
                    throw new Error(
                        'Payment method length can not be greater than 20'
                    );
                } else {
                    return true;
                }
            })
            .bail()
            .custom(containsSpecialCharacters)
            .withMessage('Invalid value provided'),
    ],
};

module.exports = validator;
