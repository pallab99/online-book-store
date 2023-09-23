const express = require('express');
const router = express.Router();
const CartController = require('./../../controllers/cart');
const validator = require('../../middlewares/validator');
const {
    tokenAuthorization,
    isUser,
} = require('../../middlewares/tokenValidator');

router
    .get(
        '/cartByUser',
        [tokenAuthorization, isUser],
        CartController.getCartByUser
    )
    .post(
        '/create',
        [tokenAuthorization, isUser, validator.addToCart],
        CartController.addToCart
    )
    .patch(
        '/update',
        [tokenAuthorization, isUser, validator.updateCart],
        CartController.updateCart
    );

module.exports = router;
