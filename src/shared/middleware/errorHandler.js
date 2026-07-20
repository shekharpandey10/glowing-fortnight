import logger from '../config/logger.js'
import ResponseFormatter from '../utils/ResponseFormatter.js'



const errorHandler = async (error, req, res, next) => {
    let statusCode = error.statusCode || 500;
    let message = error.message || 'Internal server error'
    let errors = error.errors

    logger.error('Error occurred ', {
        message,
        statusCode,
        stack: error.stack,
        path: req.path,
        method: req.method
    })

    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = "Validation Error";
        errors = Object.values(error.errors).map((e) => e.message);
    } else if (error.name === 'MongoServerError' && error.code === 11000) {
        statusCode = 409;
        message = "Duplicate key error";
    } else if (error.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = "Invalid token";
    } else if (error.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
    }

    return res.status(statusCode).json(ResponseFormatter.error(errors, message, statusCode))
}

export default errorHandler
