const { validationResult } = require('express-validator');
const HTTP_STATUS = require('../../constants/statusCode');
const databaseLogger = require('../../util/dbLogger');
const { sendResponse } = require('../../util/response');
const bookReviewModel = require('../../models/bookReview');
const bookModel = require('../../models/book');
const authModel = require('../../models/auth');
const userModel = require('../../models/user');
const { sendValidationError } = require('../../util/validationErrorHelper');
const mongoose = require('mongoose');
const calculateAverageRating = async (req) => {
    const { bookId } = req.params;
    const avgRatingPipeline = await bookReviewModel.aggregate([
        { $match: { book: new mongoose.Types.ObjectId(bookId) } },
        { $unwind: '$reviews' },
        {
            $group: {
                _id: '$book',
                averageRating: {
                    $avg: '$reviews.rating',
                },
            },
        },
        {
            $project: {
                _id: 0,
                averageRating: 1,
            },
        },
    ]);
    return avgRatingPipeline[0].averageRating;
};
class BookReviewController {
    async getReviewByBook(req, res) {
        try {
            databaseLogger(req.originalUrl);

            const { bookId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(bookId)) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Invalid object id provided'
                );
            }
            const result = await bookReviewModel
                .findOne({ book: bookId })
                .populate('book', 'title author publishedAt price description')
                .populate('reviews.user', 'name email -_id');

            if (!result) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No reviews found',
                    []
                );
            }
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Successfully get all the reviews',
                result
            );
        } catch (error) {
            console.log(error);
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }
    async createReview(req, res) {
        try {
            databaseLogger(req.originalUrl);

            const { message, rating } = req.body;
            const { bookId } = req.params;
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }

            const allowedProperties = ['book', 'message', 'rating'];

            for (const key in req.body) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided for book create'
                    );
                }
            }
            const bookFound = await bookModel.findById(bookId);
            const userFoundInAuth = await authModel.findById(req.user._id);
            const userFoundInUser = await userModel.findById(
                userFoundInAuth.user
            );
            if (!userFoundInAuth || !userFoundInUser) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user found'
                );
            }
            if (!bookFound) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No book found'
                );
            }
            const bookExistInReview = await bookReviewModel.findOne({
                book: String(bookId),
            });
            if (!bookExistInReview) {
                const result = await bookReviewModel.create({
                    book: bookId,
                });

                result.reviews.push({
                    user: userFoundInUser,
                    message: message || '',
                    rating: rating,
                });

                await result.save();

                bookFound.reviews.push(result._id);

                bookFound.rating = await calculateAverageRating(req);
                await bookFound.save();

                let reviews = {
                    user: userFoundInUser._id,
                    message,
                    rating,
                };

                if (result) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.CREATED,
                        'Review added successfully',
                        reviews
                    );
                }
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Something went wrong'
                );
            } else {
                const userRatingExist = bookExistInReview.reviews.findIndex(
                    (ele) => {
                        return String(ele.user) === String(userFoundInUser._id);
                    }
                );

                if (userRatingExist != -1) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'You can not add more than one review'
                    );
                }

                bookExistInReview.reviews.push({
                    user: userFoundInUser,
                    message: message || '',
                    rating: rating,
                });

                await bookExistInReview.save();

                bookFound.rating = await calculateAverageRating(req);
                await bookFound.save();
                const reviews = {
                    user: userFoundInAuth._id,
                    message,
                    rating,
                };
                if (bookExistInReview) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.CREATED,
                        'Review added successfully',
                        reviews
                    );
                }
            }
        } catch (error) {
            console.log(error);
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }

    async updateReview(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const { message, rating } = req.body;
            const { bookId } = req.params;
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }

            const allowedProperties = ['message', 'rating'];

            for (const key in req.body) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided for book create'
                    );
                }
            }

            const bookFound = await bookModel.findById(bookId);
            const userFoundInAuth = await authModel.findById(req.user._id);
            const userFoundInUser = await userModel.findById(
                userFoundInAuth.user
            );
            if (!userFoundInAuth || !userFoundInUser) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user found'
                );
            }
            if (!bookFound) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No book found'
                );
            }

            const bookExistInReview = await bookReviewModel.findOne({
                book: bookId,
            });

            if (!bookExistInReview) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Invalid book id for review'
                );
            }
            const userIdInReviews = bookExistInReview.reviews.findIndex(
                (ele) => {
                    return String(ele.user) === String(userFoundInUser._id);
                }
            );
            if (userIdInReviews === -1) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Invalid user id for update review'
                );
            }

            if (message) {
                bookExistInReview.reviews[userIdInReviews].message = message;
                await bookExistInReview.save();
            }
            if (rating) {
                bookExistInReview.reviews[userIdInReviews].rating = rating;
                await bookExistInReview.save();
                bookFound.rating = await calculateAverageRating(req);
                await bookFound.save();
            }
            const reviews = {
                user: userFoundInAuth._id,
                message,
                rating,
            };
            return sendResponse(
                res,
                HTTP_STATUS.ACCEPTED,
                'Successfully updated the review',
                reviews
            );
        } catch (error) {
            console.log(error);
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }

    async deleteReview(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const { bookId } = req.params;
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }

            const bookFound = await bookModel.findById(bookId);
            const userFoundInAuth = await authModel.findById(req.user._id);
            const userFoundInUser = await userModel.findById(
                userFoundInAuth.user
            );
            const bookExistInReview = await bookReviewModel.findOne({
                book: String(bookId),
            });

            if (!bookExistInReview) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Invalid book id for delete review'
                );
            }
            if (!userFoundInAuth || !userFoundInUser) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user found'
                );
            }
            if (!bookFound) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No book found'
                );
            }

            const userIdInReviews = bookExistInReview.reviews.findIndex(
                (ele) => {
                    return String(ele.user) === String(userFoundInUser._id);
                }
            );

            if (userIdInReviews === -1) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Invalid user id for delete review'
                );
            }
            bookExistInReview.reviews.splice(userIdInReviews, 1);
            await bookExistInReview.save();
            if (!bookExistInReview.reviews.length) {
                await bookModel.findOneAndUpdate(
                    { _id: bookId },
                    { $unset: { reviews: 1 } },
                    { new: true }
                );
                bookFound.rating = 1;
                await bookFound.save();
                await bookReviewModel.findByIdAndDelete(bookExistInReview._id);
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'Deleted review successfully'
                );
            }

            bookFound.rating = await calculateAverageRating(req);
            console.log('hhhh', bookFound);
            await bookFound.save();
            await bookExistInReview.save();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Deleted review successfully'
            );
        } catch (error) {
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }
}

module.exports = new BookReviewController();
