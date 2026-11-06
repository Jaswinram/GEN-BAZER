const errorHandler = (err, req, res, next) => {
  // Always log error internally for observability
  console.error('[Error Details]:', err.message || err);

  // Handle Multer upload errors cleanly
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds maximum permitted limit (5 MB).',
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  }

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  // In production, mask internal server error details to prevent information disclosure
  const isProduction = process.env.NODE_ENV === 'production';
  const clientMessage = isProduction && statusCode === 500
    ? 'An unexpected server error occurred. Please try again later.'
    : (err.message || 'Internal Server Error');

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
    errors: isProduction ? null : (err.errors || null),
  });
};

module.exports = errorHandler;

