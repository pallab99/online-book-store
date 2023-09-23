const express = require('express');
const router = express.Router();
const TransactionController = require('./../../controllers/transaction');
const validator = require('../../middlewares/validator');
const {
    tokenAuthorization,
    isUser,
    isAdmin,
} = require('../../middlewares/tokenValidator');

router
    .get(
        '/details',
        [tokenAuthorization, isUser],
        TransactionController.getTransactionByUser
    )
    .get(
        '/all',
        [tokenAuthorization, isAdmin],
        TransactionController.getAllTransaction
    )
    .post(
        '/create',
        [tokenAuthorization, isUser, validator.createTransaction],
        TransactionController.createTransaction
    );

module.exports = router;
