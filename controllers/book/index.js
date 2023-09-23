const HTTP_STATUS = require('../../constants/statusCode');
const bookModel = require('../../models/book');
const { sendResponse } = require('../../util/response');
const mongoose = require('mongoose');
const { validationResult } = require('express-validator');
const databaseLogger = require('../../util/dbLogger');
const { sendValidationError } = require('../../util/validationErrorHelper');
const DiscountPrice = require('../../models/discountPrice');

class BookController {
    async getAllBooks(req, res) {
        try {
            databaseLogger(req.originalUrl);

            let page = parseInt(req.query.offset);
            let limit = parseInt(req.query.limit);

            let {
                search,
                sortBy,
                sortOrder,
                filter,
                filterOrder,
                filterValue,
                category,
            } = req.query;

            const allowedProperties = [
                'offset',
                'limit',
                'search',
                'sortBy',
                'sortOrder',
                'filter',
                'filterOrder',
                'filterValue',
                'category',
                'category',
            ];

            for (const key in req.query) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided book filtering '
                    );
                }
            }

            let baseQuery = bookModel.find().select('-reviews');
            if (!search && !sortBy && !filter && !category) {
                const skip = (page - 1) * limit;

                const data = await bookModel
                    .find({})
                    .skip(skip)
                    .limit(limit)
                    .select('-reviews');
                let totalCount = await bookModel.countDocuments();
                if (!page && !limit) {
                    page = 1;
                    limit = 30;
                    totalCount = totalCount;
                } else {
                    totalCount = await bookModel.countDocuments();
                }
                let totalPages = Math.ceil(totalCount / limit);
                const result = {
                    currentPage: page,
                    totalPages: totalPages,
                    totalData: totalCount,
                    products: data,
                };
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'Successfully get the books',
                    result
                );
            }
            if (search && search?.length) {
                baseQuery = baseQuery.or([
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ]);
            }
            if (sortBy && sortBy?.length) {
                const sortField = sortBy;
                const sortDirection = sortOrder === 'desc' ? -1 : 1;
                baseQuery = baseQuery.sort({ [sortField]: sortDirection });
            }

            if (filter && filter?.length) {
                const filterField = filter;
                const filterObj = {};
                filterValue = parseInt(filterValue);
                if (filterOrder === 'high') {
                    filterObj[filterField] = { $gte: filterValue };
                } else {
                    filterObj[filterField] = { $lte: filterValue };
                }
                baseQuery = baseQuery.find(filterObj);
            }
            if (category && category?.length) {
                const categoryArray = category.split(',');
                baseQuery = baseQuery.or([
                    { category: { $in: categoryArray } },
                ]);
            }

            const skip = (page - 1) * limit;
            const data = await baseQuery.skip(skip).limit(limit);

            if (data.length > 0) {
                const totalCount = data.length;
                const totalPages = Math.ceil(totalCount / limit);

                const result = {
                    currentPage: page,
                    totalPages: totalPages,
                    totalData: totalCount,
                    products: data,
                };
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'Successfully get the books',
                    result
                );
            } else {
                return sendResponse(res, HTTP_STATUS.OK, 'No data found', []);
            }
        } catch (error) {
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal Server Error'
            );
        }
    }

    async getBookById(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const { bookId } = req.params;
            if (!mongoose.Types.ObjectId.isValid(bookId)) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Invalid objectId provided'
                );
            }
            const discountPrice = await DiscountPrice.findOne({
                $and: [
                    { bookIds: { $eq: bookId } },
                    { startDate: { $lte: new Date() } },
                    { endDate: { $gte: new Date() } },
                ],
            });
            const result = await bookModel
                .findById(bookId)
                .populate('reviews', '-__v');
            let data = { result };
            if (discountPrice) {
                const discountAmount =
                    (result.price * discountPrice.discountPercentage) / 100;
                const discountedPrice = result.price - discountAmount;
                data.discountPrice = discountedPrice.toFixed(2);
            }
            if (result) {
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'Successfully get all the data',
                    data
                );
            }
            return sendResponse(res, HTTP_STATUS.OK, 'No data found');
        } catch (error) {
            console.log(error);
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal Server Error'
            );
        }
    }

    async createBook(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const {
                title,
                description,
                author,
                price,
                rating,
                stock,
                category,
                publishedAt,
                isbn,
            } = req.body;

            const allowedProperties = [
                'title',
                'description',
                'author',
                'price',
                'rating',
                'stock',
                'category',
                'publishedAt',
                'isbn',
            ];

            for (const key in req.body) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided for book create'
                    );
                }
            }

            const existingBook = await bookModel.findOne({
                $or: [
                    { title: title },
                    { description: description },
                    { isbn: isbn },
                ],
            });
            if (existingBook) {
                if (existingBook.title === title) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Book with the same title already exists'
                    );
                } else if (existingBook.description === description) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Book with the same description already exists'
                    );
                } else if (existingBook.isbn === isbn) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Book with the same ISBN already exists'
                    );
                }
            }
            const result = await bookModel.create({
                title,
                description,
                author,
                price,
                rating,
                stock,
                category,
                isbn,
                publishedAt,
            });
            if (result) {
                return sendResponse(
                    res,
                    201,
                    'Successfully added a new book',
                    result
                );
            } else {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Cannot add a new book'
                );
            }
        } catch (error) {
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }

    async updateBook(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }

            const {
                title,
                description,
                author,
                price,
                rating,
                stock,
                category,
                publishedAt,
                isbn,
            } = req.body;

            const allowedProperties = [
                'title',
                'description',
                'author',
                'price',
                'rating',
                'stock',
                'category',
                'publishedAt',
                'isbn',
            ];

            for (const key in req.body) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided for book create'
                    );
                }
            }

            const { bookId } = req.params;

            const result = await bookModel.findById(bookId);
            if (!result) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'No book found associated with this id'
                );
            }
            if (
                !title &&
                !description &&
                !author &&
                !price &&
                !rating &&
                !stock &&
                !category &&
                !publishedAt &&
                !isbn
            ) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Can not update the book with an empty data'
                );
            }
            const duplicateBook = await bookModel.findOne({
                $or: [{ title }, { description }, { isbn }],
            });

            if (duplicateBook && String(duplicateBook._id) !== String(bookId)) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Another book already has the same title, description, or isbn'
                );
            }

            const updatedBook = await bookModel.findByIdAndUpdate(
                bookId,
                {
                    title,
                    description,
                    author,
                    price,
                    rating,
                    stock,
                    category,
                    publishedAt,
                },
                { new: true }
            );
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Book updated successfully',
                updatedBook
            );
        } catch (error) {
            databaseLogger(error.message);
            return sendResponse(res, 500, 'Internal server error');
        }
    }

    async deleteBook(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }

            const { bookId } = req.params;
            const result = await bookModel.findByIdAndDelete(bookId);
            if (!result) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'No book associated with this id'
                );
            }
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Deleted book successfully',
                result
            );
        } catch (error) {
            databaseLogger(error.message);
            return sendResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = new BookController();
