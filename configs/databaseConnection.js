const mongoose = require('mongoose');

const connectDB = async (callback) => {
    try {
        const dbConnectionString = process.env.DB_CONNECTION_STRING;
        if (dbConnectionString) {
            const client = mongoose.connect(dbConnectionString);
            if (client) {
                console.log('Database connected successfully');
                callback();
            } else {
                console.log('Database url is not provided');
            }
        }
    } catch (error) {
        console.log(error);
    }
};

module.exports = connectDB;
