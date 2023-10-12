const express = require('express');
const router = express.Router();
const AuthController = require('./../../controllers/auth');
const validator = require('../../middlewares/validator');

router
    .delete('/logout', AuthController.logOut)
    .post('/sign-up', [validator.signUpUser], AuthController.signUp)
    .post('/login', [validator.loginUser], AuthController.login)
    .post('/refreshToken', AuthController.refreshToken)
    .post(
        '/verify-account',
        [validator.verifyAccount],
        AuthController.verifyAccount
    );

module.exports = router;
