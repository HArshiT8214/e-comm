const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error structure
  let error = {
    success: false,
    message: err.message || 'Internal Server Error',
    statusCode: err.statusCode || 500
  };

  // --- POSTGRESQL & Constraint Errors (PsqlState codes) ---
  
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        error.message = 'Duplicate entry found or record already exists.';
        error.statusCode = 400;
        break;
      
      case '23503': // foreign_key_violation
        // This covers both missing parent (no referenced row) and existing child (row is referenced).
        // The specific message often reveals the table/constraint name.
        if (err.detail && err.detail.includes('is still referenced')) {
            error.message = 'Cannot delete record as it is referenced by other records.';
        } else {
            error.message = 'Referenced record not found or does not exist.';
        }
        error.statusCode = 400;
        break;

      case '42P01': // undefined_table (Table not found - often in dev/migration issues)
        error.message = 'Database error: Table or column not found.';
        error.statusCode = 500;
        break;
    }
  }

  // --- JWT errors ---
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.statusCode = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.statusCode = 401;
  }

  // --- Validation errors ---
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.statusCode = 400;
  }
  
  // --- Multer errors (file upload) ---
  if (err.code === 'LIMIT_FILE_SIZE') {
    error.message = 'File too large';
    error.statusCode = 400;
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error.message = 'Unexpected field';
    error.statusCode = 400;
  }

  // Final response
  res.status(error.statusCode).json({
    success: error.success,
    message: error.message,
    // Only expose stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;