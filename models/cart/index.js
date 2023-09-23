const mongoose = require('mongoose');
const { Schema } = mongoose;
const cartSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        books: {
            type: [
                {
                    book: {
                        type: Schema.Types.ObjectId,
                        ref: 'Book',
                        required: true,
                    },
                    quantity: Number,
                    _id: false,
                },
            ],
        },
    },
    { timestamps: true }
);
const cartModel = mongoose.model('Cart', cartSchema);
module.exports = cartModel;
