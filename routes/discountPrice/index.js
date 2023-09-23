const express = require('express');
const router = express.Router();
const DiscountPriceController = require('./../../controllers/discountPrice');
const validator = require('../../middlewares/validator');
const {
    tokenAuthorization,
    isAdmin,
} = require('../../middlewares/tokenValidator');

router
    .get(
        '/all',
        [tokenAuthorization, isAdmin],
        DiscountPriceController.getAllDiscount
    )
    .post(
        '/create',
        [tokenAuthorization, isAdmin, validator.addDiscount],
        DiscountPriceController.addDiscount
    )
    .patch(
        '/update/:discountId',
        [tokenAuthorization, isAdmin, validator.updateDiscount],
        DiscountPriceController.updateDiscount
    )
    .delete(
        '/delete/:discountId',
        [tokenAuthorization, isAdmin, validator.deleteDiscount],
        DiscountPriceController.deleteDiscount
    );

module.exports = router;
