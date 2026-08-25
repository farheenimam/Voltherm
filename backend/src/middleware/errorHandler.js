/**
 * Central error-handling middleware for the Voltherm API.
 *
 * Any route/agent can throw (or call next(err)) with a plain Error, or with
 * one of the shaped errors below, and it will be normalized into a
 * consistent JSON error response.
 */

export class ApiError extends Error {
  constructor(statusCode, message, details = undefined) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export function notFoundHandler(req, res, next) {
  next(new ApiError(404, `No route for ${req.method} ${req.originalUrl}`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || err.status || 500;
  const payload = {
    error: {
      message: err.message || 'Internal server error',
      ...(err.details ? { details: err.details } : {}),
    },
  };

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error('[voltherm] unhandled error:', err);
  }

  res.status(statusCode).json(payload);
}
