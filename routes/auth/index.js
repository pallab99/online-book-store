const express = require('express');
const router = express.Router();
const AuthController = require('./../../controllers/auth');
const validator = require('../../middlewares/validator');

router
    .get(
        '/validate-reset-password/:resetToken/:userId',
        AuthController.validateResetPassword
    )
    .delete('/logout', AuthController.logOut)
    .post('/sign-up', [validator.signUpUser], AuthController.signUp)
    .post('/login', [validator.loginUser], AuthController.login)
    .post('/refreshToken', AuthController.refreshToken)
    .post(
        '/sendEmailForResetPassword',
        AuthController.sendEmailForPassWordReset
    )
    .post('/reset-password', AuthController.resetPassword)
    .post(
        '/verify-account',
        [validator.verifyAccount],
        AuthController.verifyAccount
    );

module.exports = router;
