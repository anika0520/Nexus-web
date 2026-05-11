import { Response } from 'express';

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: { pagination?: PaginationMeta; [key: string]: unknown }
): void => {
  res.status(statusCode).json({
    success: true,
    data,
    ...(meta || {}),
  });
};

export const sendError = (res: Response, message: string, statusCode = 400): void => {
  res.status(statusCode).json({
    success: false,
    message,
  });
};
