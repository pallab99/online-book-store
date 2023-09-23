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
                    res.cookie('accessToken', jwtToken, { httpOnly: true });
                    res.cookie('refreshToken', refreshToken, {
                        httpOnly: true,
                    });

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
                res.cookie('accessToken', accessToken, { httpOnly: true });
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
}

module.exports = new AuthController();
