import { Response, NextFunction } from 'express';
import { User } from '../models/User';
import { signToken } from '../utils/jwt';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { signupSchema, loginSchema } from '../utils/validators';
import { AuthRequest } from '../middleware/auth';

const sendTokenResponse = (user: InstanceType<typeof User>, statusCode: number, res: Response): void => {
  const token = signToken({ id: user._id.toString(), role: user.role });

  const isProd = process.env.NODE_ENV === 'production';
  const cookieExpiresIn = parseInt(process.env.JWT_COOKIE_EXPIRES_IN || '7', 10);

  res.cookie('jwt', token, {
    expires: new Date(Date.now() + cookieExpiresIn * 24 * 60 * 60 * 1000),
    httpOnly: true,
    // In dev: 'lax' allows cross-origin cookies on same machine
    // In prod: 'none' requires secure:true (HTTPS)
    sameSite: isProd ? 'none' : 'lax',
    secure: isProd,
  });

  const userObj = user.toJSON();
  sendSuccess(res, { user: userObj, token }, statusCode);
};

export const signup = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { name, email, password, role } = parsed.data;

  const existing = await User.findOne({ email });
  if (existing) return next(new AppError('An account with this email already exists.', 409));

  const user = await User.create({ name, email, password, role: role || 'USER' });
  sendTokenResponse(user, 201, res);
});

export const login = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { email, password } = parsed.data;

  const user = await User.findOne({ email }).select('+password');
  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Invalid email or password.', 401));
  }

  sendTokenResponse(user, 200, res);
});

export const getMe = catchAsync(async (req: AuthRequest, res: Response) => {
  const user = await User.findById(req.user!._id);
  sendSuccess(res, { user });
});

export const logout = (_req: AuthRequest, res: Response): void => {
  res.cookie('jwt', '', {
    httpOnly: true,
    expires: new Date(0),
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
  sendSuccess(res, null, 200);
};
