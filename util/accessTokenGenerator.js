const dotEnv = require('dotenv');
dotEnv.config();
const jwt = require('jsonwebtoken');

const generateAccessToken = (body) => {
    const accessTokenSecret = process.env.ACCESS_TOKEN_SECRET;
    const token = jwt.sign(body, accessTokenSecret, { expiresIn: '10 s' });
    return token;
};

module.exports = generateAccessToken;
