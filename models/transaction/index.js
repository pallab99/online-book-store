const mongoose = require('mongoose');
const { Schema } = mongoose;
const transactionSchema = new Schema(
    {
        user: {
            type: mongoose.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        books: {
            type: [
                {
                    book: {
                        type: mongoose.Types.ObjectId,
                        ref: 'Book',
                        required: true,
                    },
                    quantity: Number,
                    _id: false,
                },
            ],
        },
        totalPrice: { type: Number, required: true },
        paymentMethod: {
            type: String,
            required: true,
            default: 'online',
        },
    },
    { timestamps: true }
);
const transactionModel = mongoose.model('Transaction', transactionSchema);
module.exports = transactionModel;
