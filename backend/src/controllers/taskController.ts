import { Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Task } from '../models/Task';
import { Project } from '../models/Project';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import {
  createTaskSchema,
  updateTaskSchema,
  patchTaskStatusSchema,
  paginationSchema,
} from '../utils/validators';
import { AuthRequest } from '../middleware/auth';

const parseDate = (d?: string): Date | undefined => {
  if (!d) return undefined;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? undefined : parsed;
};

export const getTasks = catchAsync(async (req: AuthRequest, res: Response) => {
  const query = paginationSchema.parse(req.query);
  const { page, limit, search, status, priority, assigneeId, projectId, sortBy, sortOrder } = query;

  // Build base filter
  const filter: Record<string, unknown> = {};

  // For non-admins: scope to projects they own/are member of, OR tasks assigned to them, OR tasks they created
  if (req.user!.role !== 'ADMIN') {
    const userProjects = await Project.find({
      $or: [{ ownerId: req.user!._id }, { memberIds: req.user!._id }],
    }).select('_id');
    const projectIds = userProjects.map((p) => p._id);

    // Use $and to combine scope filter with any other $or filters safely
    filter.$and = [
      { $or: [{ projectId: { $in: projectIds } }, { assigneeId: req.user!._id }, { createdById: req.user!._id }] },
    ];
  }

  if (status && status !== 'all') filter.status = status;
  if (priority && priority !== 'all') filter.priority = priority;
  if (assigneeId && mongoose.isValidObjectId(assigneeId)) filter.assigneeId = assigneeId;
  if (projectId && mongoose.isValidObjectId(projectId)) filter.projectId = projectId;

  // Use regex search instead of $text to avoid index requirement and $or conflicts
  if (search && search.trim()) {
    const regex = new RegExp(search.trim(), 'i');
    const searchCondition = { $or: [{ title: regex }, { description: regex }] };
    if (filter.$and) {
      (filter.$and as unknown[]).push(searchCondition);
    } else {
      filter.$and = [searchCondition];
    }
  }

  const sortField = sortBy || 'createdAt';
  const sortDir = sortOrder === 'asc' ? 1 : -1;

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .populate('assigneeId', 'name email avatarColor')
      .populate('createdById', 'name email avatarColor')
      .populate('projectId', 'title color status')
      .sort({ [sortField]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Task.countDocuments(filter),
  ]);

  sendSuccess(res, tasks, 200, {
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
});

export const getTask = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const task = await Task.findById(req.params.id)
    .populate('assigneeId', 'name email avatarColor')
    .populate('createdById', 'name email avatarColor')
    .populate('projectId', 'title color status')
    .lean();

  if (!task) return next(new AppError('Task not found.', 404));
  sendSuccess(res, task);
});

export const createTask = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const parsed = createTaskSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { title, description, status, priority, dueDate, projectId, assigneeId } = parsed.data;

  if (!mongoose.isValidObjectId(projectId)) {
    return next(new AppError('Invalid project ID.', 400));
  }

  const project = await Project.findById(projectId);
  if (!project) return next(new AppError('Project not found.', 404));

  const count = await Task.countDocuments({ projectId });

  const task = await Task.create({
    title,
    description: description || '',
    status: status || 'todo',
    priority: priority || 'medium',
    dueDate: parseDate(dueDate),
    projectId,
    assigneeId: assigneeId && mongoose.isValidObjectId(assigneeId) ? assigneeId : undefined,
    createdById: req.user!._id,
    order: count,
  });

  const populated = await Task.findById(task._id)
    .populate('assigneeId', 'name email avatarColor')
    .populate('createdById', 'name email avatarColor')
    .populate('projectId', 'title color status')
    .lean();

  sendSuccess(res, populated, 201);
});

export const updateTask = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found.', 404));

  const parsed = updateTaskSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { dueDate, assigneeId, ...rest } = parsed.data;
  const updateData: Record<string, unknown> = { ...rest };

  const parsedDate = parseDate(dueDate);
  if (parsedDate) updateData.dueDate = parsedDate;

  if (assigneeId !== undefined) {
    updateData.assigneeId =
      assigneeId && mongoose.isValidObjectId(assigneeId) ? assigneeId : null;
  }

  const updated = await Task.findByIdAndUpdate(req.params.id, updateData, {
    new: true,
    runValidators: true,
  })
    .populate('assigneeId', 'name email avatarColor')
    .populate('createdById', 'name email avatarColor')
    .populate('projectId', 'title color status')
    .lean();

  sendSuccess(res, updated);
});

export const deleteTask = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found.', 404));

  const isCreator = task.createdById.toString() === req.user!._id.toString();
  const isAdmin = req.user!.role === 'ADMIN';
  if (!isCreator && !isAdmin) {
    return next(new AppError('You do not have permission to delete this task.', 403));
  }

  await Task.findByIdAndDelete(req.params.id);
  res.status(204).send();
});

export const patchTaskStatus = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const task = await Task.findById(req.params.id);
  if (!task) return next(new AppError('Task not found.', 404));

  const parsed = patchTaskStatusSchema.safeParse(req.body);
  if (!parsed.success) return next(new AppError(parsed.error.errors[0].message, 400));

  const { status, order } = parsed.data;

  const updated = await Task.findByIdAndUpdate(
    req.params.id,
    { status, ...(order !== undefined && { order }) },
    { new: true, runValidators: true }
  )
    .populate('assigneeId', 'name email avatarColor')
    .populate('createdById', 'name email avatarColor')
    .populate('projectId', 'title color status')
    .lean();

  sendSuccess(res, updated);
});
