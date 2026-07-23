import ApiError from '../utils/ApiError.js';

function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route not found: ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with this unique value already exists';
  } else if (err.code === 'ER_ROW_IS_REFERENCED_2' || err.code === 'ER_ROW_IS_REFERENCED') {
    statusCode = 409;
    message = 'Cannot delete this record because it is referenced by other records';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_NO_REFERENCED_ROW') {
    statusCode = 400;
    message = 'Referenced record does not exist';
  } else if (!(err instanceof ApiError)) {
    console.error(err);
  }

  statusCode = statusCode || 500;
  message = message || 'Internal server error';

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

export { notFoundHandler, errorHandler };
