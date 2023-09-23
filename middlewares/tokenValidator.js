const jwt = require('jsonwebtoken');
const dotEnv = require('dotenv');
const { sendResponse } = require('../util/response');
const HTTP_STATUS = require('../constants/statusCode');
dotEnv.config();

const tokenAuthorization = (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unable to access.Please login'
            );
        }
        const token = accessToken;
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        const validate = jwt.verify(token, secretKey);
        if (validate) {
            req.user = validate;
            next();
        } else {
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unable to access.Please login'
            );
        }
    } catch (error) {
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
};

const isAdmin = (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unable to access.Please login'
            );
        }
        const token = accessToken;
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        const validate = jwt.verify(token, secretKey);
        if (validate.rank === 1) {
            next();
        } else {
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unable to access.'
            );
        }
    } catch (error) {
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
};

const isUser = (req, res, next) => {
    try {
        const { accessToken } = req.cookies;
        if (!accessToken) {
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unable to access.Please login'
            );
        }
        const token = accessToken;
        const secretKey = process.env.ACCESS_TOKEN_SECRET;
        const validate = jwt.verify(token, secretKey);
        if (validate.rank === 2) {
            next();
        } else {
            return sendResponse(
                res,
                HTTP_STATUS.UNAUTHORIZED,
                'Unable to access.'
            );
        }
    } catch (error) {
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
};
module.exports = { tokenAuthorization, isAdmin, isUser };
