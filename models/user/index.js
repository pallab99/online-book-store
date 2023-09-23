const mongoose = require('mongoose');
const { Schema } = mongoose;
const validator = require('validator');

const userSchema = new Schema(
    {
        name: {
            type: String,
            required: [true, 'Name is required'],
            maxLength: 30,
        },

        email: {
            type: String,
            unique: true,
            required: [true, 'Email is required'],
            lowercase: true,
            validate: {
                validator: function (value) {
                    return validator.isEmail(value);
                },
                message: 'Invalid email format',
            },
        },
        phoneNumber: {
            type: Number,
            required: [true, 'Phone Number is required'],
        },
        address: {
            country: {
                type: String,
                required: true,
            },
            city: {
                type: String,
                required: true,
            },
            area: {
                type: String,
                required: true,
            },
            street: {
                type: String,
                required: true,
            },
        },
        balance: {
            type: Number,
            required: false,
        },
    },
    { timestamps: true }
);

const userModel = mongoose.model('User', userSchema);
module.exports = userModel;
