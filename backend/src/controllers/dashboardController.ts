import { Response } from 'express';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { User } from '../models/User';
import { catchAsync } from '../utils/catchAsync';
import { sendSuccess } from '../utils/response';
import { AuthRequest } from '../middleware/auth';

export const getDashboardStats = catchAsync(async (req: AuthRequest, res: Response) => {
  const isAdmin = req.user!.role === 'ADMIN';
  const userId = req.user!._id;

  let projectFilter: Record<string, unknown> = {};
  let taskFilter: Record<string, unknown> = {};

  if (!isAdmin) {
    projectFilter = { $or: [{ ownerId: userId }, { memberIds: userId }] };
    const userProjects = await Project.find(projectFilter).select('_id').lean();
    const projectIds = userProjects.map((p) => p._id);
    taskFilter = { $or: [{ projectId: { $in: projectIds } }, { assigneeId: userId }, { createdById: userId }] };
  }

  const now = new Date();

  const [
    totalProjects,
    activeProjects,
    completedProjects,
    totalTasks,
    tasksByStatus,
    overdueCount,
    totalUsers,
    recentProjects,
    upcomingTasks,
  ] = await Promise.all([
    Project.countDocuments(projectFilter),
    Project.countDocuments({ ...projectFilter, status: 'active' }),
    Project.countDocuments({ ...projectFilter, status: 'completed' }),
    Task.countDocuments(taskFilter),
    Task.aggregate([
      { $match: taskFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Task.countDocuments({
      ...taskFilter,
      status: { $ne: 'done' },
      dueDate: { $lt: now, $exists: true },
    }),
    isAdmin ? User.countDocuments() : Promise.resolve(0),
    Project.find(projectFilter)
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('ownerId', 'name email avatarColor')
      .populate('memberIds', 'name email avatarColor')
      .lean(),
    Task.find({ ...taskFilter, status: { $ne: 'done' } })
      .sort({ dueDate: 1 })
      .limit(10)
      .populate('assigneeId', 'name email avatarColor')
      .populate('projectId', 'title color status')
      .lean(),
  ]);

  const statusMap: Record<string, number> = {
    todo: 0,
    in_progress: 0,
    review: 0,
    done: 0,
  };
  (tasksByStatus as { _id: string; count: number }[]).forEach((s) => {
    if (s._id) statusMap[s._id] = s.count;
  });

  sendSuccess(res, {
    projects: {
      total: totalProjects,
      active: activeProjects,
      completed: completedProjects,
    },
    tasks: {
      total: totalTasks,
      todo: statusMap['todo'],
      inProgress: statusMap['in_progress'],
      review: statusMap['review'],
      done: statusMap['done'],
      overdue: overdueCount,
    },
    ...(isAdmin && { users: { total: totalUsers } }),
    recentProjects,
    upcomingTasks,
  });
});
