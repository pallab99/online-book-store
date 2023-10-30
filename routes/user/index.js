const express = require('express');
const router = express.Router();
const UserController = require('./../../controllers/user');
const validator = require('../../middlewares/validator');
const {
    tokenAuthorization,
    isAdmin,
    isUser,
} = require('../../middlewares/tokenValidator');

router
    .post(
        '/add-balance',
        [tokenAuthorization, isUser, validator.addBalance],
        UserController.addBalance
    )
    .get(
        '/balance',
        [tokenAuthorization, isUser, validator.addBalance],
        UserController.getUserBalance
    )
    .get('/all', [tokenAuthorization, isAdmin], UserController.viewAllUserData)
    .patch(
        '/update/:userId',
        [tokenAuthorization, isAdmin, validator.updateUser],
        UserController.updateUser
    )
    .delete(
        '/delete/:userId',
        [tokenAuthorization, isAdmin, validator.deleteUser],
        UserController.deleteUser
    );

module.exports = router;
