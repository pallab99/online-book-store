const express = require('express');
const router = express.Router();

const bookRoutes = require('./book');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const bookReviewRoutes = require('./bookReview');
const discountPriceRoutes = require('./discountPrice');
const cartRoutes = require('./cart');
const transactionRoutes = require('./transaction');
router.use('/books', bookRoutes);
router.use('/auth', authRoutes);
router.use('/user', userRoutes);
router.use('/review', bookReviewRoutes);
router.use('/discount-price', discountPriceRoutes);
router.use('/cart', cartRoutes);
router.use('/transaction', transactionRoutes);
module.exports = router;
