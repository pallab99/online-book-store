const bcrypt = require('bcrypt');

const hashPasswordUsingBcrypt = async (plainPassword) => {
    try {
        const saltRounds = 10;
        const hash = await bcrypt.hash(plainPassword, saltRounds);
        return hash;
    } catch (err) {
        console.error('Error hashing password:', err);
    }
};

const comparePasswords = async (inputPassword, hashedPasswordFromDB) => {
    try {
        const result = await bcrypt.compare(
            inputPassword,
            hashedPasswordFromDB
        );
        return result;
    } catch (err) {
        console.error('Error comparing passwords:', err);
    }
};

module.exports = { hashPasswordUsingBcrypt, comparePasswords };
