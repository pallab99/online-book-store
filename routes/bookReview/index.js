const express = require('express');
const BookReviewController = require('../../controllers/bookReview');
const validator = require('../../middlewares/validator');
const {
    tokenAuthorization,
    isUser,
} = require('../../middlewares/tokenValidator');

const router = express.Router();

router
    .get('/details/:bookId', BookReviewController.getReviewByBook)
    .post(
        '/create/:bookId',
        [tokenAuthorization, isUser, validator.addBookReview],
        BookReviewController.createReview
    )
    .patch(
        '/update/:bookId',
        [tokenAuthorization, isUser, validator.updateBookReview],
        BookReviewController.updateReview
    )
    .delete(
        '/delete/:bookId',
        [tokenAuthorization, isUser, validator.deleteBookReview],
        BookReviewController.deleteReview
    );

module.exports = router;
