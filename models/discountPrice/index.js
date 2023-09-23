const mongoose = require('mongoose');

const discountPriceSchema = new mongoose.Schema({
    discountPercentage: {
        type: Number,
        required: true,
    },
    bookIds: {
        type: [mongoose.Schema.Types.ObjectId],
        ref: 'Book',
        unique: true,
    },
    startDate: {
        type: Date,
        required: true,
    },
    endDate: {
        type: Date,
        required: true,
    },
    counties: {
        type: [String], // Change the type to [String]
        required: true,
    },
});

const DiscountPrice = mongoose.model('DiscountPrice', discountPriceSchema);

module.exports = DiscountPrice;
