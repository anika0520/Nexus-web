import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { createProjectSchema, updateProjectSchema, paginationSchema } from '../utils/validators';
import { AuthRequest } from '../middleware/auth';

const parseDate = (d?: string): Date | undefined => {
  if (!d) return undefined;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

export const getProjects = catchAsync(async (req: AuthRequest, res: Response) => {
  const query = paginationSchema.parse(req.query);
  const { page, limit, search, status, sortBy, sortOrder } = query;

  const filter: Record<string, unknown> = {};

  if (req.user!.role !== 'ADMIN') {
    filter.$or = [{ ownerId: req.user!._id }, { memberIds: req.user!._id }];
  }

  if (status && status !== 'all') filter.status = status;

  // Regex search avoids $text index requirement and $or conflicts
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    const searchCond = { $or: [{ title: regex }, { description: regex }] };
    if (filter.$or) {
      // Wrap existing $or and search in $and
      filter.$and = [{ $or: filter.$or as unknown[] }, searchCond];
      delete filter.$or;
    } else {
      Object.assign(filter, searchCond);
    }
  }

  const sortField = sortBy || 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const [projects, total] = await Promise.all([
    Project.find(filter)
      .populate('ownerId', 'name email avatarColor role')
      .populate('memberIds', 'name email avatarColor role')
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Project.countDocuments(filter),
  ]);

  sendSuccess(res, projects, 200, {
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const getProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const project = await Project.findById(req.params.id)
    .populate('ownerId', 'name email avatarColor role')
    .populate('memberIds', 'name email avatarColor role')
    .lean();

  if (!project) return next(new AppError('Project not found.', 404));

  // Access check for non-admins
  if (req.user!.role !== 'ADMIN') {
    const p = project as Record<string, unknown>;
    const ownerStr = JSON.stringify(p['ownerId']);
    const membersStr = JSON.stringify(p['memberIds'] || []);
    const uid = req.user!._id.toString();
    if (!ownerStr.includes(uid) && !membersStr.includes(uid)) {
      return next(new AppError('You do not have access to this project.', 403));
    }
  }

  sendSuccess(res, project);
});

export const createProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const parsed = createProjectSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { title, description, status, color, startDate, endDate, memberIds } = parsed.data;

  const validMemberIds = (memberIds || [])
    .filter((id) => mongoose.isValidObjectId(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const project = await Project.create({
    title,
    description: description || '',
    status: status || 'active',
    color,
    startDate: parseDate(startDate),
    endDate: parseDate(endDate),
    ownerId: req.user!._id,
    memberIds: validMemberIds,
  });

  const populated = await Project.findById(project._id)
    .populate('ownerId', 'name email avatarColor role')
    .populate('memberIds', 'name email avatarColor role')
    .lean();

  sendSuccess(res, populated, 201);
});

export const updateProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (req.user!.role !== 'ADMIN' && project.ownerId.toString() !== req.user!._id.toString()) {
    return next(new AppError('Only the project owner or admin can update this project.', 403));
  }

  const parsed = updateProjectSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { memberIds, startDate, endDate, ...rest } = parsed.data;

  const updateData: Record<string, unknown> = { ...rest };
  if (memberIds !== undefined) {
    updateData.memberIds = memberIds
      .filter((id) => mongoose.isValidObjectId(id))
      .map((id) => new mongoose.Types.ObjectId(id));
  }
  const ps = parseDate(startDate);
  const pe = parseDate(endDate);
  if (ps) updateData.startDate = ps;
  if (pe) updateData.endDate = pe;

  const updated = await Project.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('ownerId', 'name email avatarColor role')
    .populate('memberIds', 'name email avatarColor role')
    .lean();

  sendSuccess(res, updated);
});

export const deleteProject = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const project = await Project.findById(req.params.id);
  if (!project) return next(new AppError('Project not found.', 404));

  if (req.user!.role !== 'ADMIN' && project.ownerId.toString() !== req.user!._id.toString()) {
    return next(new AppError('Only the project owner or admin can delete this project.', 403));
  }

  await Promise.all([
    Project.findByIdAndDelete(req.params.id),
    Task.deleteMany({ projectId: req.params.id }),
  ]);

  res.status(204).send();
});

export const getProjectTasks = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const project = await Project.findById(req.params.projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  const query = paginationSchema.parse(req.query);
  const { page, limit, status, priority } = query;

  const filter: Record<string, unknown> = { projectId: req.params.projectId };
  if (status && status !== 'all') filter.status = status;
  if (priority && priority !== 'all') filter.priority = priority;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assigneeId', 'name email avatarColor')
      .populate('createdById', 'name email avatarColor')
      .sort({ order: 1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  sendSuccess(res, tasks, 200, {
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});
