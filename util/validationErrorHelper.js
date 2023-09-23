const HTTP_STATUS = require('../constants/statusCode');
const { sendResponse } = require('./response');

const sendValidationError = (res, validation) => {
    const error = {};
    validation.forEach((ele) => {
        const property = ele.path;
        error[property] = ele.msg;
    });
    return sendResponse(
        res,
        HTTP_STATUS.UNPROCESSABLE_ENTITY,
        'Unprocessable entity',
        error
    );
};

module.exports = { sendValidationError };
