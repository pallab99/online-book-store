const multer = require('multer');
// const fileType=
const path = require('path');
const fileTypes = require('../constants/filetype');

const upload = multer({
    limits: {
        fileSize: 524288000,
    },
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            if (file) {
                cb(null, './public/images');
            } else {
                cb('No file was found', null);
            }
        },
        filename: (req, file, cb) => {
            if (file) {
                cb(null, Date.now() + '_' + file.originalname);
            } else {
                cb('No file was found', null);
            }
        },
    }),
    fileFilter: (req, file, cb) => {
        if (file) {
            const extension = path.extname(file.originalname);
            req.file_extension = extension;
            if (fileTypes.includes(extension)) {
                cb(null, true);
            } else {
                cb(null, false);
            }
        } else {
            cb('No file found', false);
        }
    },
});

module.exports = upload;
