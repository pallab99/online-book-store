const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const cors = require('cors');
const dotEnv = require('dotenv');
dotEnv.config();

const { sendResponse } = require('./util/response');
const HTTP_STATUS = require('./constants/statusCode');
const connectDB = require('./configs/databaseConnection');
const path = require('path');
const routes = require('./routes');
const port = process.env.PORT;
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.set('view engine', 'ejs');

app.use(express.static('public'));

app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
        return sendResponse(
            res,
            HTTP_STATUS.UNPROCESSABLE_ENTITY,
            'Invalid JSON provided'
        );
    }
    next();
});

app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        return sendResponse(res, HTTP_STATUS.UNPROCESSABLE_ENTITY, err.message);
    }
    next(err);
});
app.use('/api', require('./routes'));

app.get('/', (req, res) => {
    return sendResponse(res, HTTP_STATUS.OK, 'This is the base route');
});

app.use((req, res, next) => {
    return sendResponse(res, HTTP_STATUS.BAD_GATEWAY, "Can't find the route");
});

connectDB(() => {
    app.listen(port, () => {
        console.log(`server started`);
    });
});
