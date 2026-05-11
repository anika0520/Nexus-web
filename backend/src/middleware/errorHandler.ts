import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import mongoose from 'mongoose';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { ZodError } from 'zod';

const handleCastError = (err: mongoose.Error.CastError): AppError =>
  new AppError(`Invalid ${err.path}: ${err.value}`, 400);

const handleDuplicateKeyError = (err: { keyValue: Record<string, string> }): AppError => {
  const field = Object.keys(err.keyValue)[0];
  return new AppError(`${field.charAt(0).toUpperCase() + field.slice(1)} already exists.`, 409);
};

const handleValidationError = (err: mongoose.Error.ValidationError): AppError => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join('. ')}`, 400);
};

const handleJWTError = (): AppError =>
  new AppError('Invalid token. Please log in again.', 401);

const handleJWTExpiredError = (): AppError =>
  new AppError('Your token has expired. Please log in again.', 401);

const handleZodError = (err: ZodError): AppError => {
  const messages = err.errors.map((e) => `${e.path.join('.')}: ${e.message}`);
  return new AppError(`Validation error: ${messages.join('; ')}`, 400);
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const errorHandler = (err: unknown, _req: Request, res: Response, _next: NextFunction): void => {
  let error: AppError;

  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof mongoose.Error.CastError) {
    error = handleCastError(err);
  } else if (err instanceof mongoose.Error.ValidationError) {
    error = handleValidationError(err);
  } else if ((err as { code?: number }).code === 11000) {
    error = handleDuplicateKeyError(err as { keyValue: Record<string, string> });
  } else if (err instanceof JsonWebTokenError) {
    error = handleJWTError();
  } else if (err instanceof TokenExpiredError) {
    error = handleJWTExpiredError();
  } else if (err instanceof ZodError) {
    error = handleZodError(err);
  } else {
    // Unknown error
    if (process.env.NODE_ENV === 'development') {
      console.error('Unhandled error:', err);
    }
    error = new AppError('Something went wrong. Please try again later.', 500);
  }

  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: (err as Error).stack }),
  });
};

export const notFound = (req: Request, _res: Response, next: NextFunction): void => {
  next(new AppError(`Cannot ${req.method} ${req.originalUrl}`, 404));
};
