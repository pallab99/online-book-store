const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    host: 'sandbox.smtp.mailtrap.io',
    port: 2525,
    auth: {
        user: 'de26ee88ddd141',
        pass: '60d5a83b95f392',
    },
});

module.exports = { transport };
