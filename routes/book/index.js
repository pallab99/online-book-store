const express = require('express');
const router = express.Router();
const BookController = require('./../../controllers/book');
const validator = require('../../middlewares/validator');
const {
    tokenAuthorization,
    isAdmin,
} = require('../../middlewares/tokenValidator');
const getAllBooksValidation = require('../../middlewares/getAllBooksValidation');
const upload = require('../../configs/file');
router
    .get('/all', [getAllBooksValidation], BookController.getAllBooks)
    .get('/details/:bookId', BookController.getBookById)
    .get('/author/all', BookController.getAllAuthors)
    .post(
        '/create',
        [
            tokenAuthorization,
            isAdmin,
            // validator.createBook,
            upload.single('file_to_upload'),
        ],
        BookController.createBook
    )
    .patch(
        '/update/:bookId',
        [tokenAuthorization, isAdmin, validator.updateBook],
        BookController.updateBook
    )
    .delete(
        '/delete/:bookId',
        [tokenAuthorization, isAdmin, validator.deleteBook],
        BookController.deleteBook
    );

module.exports = router;
