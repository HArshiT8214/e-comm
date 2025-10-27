const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // MySQL errors
  if (err.code === 'ER_DUP_ENTRY') {
    error.message = 'Duplicate entry found';
    error.statusCode = 400;
  }

  if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    error.message = 'Referenced record not found';
    error.statusCode = 400;
  }

  if (err.code === 'ER_ROW_IS_REFERENCED_2') {
    error.message = 'Cannot delete record as it is referenced by other records';
    error.statusCode = 400;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.statusCode = 400;
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected field';
    error.statusCode = 400;
  }

  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
