const BASE_URL = (import.meta.env.VITE_API_URL as string | undefined) || 'https://nexus-017a.onrender.com/api/v1';

interface ApiOptions extends RequestInit {
  data?: unknown;
}

export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const { data, headers, ...rest } = options;
  const token = localStorage.getItem('nexus-token');

  const config: RequestInit = {
    ...rest,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  };

  if (data !== undefined) {
    config.body = JSON.stringify(data);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, config);
  } catch {
    throw new ApiError(
      'Cannot reach the server. Make sure the backend is running on port 5000.',
      0
    );
  }

  if (res.status === 204) return null as T;

  let json: { success: boolean; message?: string; data?: unknown };
  try {
    json = await res.json();
  } catch {
    throw new ApiError('Server returned an invalid response.', res.status);
  }

  if (!res.ok) {
    throw new ApiError(json.message || 'Something went wrong', res.status);
  }

  return json as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  signup: (body: { name: string; email: string; password: string; role?: string }) =>
    request<{ success: boolean; data: { user: ApiUser; token: string } }>('/auth/signup', {
      method: 'POST',
      data: body,
    }),
  login: (body: { email: string; password: string }) =>
    request<{ success: boolean; data: { user: ApiUser; token: string } }>('/auth/login', {
      method: 'POST',
      data: body,
    }),
  me: () => request<{ success: boolean; data: { user: ApiUser } }>('/auth/me'),
  logout: () => request<null>('/auth/logout', { method: 'POST' }),
};

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return request<ProjectsResponse>(`/projects${qs}`);
  },
  get: (id: string) => request<{ success: boolean; data: ApiProject }>(`/projects/${id}`),
  create: (body: Partial<ApiProject> & { memberIds?: string[] }) =>
    request<{ success: boolean; data: ApiProject }>('/projects', { method: 'POST', data: body }),
  update: (id: string, body: Partial<ApiProject> & { memberIds?: string[] }) =>
    request<{ success: boolean; data: ApiProject }>(`/projects/${id}`, { method: 'PUT', data: body }),
  delete: (id: string) => request<null>(`/projects/${id}`, { method: 'DELETE' }),
  tasks: (projectId: string, params?: Record<string, string | number>) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return request<TasksResponse>(`/projects/${projectId}/tasks${qs}`);
  },
};

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: Record<string, string | number>) => {
    const qs = params ? `?${new URLSearchParams(params as Record<string, string>)}` : '';
    return request<TasksResponse>(`/tasks${qs}`);
  },
  get: (id: string) => request<{ success: boolean; data: ApiTask }>(`/tasks/${id}`),
  create: (body: { title: string; projectId: string; [key: string]: unknown }) =>
    request<{ success: boolean; data: ApiTask }>('/tasks', { method: 'POST', data: body }),
  update: (id: string, body: Partial<ApiTask> & { [key: string]: unknown }) =>
    request<{ success: boolean; data: ApiTask }>(`/tasks/${id}`, { method: 'PUT', data: body }),
  delete: (id: string) => request<null>(`/tasks/${id}`, { method: 'DELETE' }),
  patchStatus: (id: string, status: string, order?: number) =>
    request<{ success: boolean; data: ApiTask }>(`/tasks/${id}/status`, {
      method: 'PATCH',
      data: { status, ...(order !== undefined && { order }) },
    }),
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => request<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),
};

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  // Admin only — full user list
  list: () => request<{ success: boolean; data: ApiUser[] }>('/users'),
  // All authenticated users — for task/project assignment
  assignable: () => request<{ success: boolean; data: ApiUser[] }>('/users/assignable'),
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface ApiUser {
  _id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'USER';
  avatarColor: string;
  createdAt: string;
}

export interface ApiProject {
  _id: string;
  title: string;
  description: string;
  status: 'active' | 'on_hold' | 'completed' | 'archived';
  color: string;
  startDate?: string;
  endDate?: string;
  ownerId: ApiUser | string;
  memberIds: (ApiUser | string)[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiTask {
  _id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
  projectId: ApiProject | string;
  assigneeId?: ApiUser | string;
  createdById: ApiUser | string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  projects: { total: number; active: number; completed: number };
  tasks: {
    total: number;
    todo: number;
    inProgress: number;
    review: number;
    done: number;
    overdue: number;
  };
  users?: { total: number };
  recentProjects: ApiProject[];
  upcomingTasks: ApiTask[];
}

export interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ProjectsResponse {
  success: boolean;
  data: ApiProject[];
  pagination: Pagination;
}

export interface TasksResponse {
  success: boolean;
  data: ApiTask[];
  pagination: Pagination;
}
