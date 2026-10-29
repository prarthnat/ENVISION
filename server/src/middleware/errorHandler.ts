import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  fields?: Record<string, string>;
}

/**
 * Creates a structured error object for consistent API responses.
 */
export function createError(
  message: string,
  statusCode: number,
  code?: string,
  fields?: Record<string, string>
): AppError {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  error.fields = fields;
  return error;
}

/**
 * Global error handler middleware.
 * Returns a consistent { error: { message, code?, fields? } } shape.
 * Stack traces are never sent to the client.
 */
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === 'production';

  // Log the full error on the server
  if (statusCode >= 500) {
    console.error('[Error]', err.message, err.stack);
  }

  const responseBody: {
    error: { message: string; code?: string; fields?: Record<string, string> };
  } = {
    error: {
      message:
        statusCode >= 500 && isProduction ? 'Internal server error' : err.message,
      ...(err.code && { code: err.code }),
      ...(err.fields && { fields: err.fields }),
    },
  };

  res.status(statusCode).json(responseBody);
}

/**
 * 404 handler — must be registered AFTER all routes.
 */
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    error: {
      message: `Route ${req.method} ${req.path} not found`,
      code: 'ROUTE_NOT_FOUND',
    },
  });
}
