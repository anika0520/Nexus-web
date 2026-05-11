# 🚀 Project Nexus — Multi-User Project Management Dashboard

A full-stack **Mini CRM / Project Management** application with clean separation between **backend** (Node.js + Express + MongoDB) and **frontend** (React + Vite SPA + TanStack Router). Features JWT authentication, role-based access control, drag-and-drop Kanban boards, and real-time task management.

---
Live- https://nexusweb-eight.vercel.app

## 📁 Project Structure

```
nexus-final/
├── backend/                  # Node.js + Express REST API
│   ├── src/
│   │   ├── config/           # Database connection, seeder
│   │   ├── controllers/      # Route handlers (auth, tasks, projects, dashboard, users)
│   │   ├── middleware/       # JWT auth guard, error handler
│   │   ├── models/           # Mongoose schemas (User, Project, Task)
│   │   ├── routes/           # Express routers
│   │   └── utils/            # AppError, catchAsync, JWT helpers, Zod validators
│   ├── .env.example
│   └── package.json
│
├── frontend/                 # React SPA (Vite + TanStack Router)
│   ├── src/
│   │   ├── components/       # Reusable UI (TaskModal, ProjectModal, Sidebar, etc.)
│   │   ├── hooks/            # Custom React hooks
│   │   ├── lib/              # API client, Zustand store, types, format utils
│   │   └── routes/           # File-based routing (dashboard, tasks, projects, team)
│   ├── index.html            # SPA entry point
│   ├── vercel.json           # Vercel SPA routing config
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## ✨ Features

- 🔐 **Authentication** — Signup, login, logout with JWT
- 🏠 **Dashboard** — Stats, recent projects, upcoming tasks
- 📋 **Tasks** — Full CRUD with Kanban (drag & drop) and Table views
- 📁 **Projects** — Create, update, delete with color coding and member management
- 👥 **Team** — View team members; Admin can manage roles
- 🔍 **Search & Filter** — Filter tasks by project, assignee, priority
- 📄 **Pagination** — Server-side pagination on all list endpoints
- 🛡️ **Role-Based Access** — `ADMIN` sees all; `USER` sees only their data
- 🎨 **Dark/Light Theme** — System-aware with manual toggle
- 📱 **Responsive Design** — Mobile-friendly with bottom nav and FAB

---

## 🛠️ Tech Stack

| Layer       | Technology                                               |
|-------------|----------------------------------------------------------|
| Frontend    | React 19, Vite, TanStack Router, Zustand, react-hook-form |
| UI          | Tailwind CSS, shadcn/ui, Radix UI, Framer Motion        |
| Drag & Drop | @dnd-kit/core                                            |
| Backend     | Node.js, Express, TypeScript                             |
| Database    | MongoDB with Mongoose ODM                                |
| Auth        | JWT (jsonwebtoken), bcryptjs                             |
| Validation  | Zod (frontend + backend)                                 |
| Security    | Helmet, CORS, express-rate-limit, express-mongo-sanitize |

---

## ⚡ Quick Start (Local)

### Prerequisites
- **Node.js** ≥ 18 · **MongoDB** running locally · **npm** ≥ 9

### 1. Backend

```bash
cd backend
cp .env.example .env   # fill in your values
npm install
npm run dev            # http://localhost:5000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env   # set VITE_API_URL
npm install
npm run dev            # http://localhost:5173
```

**Default credentials** (auto-seeded):
```
Admin:  admin@nexus.dev  /  Admin123
User:   alice@nexus.dev  /  User123!
```

---

## 🌐 API Reference

Base URL: `https://nexus-017a.onrender.com/api/v1`

### Auth
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /auth/signup | Register | No |
| POST | /auth/login | Login + JWT | No |
| POST | /auth/logout | Logout | Yes |
| GET  | /auth/me | Current user | Yes |

### Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /projects | List (paginated) | Yes |
| POST | /projects | Create | Yes |
| GET | /projects/:id | Get one | Yes |
| PUT | /projects/:id | Update | Yes (owner) |
| DELETE | /projects/:id | Delete | Yes (owner/admin) |
| GET | /projects/:id/tasks | List tasks | Yes |

### Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /tasks | List (paginated) | Yes |
| POST | /tasks | Create | Yes |
| GET | /tasks/:id | Get one | Yes |
| PUT | /tasks/:id | Update | Yes |
| DELETE | /tasks/:id | Delete | Yes (creator/admin) |
| PATCH | /tasks/:id/status | Update status | Yes |

### Other
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /dashboard/stats | Stats + summaries | Yes |
| GET | /users | All users | Admin only |
| GET | /users/assignable | Users for assignment | Yes |

---

## 🗄️ Database Schema

**Users:** `_id, name, email, password (bcrypt), role (ADMIN|USER), avatarColor`

**Projects:** `_id, title, description, status, color, startDate, endDate, ownerId → User, memberIds → [User]`

**Tasks:** `_id, title, description, status, priority, dueDate, projectId → Project, assigneeId → User, createdById → User, order`

Compound indexes on `(projectId, status)`, `(assigneeId, status)`, `(dueDate, status)`.

---

## 📦 Scripts

### Backend (`cd backend`)
```bash
npm run dev     # dev server with hot reload
npm run build   # compile TypeScript
npm start       # run production build
```

### Frontend (`cd frontend`)
```bash
npm run dev     # Vite dev server → http://localhost:5173
npm run build   # production build → dist/
npm run preview # preview production build
```


---

## 📄 License

MIT
