/**
 * Global error handler middleware.
 * Catches unhandled errors from route handlers and sends a consistent JSON response.
 */
export function errorHandler(err, req, res, _next) {
  console.error(`❌ [${req.method} ${req.path}]`, err.message);
  if (process.env.NODE_ENV !== 'production') {
    console.error(err.stack);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed', details: messages });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0];
    return res.status(409).json({ error: `Duplicate value for field: ${field}` });
  }

  // Mongoose cast error (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid ${err.path}: ${err.value}` });
  }

  // Default server error
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.message || 'Internal server error',
  });
}
