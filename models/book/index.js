const mongoose = require('mongoose');
const { Schema } = mongoose;
const bookSchema = new Schema({
    title: {
        type: String,
        required: [true, 'Title is required'],
        unique: true,
        maxLength: [100, 'Title cannot be greater than 30'],
    },
    author: {
        type: String,
        required: [true, 'Author is required'],
    },
    price: {
        type: Number,
        required: [true, 'Price is required'],
        min: [10, 'price must be minimum 10'],
        max: [10000, 'price must be maximum 100'],
    },

    description: {
        type: String,
        required: [true, 'Description is required'],
    },
    rating: {
        type: Number,
        required: [true, 'Rating is required'],
        min: [0, 'Rating can not be less than 0'],
        max: [5, 'Rating can not be greater than 5'],
    },
    stock: {
        type: Number,
        required: [true, 'Stock is required'],
        min: [0, 'Stock can not be less than 0'],
        max: [500, 'Stock can not be greater than 500'],
    },
    category: {
        type: String,
        required: [true, 'Category is required'],
    },
    publishedAt: {
        type: Date,
        required: [true, 'PublishedAt is required'],
    },
    isbn: {
        type: String,
        unique: true,
        required: [true, 'ISBN number is required'],
    },
    reviews: {
        type: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Review',
                required: false,
            },
        ],
    },
});
const bookModel = mongoose.model('Book', bookSchema);
module.exports = bookModel;
