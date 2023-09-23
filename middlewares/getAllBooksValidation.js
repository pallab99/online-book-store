const HTTP_STATUS = require('../constants/statusCode');
const { sendResponse } = require('../util/response');

const getAllBooksValidation = (req, res, next) => {
    const {
        offset,
        limit,
        search,
        sortBy,
        sortOrder,
        filter,
        filterOrder,
        filterValue,
        category,
    } = req.query;

    const error = {};
    const isInvalidString = (value) =>
        typeof value !== 'string' || value.trim() === '';

    const isInvalidNumber = (value) => isNaN(value) || value < 0;

    if (offset != undefined && isInvalidNumber(offset)) {
        error.offset = 'Invalid value provided';
    }
    if (limit != undefined && isInvalidNumber(limit)) {
        error.limit = 'Invalid value provided';
    }

    if (search != undefined && isInvalidString(search)) {
        error.search = 'Invalid value provided';
    }
    if (sortBy != undefined) {
        const allowedProperties = ['price', 'stock', 'rating'];
        if (isInvalidString(sortBy) || !allowedProperties.includes(sortBy)) {
            error.sortBy = 'Invalid value provided';
        }
        if (sortOrder === undefined && isInvalidString(sortOrder)) {
            error.sortOrder = 'Sort order is required when sortBy is selected';
        }
    }
    if (sortOrder != undefined) {
        const allowedProperties = ['asc', 'desc'];
        if (
            !allowedProperties.includes(sortOrder) ||
            isInvalidString(sortOrder)
        ) {
            error.sortOrder = 'Invalid value provided';
        }
        if (sortBy === undefined || isInvalidString(sortBy)) {
            error.sortBy = 'Sort by is required when sort order is selected';
        }
    }
    if (filter != undefined) {
        const allowedProperties = [
            'stock',
            'price',
            'discountPercentage',
            'rating',
        ];
        if (!allowedProperties.includes(filter) || isInvalidString(filter)) {
            error.filter = 'Invalid value provided';
        }
        if (filterOrder === undefined || isInvalidString(filterOrder)) {
            error.filterOrder = 'filter order is required ';
        }

        if (filterValue === undefined || isInvalidString(filterValue)) {
            error.filterValue = 'filter value is required ';
        }
    }

    if (filterOrder != undefined) {
        const allowedProperties = ['high', 'low'];
        if (
            !allowedProperties.includes(filterOrder) ||
            isInvalidString(filterOrder)
        ) {
            error.filterOrder = 'Invalid value provided';
        }
        if (filter === undefined || isInvalidString(filter)) {
            error.filter = 'filter is required ';
        }

        if (filterValue === undefined || isInvalidString(filterValue)) {
            error.filterValue = 'filter value is required ';
        }
    }

    if (filterValue != undefined) {
        if (isInvalidNumber(filterValue) || filterValue > 1000000) {
            error.filterValue = 'Invalid value provided';
        }
        if (filter === undefined || isInvalidString(filter)) {
            error.filter = 'filter is required ';
        }

        if (filterOrder === undefined || isInvalidString(filterOrder)) {
            error.filterOrder = 'filter order is required ';
        }
    }
    if (category != undefined) {
        const temp = category.split(',');
        const result = temp.every((ele) => isInvalidString(ele));
        if (result || temp.value <= 0) {
            error.category = 'Invalid value provided';
        }
    }

    if (Object.keys(error).length > 0) {
        return sendResponse(
            res,
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            'Unprocessable entity',
            error
        );
    }
    next();
};

module.exports = getAllBooksValidation;
