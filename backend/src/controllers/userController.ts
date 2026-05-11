import { Response } from 'express';
import { User } from '../models/User';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

// Admin only: list all users
export const getUsers = catchAsync(async (_req: AuthRequest, res: Response) => {
  const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();
  sendSuccess(res, users);
});

// Any authenticated user: list users for assignment purposes (limited fields)
export const getUsersForAssignment = catchAsync(async (_req: AuthRequest, res: Response) => {
  const users = await User.find().select('name email avatarColor role').sort({ name: 1 }).lean();
  sendSuccess(res, users);
});
