const mongoose = require('mongoose');
const { Schema } = mongoose;
const reviewSchema = new Schema(
    {
        book: {
            type: Schema.Types.ObjectId,
            ref: 'Book',
            required: true,
        },
        reviews: {
            type: [
                {
                    user: {
                        type: Schema.Types.ObjectId,
                        ref: 'User',
                        required: true,
                    },
                    message: {
                        type: String,
                    },
                    rating: Number,
                },
            ],
            required: true,
        },
    },
    { timestamps: true }
);
const bookReviewModel = mongoose.model('Review', reviewSchema);
module.exports = bookReviewModel;
