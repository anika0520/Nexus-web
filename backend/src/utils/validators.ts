import { z } from 'zod';

// Auth
export const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(80),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'USER']).optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Projects
export const createProjectSchema = z.object({
  title: z.string().min(2).max(120),
  description: z.string().max(1000).optional().default(''),
  status: z.enum(['active', 'on_hold', 'completed', 'archived']).optional(),
  color: z.string().optional(),
  // Accept both full ISO datetime AND plain date strings like "2025-08-01"
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  memberIds: z.array(z.string()).optional().default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

// Tasks — use z.string().optional() for dates so both ISO and YYYY-MM-DD are accepted
export const createTaskSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  dueDate: z.string().optional(),   // accept any date string format
  projectId: z.string().min(1, 'Project is required'),
  assigneeId: z.string().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().omit({ projectId: true });

export const patchTaskStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'review', 'done']),
  order: z.number().optional(),
});

// Query params
export const paginationSchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(500).default(20),
  search: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  assigneeId: z.string().optional(),
  projectId: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type PatchTaskStatusInput = z.infer<typeof patchTaskStatusSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
