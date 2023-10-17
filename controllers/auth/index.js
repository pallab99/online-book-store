const { validationResult } = require('express-validator');
const {
    hashPasswordUsingBcrypt,
    comparePasswords,
} = require('../../util/hashPassword');
const authModel = require('../../models/auth');
const userModel = require('../../models/user');
const { sendResponse } = require('../../util/response');
const HTTP_STATUS = require('../../constants/statusCode');
const generateAccessToken = require('../../util/accessTokenGenerator');
const generateRefreshToken = require('../../util/refreshTokenGenerator');
const jwt = require('jsonwebtoken');
const databaseLogger = require('../../util/dbLogger');
const { sendValidationError } = require('../../util/validationErrorHelper');
const generateVerificationCode = require('../../util/generateVerificationCode');
const sendVerificationEmail = require('../../util/nodeMailer');
const crypto = require('crypto');
const path = require('path');
const { promisify } = require('util');
const ejs = require('ejs');
const { transport } = require('../../configs/mail');
const ejsRenderFile = promisify(ejs.renderFile);
const bcrypt = require('bcrypt');

class AuthController {
    async signUp(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const {
                email,
                password,
                confirmPassword,
                name,
                phoneNumber,
                address,
            } = req.body;
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const allowedProperties = [
                'email',
                'password',
                'confirmPassword',
                'name',
                'phoneNumber',
                'address',
            ];

            for (const key in req.body) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided'
                    );
                }
            }
            const emailExists = await authModel.findOne({ email: email });
            const emailExistsAtUser = await userModel.findOne({
                email: email,
            });
            if (!emailExists && !emailExistsAtUser) {
                address.country = address.country.toUpperCase();
                const newUser = await userModel.create({
                    email,
                    name,
                    phoneNumber,
                    address,
                });
                if (password != confirmPassword) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.BAD_REQUEST,
                        'Password and confirm password should be same'
                    );
                }
                const hashedPassword = await hashPasswordUsingBcrypt(password);
                if (newUser && hashedPassword) {
                    const verificationCode = generateVerificationCode();
                    const newRegistration = await authModel.create({
                        email,
                        password: hashedPassword,
                        user: newUser._id,
                        verificationCode,
                    });

                    const savedRegistration = await authModel
                        .findById(newRegistration._id)
                        .select('-password')
                        .exec();
                    if (newRegistration && savedRegistration) {
                        sendVerificationEmail(email, verificationCode);
                        return sendResponse(
                            res,
                            HTTP_STATUS.CREATED,
                            'Sign up successfully.One verification code is sent to your email.Please verify it before login'
                        );
                    } else {
                        return sendResponse(
                            res,
                            HTTP_STATUS.BAD_REQUEST,
                            'Something went wrong'
                        );
                    }
                } else {
                    return sendResponse(
                        res,
                        HTTP_STATUS.BAD_REQUEST,
                        'Something went wrong'
                    );
                }
            } else {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'The email is already in use'
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

    async login(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const { email, password } = req.body;
            const allowedProperties = ['email', 'password'];

            for (const key in req.body) {
                if (!allowedProperties.includes(key)) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.UNPROCESSABLE_ENTITY,
                        'Invalid property provided for user update: '
                    );
                }
            }
            const emailExists = await authModel
                .findOne({ email: email })
                .populate('user');
            console.log(emailExists);
            if (!emailExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'You are not registered'
                );
            } else {
                const passwordExists = await comparePasswords(
                    password,
                    emailExists?.password
                );
                if (emailExists.isUserRestricted) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.BAD_REQUEST,
                        'You can not login.Your account is restricted'
                    );
                }
                if (!emailExists.isVerified) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.BAD_REQUEST,
                        'Please verify your account before login'
                    );
                }
                if (!passwordExists) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.BAD_REQUEST,
                        'Wrong credentials'
                    );
                } else {
                    const data = {
                        _id: emailExists?._id,
                        email: emailExists?.email,
                        rank: emailExists?.rank,
                        name: emailExists?.user?.name,
                        address: emailExists?.user?.address,
                        phoneNumber: emailExists?.user?.phoneNumber,
                    };
                    const jwtToken = generateAccessToken(data);
                    const refreshToken = generateRefreshToken(data);
                    res.cookie('accessToken', jwtToken, { path: '/' });
                    res.cookie('refreshToken', refreshToken, { path: '/' });

                    data.accessToken = jwtToken;
                    data.refreshToken = refreshToken;
                    emailExists.sessionActive = true;
                    await emailExists.save();

                    return sendResponse(
                        res,
                        HTTP_STATUS.OK,
                        'Sign in successful',
                        data
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

    async refreshToken(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const { refreshToken } = req.cookies;
            if (!refreshToken) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNAUTHORIZED,
                    'Token can not be null'
                );
            }
            const token = refreshToken;
            const secretKey = process.env.REFRESH_TOKEN_SECRET;
            const decoded = await jwt.verify(token, secretKey);

            delete decoded.iat;
            delete decoded.exp;

            if (decoded) {
                const accessToken = generateAccessToken(decoded);
                res.cookie('accessToken', accessToken, { path: '/' });
                if (accessToken) {
                    return sendResponse(
                        res,
                        HTTP_STATUS.OK,
                        'Access token generated successfully',
                        accessToken
                    );
                }
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Something went wrong'
                );
            }
        } catch (error) {
            databaseLogger(error.message);
            if (error instanceof jwt.TokenExpiredError) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNAUTHORIZED,
                    'Please login again'
                );
            }
            if (error instanceof jwt.JsonWebTokenError) {
                return sendResponse(
                    res,
                    HTTP_STATUS.UNAUTHORIZED,
                    'Unauthorized access'
                );
            }
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unauthorized access'
            );
        }
    }

    async verifyAccount(req, res) {
        try {
            databaseLogger(req.originalUrl);
            const validation = validationResult(req).array();
            if (validation.length) {
                return sendValidationError(res, validation);
            }
            const { email, verificationCode } = req.body;
            const userExists = await authModel.findOne({ email });
            if (!userExists) {
                return sendResponse(
                    res,
                    HTTP_STATUS.NOT_FOUND,
                    'No user found'
                );
            }

            if (userExists.isVerified) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'You are already verified.Please login'
                );
            }
            if (userExists.verificationCode != verificationCode) {
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'Wrong verification code provided'
                );
            }

            userExists.isVerified = true;
            await userExists.save();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Account verified successfully.Now you can login.'
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

    async logOut(req, res) {
        try {
            const accessToken = res.cookie('accessToken');
            const refreshToken = res.cookie('refreshToken');
            // If access token is not present in the cookies then we don't need to delete it from db as well
            if (!accessToken || !refreshToken) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Something went wrong',
                    []
                );
            }
            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            return sendResponse(res, HTTP_STATUS.OK, 'Log Out Successful', []);
        } catch (error) {
            databaseLogger(error.message);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }

    async sendEmailForPassWordReset(req, res) {
        try {
            const { email } = req.body;
            const auth = await authModel
                .findOne({ email: email })
                .populate('user');
            if (!auth) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'No user found'
                );
            }
            const resetToken = crypto.randomBytes(64).toString('hex');
            const resetURL = `http://localhost:8000/api/auth/validate-reset-password/${resetToken}/${auth._id.toString()}`;
            auth.resetPasswordToken = resetToken;
            auth.resetPassword = true;
            auth.resetPasswordExpired = Date.now() + 60 * 60 * 1000;
            auth.save();
            const htmlBody = await ejsRenderFile(
                path.join(
                    __dirname,
                    '..',
                    '..',
                    'views',
                    'forget-password.ejs'
                ),
                {
                    name: auth.user.name,
                    resetURL,
                }
            );

            const result = await transport.sendMail({
                from: 'book-heaven@system.com',
                to: `${auth.user.name} ${email}`,
                subject: 'Forget Password',
                html: htmlBody,
            });
            if (result.messageId) {
                return sendResponse(
                    res,
                    HTTP_STATUS.OK,
                    'Successfully request for reset password.Please check your email'
                );
            }
            return sendResponse(res, HTTP_STATUS.OK, 'Something went wrong');
        } catch (error) {
            console.log(error);
            databaseLogger(error);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }

    async validateResetPassword(req, res) {
        try {
            const { resetToken, userId } = req.params;
            const auth = await authModel.findById(userId);
            const wrongURL = 'http://localhost:5173/something-went-wrong';
            if (
                !auth ||
                !auth.resetPasswordToken ||
                auth.resetPasswordToken !== resetToken ||
                !auth.resetPassword ||
                auth.resetPasswordExpired < Date.now()
            ) {
                res.redirect(wrongURL);
                return;
            }

            res.redirect(
                `http://localhost:5173/reset-password/${resetToken}/${userId}`
            );
        } catch (error) {
            console.log(error);
            databaseLogger(error);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }

    async resetPassword(req, res) {
        try {
            let { password, confirmPassword, resetToken, userId } = req.body;
            const auth = await authModel.findOne({ _id: userId });
            if (resetToken != auth.resetPasswordToken || !auth) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Something went wrong',
                    []
                );
            }
            if (password !== confirmPassword) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Password and confirm password need to be same',
                    []
                );
            }

            if (await bcrypt.compare(password, auth.password)) {
                return sendResponse(
                    res,
                    HTTP_STATUS.BAD_REQUEST,
                    'Your new password and previous password can not be same',
                    []
                );
            }
            const hashedPassword = await hashPasswordUsingBcrypt(password);
            auth.password = hashedPassword;
            (auth.resetPasswordToken = null),
                (auth.resetPasswordExpired = null);
            auth.resetPassword = null;
            await auth.save();
            return sendResponse(
                res,
                HTTP_STATUS.OK,
                'Reset password successfully',
                []
            );
        } catch (error) {
            console.log(error);
            databaseLogger(error);
            return sendResponse(
                res,
                HTTP_STATUS.INTERNAL_SERVER_ERROR,
                'Internal server error'
            );
        }
    }
}

module.exports = new AuthController();
