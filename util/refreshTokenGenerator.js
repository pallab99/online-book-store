const dotEnv = require('dotenv');
dotEnv.config();
const jwt = require('jsonwebtoken');

const generateRefreshToken = (body) => {
    const refreshTokenSecret = process.env.REFRESH_TOKEN_SECRET;
    const token = jwt.sign(body, refreshTokenSecret, { expiresIn: '1y' });
    return token;
};

module.exports = generateRefreshToken;
