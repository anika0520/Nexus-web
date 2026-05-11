<div align="center">

# ⚡ Project Nexus

### Multi-User Project Management Dashboard

*Built exclusively for ❤️ [RefreshKid](https://refreshkid.com/)*

[![Live Demo](https://img.shields.io/badge/Live%20Demo-nexusweb--eight.vercel.app-6366f1?style=for-the-badge&logo=vercel)](https://nexusweb-eight.vercel.app)
---

A full-stack **Mini CRM & Project Management** platform with JWT authentication,
role-based access, drag-and-drop Kanban boards, and real-time task tracking —
cleanly separated into `backend/` and `frontend/`.

</div>

---

## 📁 Project Structure

```
nexus/
│
├── backend/                        # Node.js + Express REST API
│   ├── src/
│   │   ├── config/                 # DB connection & data seeder
│   │   ├── controllers/            # auth · tasks · projects · dashboard · users
│   │   ├── middleware/             # JWT auth guard · global error handler
│   │   ├── models/                 # Mongoose schemas (User, Project, Task)
│   │   ├── routes/                 # Express routers
│   │   └── utils/                  # AppError · catchAsync · JWT · Zod validators
│   ├── .env.example
│   └── package.json
│
├── frontend/                       # React SPA — Vite + TanStack Router
│   ├── src/
│   │   ├── components/             # TaskModal · ProjectModal · Sidebar · FAB …
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # API client · Zustand store · types · utils
│   │   └── routes/                 # File-based pages (dashboard · tasks · projects · team)
│   ├── index.html                  # SPA entry point
│   ├── vercel.json                 # SPA routing rewrites for Vercel
│   ├── vite.config.ts
│   ├── tsconfig.json
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## ✨ Features

| | Feature | Description |
|---|---|---|
| 🔐 | **Authentication** | Signup · Login · Logout with JWT |
| 🏠 | **Dashboard** | Live stats, recent projects, upcoming tasks |
| 📋 | **Task Management** | Full CRUD · Kanban board (drag & drop) · Table view |
| 📁 | **Projects** | Create · Update · Delete · Color coding · Members |
| 👥 | **Team** | Member directory · Admin role management |
| 🔍 | **Search & Filter** | Filter by project · assignee · priority · keyword |
| 📄 | **Pagination** | Server-side pagination across all list endpoints |
| 🛡️ | **Role-Based Access** | `ADMIN` sees all · `USER` scoped to their data |
| 🎨 | **Theme** | Dark / Light · System-aware with manual toggle |
| 📱 | **Responsive** | Mobile-friendly with bottom nav and floating action button |

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| React 19 + Vite | UI framework & build tool |
| TanStack Router | File-based client-side routing |
| Zustand | Global auth & user state |
| react-hook-form + Zod | Form handling & validation |
| Tailwind CSS + shadcn/ui | Styling & component library |
| Radix UI + Framer Motion | Accessible primitives & animations |
| @dnd-kit | Drag-and-drop Kanban board |

### Backend
| Technology | Purpose |
|---|---|
| Node.js + Express + TypeScript | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Authentication & password hashing |
| Zod | Request validation (body + query) |
| Helmet + CORS + express-rate-limit | Security hardening |
| express-mongo-sanitize | NoSQL injection prevention |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│              frontend/  (React + Vite SPA)           │
│                                                      │
│   TanStack Router  ──►  Pages & Layouts              │
│   Zustand Store    ──►  Auth & User State            │
│   API Client       ──►  Fetch + JWT Authorization    │
└───────────────────────────┬──────────────────────────┘
                            │  HTTPS · JWT Bearer Token
┌───────────────────────────▼──────────────────────────┐
│              backend/  (Express + Node.js + TS)      │
│                                                      │
│   Routes  ──►  Auth Middleware  ──►  Controllers     │
│   Zod validation on every request (body + query)    │
│   AppError + catchAsync  ──►  Unified error handler  │
│   Rate limiting · Helmet · Mongo sanitize            │
└───────────────────────────┬──────────────────────────┘
                            │  Mongoose ODM
┌───────────────────────────▼──────────────────────────┐
│                       MongoDB                        │
│                                                      │
│   Collections:  users  ·  projects  ·  tasks         │
│   Compound indexes for fast filtered queries         │
│   Proper relationships & referential integrity       │
└──────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start (Local)

### Prerequisites
> Node.js ≥ 18 · MongoDB running locally · npm ≥ 9

### 1. Clone

```bash
git clone https://github.com/anika0520/Nexus-web.git
cd nexus
```

### 2. Backend

```bash
cd backend
cp .env.example .env
```

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/project-nexus
JWT_SECRET=your-secret-here
JWT_EXPIRES_IN=7d
JWT_COOKIE_EXPIRES_IN=7
CLIENT_URL=http://localhost:5173
RATE_LIMIT_MAX=200
```

```bash
npm install
npm run dev        # → http://localhost:5000
```

### 3. Frontend

```bash
cd ../frontend
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:5000/api/v1
```

```bash
npm install
npm run dev        # → http://localhost:5173
```

### 4. Default Credentials *(auto-seeded on first run)*

```
👑 Admin    admin@nexus.com   /   Admin123
👤 User     alice@nexus.dev   /   User123
```

---

## 🌐 API Reference

**Base URL:** `https://nexus-017a.onrender.com/api/v1`

### 🔐 Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `POST` | `/auth/signup` | Register new user | — |
| `POST` | `/auth/login` | Login & receive JWT | — |
| `POST` | `/auth/logout` | Logout | ✓ |
| `GET` | `/auth/me` | Get current user | ✓ |

### 📁 Projects
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/projects` | List projects (paginated) | ✓ |
| `POST` | `/projects` | Create project | ✓ |
| `GET` | `/projects/:id` | Get single project | ✓ |
| `PUT` | `/projects/:id` | Update project | ✓ owner |
| `DELETE` | `/projects/:id` | Delete project | ✓ owner/admin |
| `GET` | `/projects/:id/tasks` | List tasks in project | ✓ |

### 📋 Tasks
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/tasks` | List tasks (paginated) | ✓ |
| `POST` | `/tasks` | Create task | ✓ |
| `GET` | `/tasks/:id` | Get single task | ✓ |
| `PUT` | `/tasks/:id` | Update task | ✓ |
| `DELETE` | `/tasks/:id` | Delete task | ✓ creator/admin |
| `PATCH` | `/tasks/:id/status` | Update status & order | ✓ |

### 📊 Dashboard & Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|:----:|
| `GET` | `/dashboard/stats` | Stats + summaries | ✓ |
| `GET` | `/users` | List all users | ✓ admin |
| `GET` | `/users/assignable` | Users for task assignment | ✓ |

---

## 🗄️ Database Schema

### Users
```
_id · name · email (unique) · password (bcrypt) · role (ADMIN|USER) · avatarColor
```

### Projects
```
_id · title · description · status (active|on_hold|completed|archived)
color · startDate · endDate · ownerId → User · memberIds → [User]
```
*Indexes: `(ownerId, status)` · text index on `(title, description)`*

### Tasks
```
_id · title · description · status (todo|in_progress|review|done)
priority (low|medium|high|urgent) · dueDate · order
projectId → Project · assigneeId → User · createdById → User
```
*Indexes: `(projectId, status)` · `(assigneeId, status)` · `(dueDate, status)`*

---

## 📦 Scripts

### Backend
```bash
npm run dev      # Dev server with hot reload (tsx watch)
npm run build    # Compile TypeScript → dist/
npm start        # Run compiled production build
npm run lint     # ESLint
```

### Frontend
```bash
npm run dev      # Vite dev server → http://localhost:5173
npm run build    # Production build → dist/
npm run preview  # Preview production build locally
npm run lint     # ESLint
npm run format   # Prettier
```

<div align="center">

</div>
