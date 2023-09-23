const mongoose = require('mongoose');
const { Schema } = mongoose;
const validator = require('validator');

const authSchema = new Schema(
    {
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
        password: {
            type: String,
            required: [true, 'Password is required'],
            min: [8, 'Password must be minimum 8 characters'],
            max: [15, 'Password can not be greater than 15 characters'],
        },
        isVerified: {
            type: Boolean,
            required: false,
            default: false,
        },
        rank: {
            type: Number,
            default: 2,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        verificationCode: {
            type: Number,
            required: true,
        },
        isUserRestricted: {
            type: Boolean,
            default: false,
            required: false,
        },
    },
    { timestamps: true }
);

const authModel = mongoose.model('Auth', authSchema);
module.exports = authModel;
