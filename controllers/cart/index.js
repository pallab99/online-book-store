const { validationResult, check } = require('express-validator');
const databaseLogger = require('../../util/dbLogger');
const { sendValidationError } = require('../../util/validationErrorHelper');
const userModel = require('../../models/user');
const { sendResponse } = require('../../util/response');
const HTTP_STATUS = require('../../constants/statusCode');
const bookModel = require('../../models/book');
const cartModel = require('../../models/cart');
const DiscountPrice = require('../../models/discountPrice');
const mongoose = require('mongoose');
const calculateTotalPrice = require('../../util/totalPrice');
const calculateTotalPriceWithOutDiscount = require('../../util/actualTotalPrice');
class CartController {
    async getCartByUser(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const { email } = req.user;
            const userExists = await userModel.findOne({ email });

            if (!userExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user Found'
                );
            }
            const cartExists = await cartModel.findOne({
                user: userExists._id,
            });
            if (!cartExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No cart exists for this user'
                );
            }
            const cartExistsForUser = await cartModel
                .findOne({
                    user: userExists._id,
                })
                .populate(
                    'user',
                    '-address -balance -phoneNumber -createdAt -updatedAt -__v'
                )
                .populate(
                    'books.book',
                    'title description price rating category'
                );
            if (cartExistsForUser.books.length <= 0) {
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'No items available in the cart',
                    []
                );
            }
            const bookIds = cartExistsForUser.books.map(
                (ele) => new mongoose.Types.ObjectId(ele.book)
            );
            const userCountry = userExists.address.country;
            const query = {
                $and: [
                    { startDate: { $lte: new Date() } },
                    { endDate: { $gte: new Date() } },
                    { bookIds: { $in: bookIds } },
                    { counties: userCountry },
                ],
            };
            const discountPrice = await DiscountPrice.find(query);
            console.log(discountPrice);
            const allBooks = await bookModel
                .find({
                    _id: { $in: bookIds },
                })
                .sort({ _id: 1 });

            bookIds.sort();

            let totalPrice = 0;
            let actualPrice = 0;
            cartExistsForUser.books.forEach((item, index) => {
                const bookId = item.book;
                const quantity = item.quantity;
                const book = allBooks[index];
                totalPrice += calculateTotalPrice(
                    book,
                    discountPrice,
                    bookId,
                    quantity
                );
                actualPrice += calculateTotalPriceWithOutDiscount(
                    book,
                    quantity
                );
            });

            if (!cartExistsForUser) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No data found',
                    []
                );
            }

            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Successfully get the data',
                {
                    cartExistsForUser,
                    beforeDiscount: actualPrice.toFixed(2),
                    afterDiscount: totalPrice.toFixed(2),
                }
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
    async addToCart(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();

            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const { email } = req.user;
            const { book, quantity } = req.body;
            if (!req.body) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'Can not process empty data'
                );
            }
            const userExists = await userModel.findOne({ email });
            const bookExists = await bookModel.findById(book);

            if (!userExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user Found'
                );
            }
            if (!bookExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No book Found'
                );
            }
            const cartExistsForUser = await cartModel.findOne({
                user: userExists._id,
            });
            if (!cartExistsForUser) {
                if (quantity > bookExists.stock) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'The given quantity exceed the book stock'
                    );
                }

                const saveToCart = await cartModel.create({
                    user: userExists._id,
                });
                saveToCart.books.push({ book, quantity });
                await saveToCart.save();

                if (!saveToCart) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.BAD_REQUEST,
                        'Something went wrong'
                    );
                }
                const bookIds = saveToCart.books.map(
                    (ele) => new mongoose.Types.ObjectId(ele.book)
                );
                const userCountry = userExists.address.country;

                const query = {
                    $and: [
                        { startDate: { $lte: new Date() } },
                        { endDate: { $gte: new Date() } },
                        { bookIds: { $in: bookIds } },
                        { counties: userCountry },
                    ],
                };
                const discountPrice = await DiscountPrice.find(query);
                console.log('add to cart', discountPrice);
                const allBooks = await bookModel
                    .find({
                        _id: { $in: bookIds },
                    })
                    .sort({ _id: 1 });

                bookIds.sort();

                let totalPrice = 0;
                let actualPrice = 0;
                saveToCart.books.forEach((item, index) => {
                    const bookId = item.book;
                    const quantity = item.quantity;
                    const book = allBooks[index];
                    totalPrice += calculateTotalPrice(
                        book,
                        discountPrice,
                        bookId,
                        quantity
                    );
                    actualPrice += calculateTotalPriceWithOutDiscount(
                        book,
                        quantity
                    );
                });
                const data = {
                    data: saveToCart,
                    beforeDiscount: actualPrice.toFixed(2),
                    afterDiscount: totalPrice.toFixed(2),
                };
                return sendResponse(
                    res,
                    HTTP_STATUS.CREATED,
                    'Added to new cart',
                    data
                );
            } else {
                const bookExistsInCart = cartExistsForUser.books.findIndex(
                    (ele) => String(ele.book) === book
                );
                if (bookExistsInCart != -1) {
                    if (
                        cartExistsForUser.books[bookExistsInCart].quantity +
                            quantity >
                        bookExists.stock
                    ) {
                        return sendResponse(
                            res,
                            HTTP_STATUS.UNPROCESSABLE_ENTITY,
                            'Not Enough stock'
                        );
                    }
                    cartExistsForUser.books[bookExistsInCart].quantity +=
                        quantity;
                    await cartExistsForUser.save();

                    const bookIds = cartExistsForUser.books.map(
                        (ele) => new mongoose.Types.ObjectId(ele.book)
                    );
                    console.log({ bookIds });
                    const userCountry = userExists.address.country;

                    const query = {
                        $and: [
                            { startDate: { $lte: new Date() } },
                            { endDate: { $gte: new Date() } },
                            { bookIds: { $in: bookIds } },
                            { counties: userCountry },
                        ],
                    };
                    const discountPrice = await DiscountPrice.find(query);
                    console.log('add to cart 262', discountPrice);
                    const allBooks = await bookModel
                        .find({
                            _id: { $in: bookIds },
                        })
                        .sort({ _id: 1 });

                    bookIds.sort();

                    let totalPrice = 0;
                    let actualPrice = 0;
                    cartExistsForUser.books.forEach((item, index) => {
                        const bookId = item.book;
                        const quantity = item.quantity;
                        const book = allBooks[index];
                        totalPrice += calculateTotalPrice(
                            book,
                            discountPrice,
                            bookId,
                            quantity
                        );
                        actualPrice += calculateTotalPriceWithOutDiscount(
                            book,
                            quantity
                        );
                    });
                    return sendResponse(
                        res,
                        HTTP_STATUS.ACCEPTED,
                        'Quantity updated in the existing cart',
                        {
                            cartExistsForUser,
                            beforeDiscount: actualPrice.toFixed(2),
                            afterDiscount: totalPrice.toFixed(2),
                        }
                    );
                }
                if (bookExists.stock < quantity) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Not enough stock'
                    );
                }

                cartExistsForUser.books.push({ book, quantity });
                await cartExistsForUser.save();
                const bookIds = cartExistsForUser.books.map(
                    (ele) => new mongoose.Types.ObjectId(ele.book)
                );
                console.log({ bookIds });
                const userCountry = userExists.address.country;

                const query = {
                    $and: [
                        { startDate: { $lte: new Date() } },
                        { endDate: { $gte: new Date() } },
                        { bookIds: { $in: bookIds } },
                        { counties: userCountry },
                    ],
                };
                const discountPrice = await DiscountPrice.find(query);
                console.log('add to cart 321', discountPrice);
                const allBooks = await bookModel
                    .find({
                        _id: { $in: bookIds },
                    })
                    .sort({ _id: 1 });

                bookIds.sort();

                let totalPrice = 0;
                let actualPrice = 0;
                cartExistsForUser.books.forEach((item, index) => {
                    const bookId = item.book;
                    const quantity = item.quantity;
                    const book = allBooks[index];
                    totalPrice += calculateTotalPrice(
                        book,
                        discountPrice,
                        bookId,
                        quantity
                    );
                    actualPrice += calculateTotalPriceWithOutDiscount(
                        book,
                        quantity
                    );
                });
                console.log('existing cart');
                return sendResponse(
                    res,
                    HTTP_STATUS.ACCEPTED,
                    'Added to existing cart',
                    {
                        cartExistsForUser,
                        beforeDiscount: actualPrice.toFixed(2),
                        afterDiscount: totalPrice.toFixed(2),
                    }
                );
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

    async updateCart(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();

            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const { email } = req.user;
            const { book, quantity } = req.body;
            console.log('body', req.body);
            const userExists = await userModel.findOne({ email });
            const bookExists = await bookModel.findById(book);

            if (!userExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user Found'
                );
            }
            if (!bookExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No book Found'
                );
            }
            const cartExistsForUser = await cartModel.findOne({
                user: userExists._id,
            });

            if (!cartExistsForUser) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No cart exist for this user'
                );
            }
            const bookExistsInCart = cartExistsForUser.books.findIndex(
                (ele) => {
                    console.log(String(ele.book), book);
                    return String(ele.book) === book;
                }
            );
            if (bookExistsInCart === -1) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'This book do not exist in the cart'
                );
            }
            if (quantity > cartExistsForUser.books[bookExistsInCart].quantity) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    'The provided quantity exceed the quantity available in the cart'
                );
            }
            if (quantity < cartExistsForUser.books[bookExistsInCart].quantity) {
                cartExistsForUser.books[bookExistsInCart].quantity -= quantity;
                await cartExistsForUser.save();
                const bookIds = cartExistsForUser.books.map(
                    (ele) => new mongoose.Types.ObjectId(ele.book)
                );
                const userCountry = userExists.address.country;

                const query = {
                    $and: [
                        { startDate: { $lte: new Date() } },
                        { endDate: { $gte: new Date() } },
                        { bookIds: { $in: bookIds } },
                        { counties: userCountry },
                    ],
                };
                const discountPrice = await DiscountPrice.find(query);
                console.log('update cart 442', discountPrice);
                const allBooks = await bookModel
                    .find({
                        _id: { $in: bookIds },
                    })
                    .sort({ _id: 1 });

                bookIds.sort();

                let totalPrice = 0;
                let actualPrice = 0;
                cartExistsForUser.books.forEach((item, index) => {
                    const bookId = item.book;
                    const quantity = item.quantity;
                    const book = allBooks[index];
                    totalPrice += calculateTotalPrice(
                        book,
                        discountPrice,
                        bookId,
                        quantity
                    );
                    actualPrice += calculateTotalPriceWithOutDiscount(
                        book,
                        quantity
                    );
                });
                if (cartExistsForUser.books.length <= 0) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.OK,
                        'All items removed from the cart'
                    );
                }
                return sendResponse(
                    res,
                    HTTP_STATUS.ACCEPTED,
                    'Book quantity reduced from the cart',
                    {
                        cartExistsForUser,
                        beforeDiscount: actualPrice.toFixed(2),
                        afterDiscount: totalPrice.toFixed(2),
                    }
                );
            }
            if (
                quantity === cartExistsForUser.books[bookExistsInCart].quantity
            ) {
                cartExistsForUser.books.splice(bookExistsInCart);
                await cartExistsForUser.save();
                const bookIds = cartExistsForUser.books.map(
                    (ele) => new mongoose.Types.ObjectId(ele.book)
                );
                const userCountry = userExists.address.country;

                const query = {
                    $and: [
                        { startDate: { $lte: new Date() } },
                        { endDate: { $gte: new Date() } },
                        { bookIds: { $in: bookIds } },
                        { counties: userCountry },
                    ],
                };
                const discountPrice = await DiscountPrice.find(query);
                console.log('update cart 496', discountPrice);
                const allBooks = await bookModel
                    .find({
                        _id: { $in: bookIds },
                    })
                    .sort({ _id: 1 });

                bookIds.sort();

                let totalPrice = 0;
                let actualPrice = 0;
                cartExistsForUser.books.forEach((item, index) => {
                    const bookId = item.book;
                    const quantity = item.quantity;
                    const book = allBooks[index];
                    totalPrice += calculateTotalPrice(
                        book,
                        discountPrice,
                        bookId,
                        quantity
                    );
                    actualPrice += calculateTotalPriceWithOutDiscount(
                        book,
                        quantity
                    );
                });
                if (cartExistsForUser.books.length <= 0) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.OK,
                        'All items removed from the cart'
                    );
                }
                return sendResponse(
                    res,
                    HTTP_STATUS.ACCEPTED,
                    'Book successfully removed from the cart',
                    {
                        cartExistsForUser,
                        beforeDiscount: actualPrice.toFixed(2),
                        afterDiscount: totalPrice.toFixed(2),
                    }
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
}

module.exports = new CartController();
