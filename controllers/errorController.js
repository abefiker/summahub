const AppError = require('../utils/appError')
const handleCastErrorDB = err => {
    const message = `Invalid  ${err.path} : ${err.value}`;
    return new AppError(message, 400);
}
const handleDuplicateFieldsDB = err => {
    const message = `Duplicate fields value ${err.KeyValue.name} : please use another value`;
    return new AppError(message, 400);
}
const handleValidattionErrorDB = err => {
    const message = 'Invalid input data';
    return new AppError(message, 400);
}

const sendErrorDev = (err,req, res) => {
    if(req.originalUrl.startsWith('/api')){
         res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    }else {
        res.status(err.statusCode).render('error',{
            title : 'Something went wrong',
            message: err.message
        })
    }
}
const sendErrorProd = (err,req, res) => {
    
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        });
    } else {
        console.log('Error 🔥', err)
        res.status(500).json({
            status: 'error',
            message: 'something went very wrong',
        });
    }
}
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err,req, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err }
        if (error.name === 'CastError') error = handleCastErrorDB(error);
        if (error.code === 11000) error = handleDuplicateFieldsDB(error)
        if (error.name === 'ValidatorError') error = handleValidattionErrorDB(error)

        sendErrorProd(error,req, res);
    }

};
