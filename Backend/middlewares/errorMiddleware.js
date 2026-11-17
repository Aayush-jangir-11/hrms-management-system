// 404 Route Not Found Middleware
// Triggers when a request is made to an endpoint that does not exist
const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.method} ${req.originalUrl}`);
  res.status(404);
  next(error);
};

// Global Error Handler Middleware
// Express recognizes this as an error handler because it has 4 arguments: (err, req, res, next)
const errorHandler = (err, req, res, next) => {
  // If statusCode is still 200 (OK), default to 500 (Internal Server Error)
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || "Internal Server Error";

  // 1. Mongoose Bad ObjectId (CastError) - e.g. invalid MongoDB ID in params
  if (err.name === "CastError" && err.kind === "ObjectId") {
    statusCode = 404;
    message = `Resource not found with invalid ID: ${err.value}`;
  }

  // 2. Mongoose Duplicate Key Error (code 11000) - e.g. duplicate email
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || "field";
    message = `Duplicate value entered for '${field}'. Please provide another value.`;
  }

  // 3. Mongoose Validation Error (e.g. required field missing)
  if (err.name === "ValidationError") {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((item) => item.message)
      .join(", ");
  }

  // 4. JWT Authentication Errors
  if (err.name === "JsonWebTokenError") {
    statusCode = 401;
    message = "Not authorized, token is invalid.";
  }
  if (err.name === "TokenExpiredError") {
    statusCode = 401;
    message = "Not authorized, token has expired. Please log in again.";
  }

  console.error(`[API Error] ${statusCode} - ${message}`);
  if (process.env.NODE_ENV !== "production" && err.stack) {
    console.error(err.stack);
  }

  return res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = {
  notFound,
  errorHandler,
};
