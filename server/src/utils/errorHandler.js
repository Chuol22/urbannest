// Error handler utility for server-side error handling
// Provides consistent error response formatting

class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

const errorHandler = {
  /**
   * Handle operational errors
   */
  handleOperationalError: (error, res) => {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  },

  /**
   * Handle unexpected errors
   */
  handleUnexpectedError: (error, res) => {
    console.error('Unexpected error:', error);
    return res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
      ...(process.env.NODE_ENV === 'development' && { 
        error: error.message,
        stack: error.stack 
      })
    });
  },

  /**
   * Async error wrapper for route handlers
   */
  asyncHandler: (fn) => {
    return (req, res, next) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  },

  /**
   * Not found error handler
   */
  notFound: (message = 'Resource not found') => {
    return new AppError(message, 404);
  },

  /**
   * Bad request error handler
   */
  badRequest: (message = 'Bad request') => {
    return new AppError(message, 400);
  },

  /**
   * Unauthorized error handler
   */
  unauthorized: (message = 'Unauthorized') => {
    return new AppError(message, 401);
  },

  /**
   * Forbidden error handler
   */
  forbidden: (message = 'Forbidden') => {
    return new AppError(message, 403);
  },

  /**
   * Conflict error handler
   */
  conflict: (message = 'Conflict') => {
    return new AppError(message, 409);
  }
};

export { AppError, errorHandler };
