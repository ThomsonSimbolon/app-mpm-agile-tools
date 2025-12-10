# 📚 MPM Agile Tools - Dokumentasi Lengkap

> **Versi:** 1.0.0  
> **Tanggal Update:** 10 Desember 2025  
> **Status:** Production Ready

---

## 📋 Daftar Isi

1. [Overview Aplikasi](#1-overview-aplikasi)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Struktur Folder](#3-struktur-folder)
4. [Database Schema](#4-database-schema)
5. [Sistem Role & Hak Akses](#5-sistem-role--hak-akses)
6. [Fitur-Fitur Aplikasi](#6-fitur-fitur-aplikasi)
7. [API Endpoints](#7-api-endpoints)
8. [Konfigurasi](#8-konfigurasi)
9. [Panduan Instalasi](#9-panduan-instalasi)
10. [Panduan Penggunaan](#10-panduan-penggunaan)

---

## 1. Overview Aplikasi

### 1.1 Deskripsi

**MPM Agile Tools** adalah aplikasi manajemen proyek berbasis metodologi Agile yang dirancang untuk membantu tim dalam mengelola proyek, sprint, task, dan kolaborasi tim secara efektif.

### 1.2 Tech Stack

| Layer              | Teknologi                    |
| ------------------ | ---------------------------- |
| **Frontend**       | React 18, Vite, Tailwind CSS |
| **Backend**        | Node.js, Express.js          |
| **Database**       | MySQL dengan Sequelize ORM   |
| **Real-time**      | Socket.IO                    |
| **AI Integration** | Google Gemini AI             |
| **Authentication** | JWT (JSON Web Token)         |
| **File Upload**    | Multer                       |

### 1.3 Fitur Utama

- ✅ Manajemen Proyek
- ✅ Kanban Board
- ✅ Sprint Management
- ✅ Task Management
- ✅ Tim & Organisasi
- ✅ Real-time Notifications (WebSocket)
- ✅ Dashboard & Reporting
- ✅ AI Assistant (Gemini)
- ✅ Activity Logging
- ✅ File Attachments
- ✅ Comments & Collaboration

---

## 2. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND                                    │
│                         (React + Vite + Tailwind)                        │
│                         http://localhost:5173                            │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTP/WebSocket
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              BACKEND                                     │
│                         (Express.js + Socket.IO)                         │
│                         http://localhost:5000                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Routes    │  │ Controllers │  │  Services   │  │ Middleware  │    │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │    MySQL    │ │    Redis    │ │  Gemini AI  │
            │  Database   │ │   (Queue)   │ │    API      │
            └─────────────┘ └─────────────┘ └─────────────┘
```

### 2.1 Flow Request-Response

```
User Action → React Component → Service Layer → API Call
                                                    ↓
                                              Express Router
                                                    ↓
                                              Middleware (Auth, Validation)
                                                    ↓
                                              Controller
                                                    ↓
                                              Model (Sequelize)
                                                    ↓
                                              MySQL Database
                                                    ↓
                                              Response → Frontend
```

---

## 3. Struktur Folder

### 3.1 Backend Structure

```
backend/
├── server.js                 # Entry point
├── package.json
├── .env                      # Environment variables
└── src/
    ├── app.js                # Express app configuration
    ├── config/
    │   ├── auth.js           # JWT configuration
    │   ├── database.js       # Sequelize configuration
    │   ├── gemini.js         # Gemini AI configuration
    │   ├── multer.js         # File upload configuration
    │   └── redis.js          # Redis configuration
    ├── controllers/
    │   ├── activityController.js
    │   ├── aiController.js
    │   ├── attachmentController.js
    │   ├── authController.js
    │   ├── commentController.js
    │   ├── departmentController.js
    │   ├── labelController.js
    │   ├── notificationController.js
    │   ├── projectController.js
    │   ├── sprintController.js
    │   ├── taskController.js
    │   ├── teamController.js
    │   ├── timeLogController.js
    │   └── userController.js
    ├── middleware/
    │   ├── activityLogger.js
    │   ├── aiRateLimiter.js
    │   ├── auth.js
    │   ├── errorHandler.js
    │   ├── roleCheck.js
    │   └── validation.js
    ├── models/
    │   ├── index.js          # Model associations
    │   ├── ActivityLog.js
    │   ├── AiCache.js
    │   ├── AiSetting.js
    │   ├── AiUsageLog.js
    │   ├── Attachment.js
    │   ├── Comment.js
    │   ├── Department.js
    │   ├── Label.js
    │   ├── Notification.js
    │   ├── Project.js
    │   ├── ProjectMember.js
    │   ├── Sprint.js
    │   ├── Task.js
    │   ├── TaskLabel.js
    │   ├── Team.js
    │   ├── TeamMember.js
    │   ├── TimeLog.js
    │   └── User.js
    ├── routes/
    │   ├── index.js          # Route aggregator
    │   ├── activityRoutes.js
    │   ├── aiRoutes.js
    │   ├── attachmentRoutes.js
    │   ├── authRoutes.js
    │   ├── commentRoutes.js
    │   ├── departmentRoutes.js
    │   ├── labelRoutes.js
    │   ├── notificationRoutes.js
    │   ├── projectRoutes.js
    │   ├── sprintRoutes.js
    │   ├── taskRoutes.js
    │   ├── teamRoutes.js
    │   ├── timeLogRoutes.js
    │   └── userRoutes.js
    ├── services/
    │   ├── aiQueueService.js
    │   └── geminiService.js
    └── utils/
        ├── constants.js
        ├── dbSync.js
        └── helpers.js
```

### 3.2 Frontend Structure

```
frontend/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── src/
    ├── main.jsx              # Entry point
    ├── App.jsx               # Main component with routing
    ├── components/
    │   ├── ai/
    │   │   ├── AiButton.jsx
    │   │   ├── AiChatPanel.jsx
    │   │   ├── AiChatPanelStream.jsx
    │   │   ├── AiInsightsPanel.jsx
    │   │   └── AiSuggestionPanel.jsx
    │   ├── auth/
    │   │   └── PrivateRoute.jsx
    │   ├── common/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   └── ...
    │   ├── kanban/
    │   ├── layout/
    │   │   └── Header.jsx
    │   ├── notification/
    │   │   └── NotificationDropdown.jsx
    │   ├── profile/
    │   └── task/
    ├── contexts/
    │   ├── AuthContext.jsx   # Authentication state
    │   └── ThemeContext.jsx  # Theme management
    ├── pages/
    │   ├── AiDashboard.jsx
    │   ├── Dashboard.jsx
    │   ├── KanbanPage.jsx
    │   ├── Login.jsx
    │   ├── Profile.jsx
    │   ├── Projects.jsx
    │   ├── Register.jsx
    │   ├── SprintPage.jsx
    │   └── TeamManagement.jsx
    ├── services/
    │   ├── api.js            # Axios instance
    │   ├── aiService.js
    │   ├── authService.js
    │   ├── commentService.js
    │   ├── projectService.js
    │   ├── sprintService.js
    │   ├── taskService.js
    │   ├── teamService.js
    │   └── userService.js
    └── styles/
        └── index.css
```

---

## 4. Database Schema

### 4.1 Entity Relationship Diagram

```
┌─────────────┐     ┌─────────────────┐     ┌─────────────┐
│    Users    │────<│  ProjectMembers │>────│   Projects  │
└─────────────┘     └─────────────────┘     └─────────────┘
       │                                           │
       │                                           │
       ▼                                           ▼
┌─────────────┐                            ┌─────────────┐
│ TeamMembers │>───────────────────────────│   Sprints   │
└─────────────┘                            └─────────────┘
       │                                           │
       ▼                                           │
┌─────────────┐                                    │
│    Teams    │                                    │
└─────────────┘                                    │
       │                                           ▼
       ▼                                    ┌─────────────┐
┌─────────────┐                            │    Tasks    │
│ Departments │                            └─────────────┘
└─────────────┘                                    │
                                    ┌──────────────┼──────────────┐
                                    ▼              ▼              ▼
                             ┌───────────┐  ┌───────────┐  ┌───────────┐
                             │ Comments  │  │TaskLabels │  │Attachments│
                             └───────────┘  └───────────┘  └───────────┘
                                                  │
                                                  ▼
                                           ┌───────────┐
                                           │  Labels   │
                                           └───────────┘
```

### 4.2 Tabel-Tabel Utama

#### Users

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(255),
  role ENUM('admin', 'project_manager', 'developer', 'viewer') DEFAULT 'developer',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Projects

```sql
CREATE TABLE projects (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  key VARCHAR(10) UNIQUE NOT NULL,
  owner_id INT REFERENCES users(id),
  status ENUM('planning', 'active', 'on_hold', 'completed', 'archived') DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Tasks

```sql
CREATE TABLE tasks (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  project_id INT REFERENCES projects(id),
  sprint_id INT REFERENCES sprints(id),
  assignee_id INT REFERENCES users(id),
  reporter_id INT REFERENCES users(id),
  status ENUM('backlog', 'todo', 'in_progress', 'in_review', 'done') DEFAULT 'backlog',
  priority ENUM('lowest', 'low', 'medium', 'high', 'highest') DEFAULT 'medium',
  task_type ENUM('story', 'bug', 'task', 'epic', 'subtask') DEFAULT 'task',
  story_points INT,
  due_date DATE,
  position INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Sprints

```sql
CREATE TABLE sprints (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  goal TEXT,
  project_id INT REFERENCES projects(id),
  status ENUM('planning', 'active', 'completed') DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Departments

```sql
CREATE TABLE departments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  description TEXT,
  parent_id INT REFERENCES departments(id),
  head_user_id INT REFERENCES users(id),
  level INT DEFAULT 0,
  "order" INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Teams

```sql
CREATE TABLE teams (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  department_id INT REFERENCES departments(id),
  lead_user_id INT REFERENCES users(id),
  color VARCHAR(7) DEFAULT '#3B82F6',
  max_members INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Team Members

```sql
CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT REFERENCES teams(id),
  user_id INT REFERENCES users(id),
  role ENUM('member', 'lead', 'admin') DEFAULT 'member',
  position VARCHAR(100),
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY (team_id, user_id)
);
```

#### Notifications

```sql
CREATE TABLE notifications (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT REFERENCES users(id),
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  data JSON,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 5. Sistem Role & Hak Akses

### 5.1 Struktur Role 3 Layer

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SYSTEM LEVEL ROLES                               │
│                        (Global - Tabel Users)                            │
│  ┌──────────┐   ┌─────────────────┐   ┌───────────┐   ┌──────────┐     │
│  │  admin   │ → │ project_manager │ → │ developer │ → │  viewer  │     │
│  └──────────┘   └─────────────────┘   └───────────┘   └──────────┘     │
│   Full Access    Manage Projects      Work on Tasks    View Only        │
│                  & Teams                                                 │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                        PROJECT LEVEL ROLES                               │
│                    (Per Project - Tabel ProjectMembers)                  │
│  ┌──────────┐   ┌───────────┐   ┌───────────┐   ┌──────────┐           │
│  │  owner   │ → │  manager  │ → │ developer │ → │  viewer  │           │
│  └──────────┘   └───────────┘   └───────────┘   └──────────┘           │
│   Project        Project Mgr     Dev Team        View Only              │
│   Owner                                                                  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                          TEAM LEVEL ROLES                                │
│                      (Per Team - Tabel TeamMembers)                      │
│       ┌──────────┐       ┌──────────┐       ┌──────────┐               │
│       │  admin   │   →   │   lead   │   →   │  member  │               │
│       └──────────┘       └──────────┘       └──────────┘               │
│        Team Admin         Team Lead          Anggota                    │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.2 Matriks Hak Akses Detail

#### A. Manajemen User

| Action           | admin | project_manager | developer | viewer |
| ---------------- | :---: | :-------------: | :-------: | :----: |
| View All Users   |  ✅   |       ✅        |    ✅     |   ✅   |
| Create User      |  ✅   |       ❌        |    ❌     |   ❌   |
| Edit Any User    |  ✅   |       ❌        |    ❌     |   ❌   |
| Edit Own Profile |  ✅   |       ✅        |    ✅     |   ✅   |
| Delete User      |  ✅   |       ❌        |    ❌     |   ❌   |
| Change User Role |  ✅   |       ❌        |    ❌     |   ❌   |

#### B. Manajemen Project

| Action              | admin | project_manager | developer | viewer |
| ------------------- | :---: | :-------------: | :-------: | :----: |
| View All Projects   |  ✅   |       ✅        |    ✅     |   ✅   |
| Create Project      |  ✅   |       ✅        |    ❌     |   ❌   |
| Edit Project        |  ✅   |    ✅ (own)     |    ❌     |   ❌   |
| Delete Project      |  ✅   |    ✅ (own)     |    ❌     |   ❌   |
| Add Project Members |  ✅   |    ✅ (own)     |    ❌     |   ❌   |

#### C. Manajemen Task

| Action             | admin | project_manager |   developer   | viewer |
| ------------------ | :---: | :-------------: | :-----------: | :----: |
| View Tasks         |  ✅   |       ✅        |      ✅       |   ✅   |
| Create Task        |  ✅   |       ✅        |      ✅       |   ❌   |
| Edit Task          |  ✅   |       ✅        | ✅ (assigned) |   ❌   |
| Delete Task        |  ✅   |       ✅        |      ❌       |   ❌   |
| Change Task Status |  ✅   |       ✅        | ✅ (assigned) |   ❌   |
| Assign Task        |  ✅   |       ✅        |      ❌       |   ❌   |

#### D. Manajemen Sprint

| Action           | admin | project_manager | developer | viewer |
| ---------------- | :---: | :-------------: | :-------: | :----: |
| View Sprints     |  ✅   |       ✅        |    ✅     |   ✅   |
| Create Sprint    |  ✅   |       ✅        |    ❌     |   ❌   |
| Edit Sprint      |  ✅   |       ✅        |    ❌     |   ❌   |
| Delete Sprint    |  ✅   |       ✅        |    ❌     |   ❌   |
| Start/End Sprint |  ✅   |       ✅        |    ❌     |   ❌   |

#### E. Manajemen Department

| Action            | admin | project_manager | developer | viewer |
| ----------------- | :---: | :-------------: | :-------: | :----: |
| View Departments  |  ✅   |       ✅        |    ✅     |   ✅   |
| Create Department |  ✅   |       ❌        |    ❌     |   ❌   |
| Edit Department   |  ✅   |       ❌        |    ❌     |   ❌   |
| Delete Department |  ✅   |       ❌        |    ❌     |   ❌   |

#### F. Manajemen Team

| Action             | admin | project_manager | developer | viewer |
| ------------------ | :---: | :-------------: | :-------: | :----: |
| View Teams         |  ✅   |       ✅        |    ✅     |   ✅   |
| Create Team        |  ✅   |       ✅        |    ❌     |   ❌   |
| Edit Team          |  ✅   |       ✅        |    ❌     |   ❌   |
| Delete Team        |  ✅   |       ❌        |    ❌     |   ❌   |
| Add Team Member    |  ✅   |       ✅        |    ❌     |   ❌   |
| Remove Team Member |  ✅   |       ✅        |    ❌     |   ❌   |
| Update Member Role |  ✅   |       ✅        |    ❌     |   ❌   |

### 5.3 Implementasi Role Check

#### Backend Middleware (`roleCheck.js`)

```javascript
const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};
```

#### Frontend Context (`AuthContext.jsx`)

```javascript
// Role check helpers
const isAdmin = () => user?.role === "admin";
const isProjectManager = () => user?.role === "project_manager";
const isDeveloper = () => user?.role === "developer";
const isViewer = () => user?.role === "viewer";

// Permission helpers
const canManageDepartments = () => isAdmin();
const canManageTeams = () => isAdmin() || isProjectManager();
const canEditTasks = () => !isViewer();
const canViewOnly = () => isViewer();

// Check if user has any of the specified roles
const hasRole = (roles) => {
  if (!user?.role) return false;
  return roles.includes(user.role);
};
```

---

## 6. Fitur-Fitur Aplikasi

### 6.1 Authentication & Authorization

#### Login Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │ →  │  POST    │ →  │ Validate │ →  │  Return  │
│  Form    │    │  /auth/  │    │ Password │    │   JWT    │
│          │    │  login   │    │ & User   │    │  Token   │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

#### Register Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Register │ →  │  POST    │ →  │  Create  │ →  │  Auto    │
│   Form   │    │  /auth/  │    │   User   │    │  Login   │
│          │    │ register │    │          │    │          │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 6.2 Project Management

#### Project Lifecycle

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Planning │ →  │  Active  │ →  │ On Hold  │ →  │Completed │ →  │ Archived │
└──────────┘    └──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 6.3 Task Management

#### Task Status Flow (Kanban)

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌───────────┐    ┌──────────┐
│ Backlog  │ →  │   To Do  │ →  │In Progress│ →  │ In Review │ →  │   Done   │
└──────────┘    └──────────┘    └───────────┘    └───────────┘    └──────────┘
```

#### Task Priority Levels

```
⬇️ Lowest → ↓ Low → ➡️ Medium → ↑ High → ⬆️ Highest
```

#### Task Types

- 📖 Story - User story atau fitur
- 🐛 Bug - Bug/defect yang perlu diperbaiki
- ✅ Task - Task teknis
- 🎯 Epic - Kumpulan stories
- 📝 Subtask - Bagian dari task lain

### 6.4 Sprint Management

#### Sprint Lifecycle

```
┌──────────┐    ┌──────────┐    ┌───────────┐
│ Planning │ →  │  Active  │ →  │ Completed │
└──────────┘    └──────────┘    └───────────┘
     │               │                │
     ▼               ▼                ▼
  Add Tasks    Work on Tasks    Sprint Review
  Set Goals    Daily Standups   Retrospective
```

### 6.5 Team Management

#### Organization Structure

```
┌────────────────────────────────────────────────────────┐
│                     ORGANIZATION                        │
│                                                         │
│  ┌─────────────────┐     ┌─────────────────┐           │
│  │   Department A  │     │   Department B  │           │
│  │  (e.g., IT)     │     │  (e.g., HR)     │           │
│  └────────┬────────┘     └────────┬────────┘           │
│           │                       │                     │
│     ┌─────┴─────┐           ┌─────┴─────┐              │
│     │           │           │           │               │
│  ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐          │
│  │Team │     │Team │     │Team │     │Team │          │
│  │  1  │     │  2  │     │  3  │     │  4  │          │
│  └─────┘     └─────┘     └─────┘     └─────┘          │
│                                                         │
└────────────────────────────────────────────────────────┘
```

### 6.6 Real-time Notifications (WebSocket)

#### Notification Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Action  │ →  │  Server  │ →  │ Socket.IO│ →  │  Client  │
│ (Create/ │    │ Creates  │    │  Emit    │    │ Receives │
│  Update) │    │  Notif   │    │  Event   │    │ & Shows  │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

#### Notification Types

| Type                 | Deskripsi                 |
| -------------------- | ------------------------- |
| `task_assigned`      | Task di-assign ke user    |
| `task_updated`       | Task diupdate             |
| `task_commented`     | Ada komentar baru di task |
| `sprint_started`     | Sprint dimulai            |
| `sprint_completed`   | Sprint selesai            |
| `project_invitation` | Diundang ke project       |
| `mention`            | Di-mention di komentar    |

### 6.7 AI Assistant (Gemini)

#### AI Features

1. **Task Suggestions** - Saran untuk breakdown task
2. **Sprint Planning** - Rekomendasi kapasitas sprint
3. **Bug Analysis** - Analisis dan saran fix bug
4. **Code Review** - Review kode otomatis
5. **Daily Summary** - Ringkasan aktivitas harian

#### AI Chat Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│   User   │ →  │  Queue   │ →  │  Gemini  │ →  │ Response │
│  Query   │    │  System  │    │   API    │    │ Streamed │
└──────────┘    └──────────┘    └──────────┘    └──────────┘
```

### 6.8 Dashboard & Reporting

#### Dashboard Widgets

- 📊 Project Progress Overview
- 📈 Sprint Burndown Chart
- 🎯 Task Distribution by Status
- 👥 Team Workload
- ⏱️ Time Tracking Summary
- 🔔 Recent Activities

---

## 7. API Endpoints

### 7.1 Authentication

| Method | Endpoint                    | Description            | Auth |
| ------ | --------------------------- | ---------------------- | ---- |
| POST   | `/api/auth/register`        | Register user baru     | ❌   |
| POST   | `/api/auth/login`           | Login user             | ❌   |
| POST   | `/api/auth/logout`          | Logout user            | ✅   |
| GET    | `/api/auth/me`              | Get current user       | ✅   |
| POST   | `/api/auth/refresh`         | Refresh token          | ✅   |
| POST   | `/api/auth/forgot-password` | Request reset password | ❌   |
| POST   | `/api/auth/reset-password`  | Reset password         | ❌   |

### 7.2 Users

| Method | Endpoint                | Description    | Auth | Role       |
| ------ | ----------------------- | -------------- | ---- | ---------- |
| GET    | `/api/users`            | Get all users  | ✅   | All        |
| GET    | `/api/users/:id`        | Get user by ID | ✅   | All        |
| PUT    | `/api/users/:id`        | Update user    | ✅   | Admin/Self |
| DELETE | `/api/users/:id`        | Delete user    | ✅   | Admin      |
| PUT    | `/api/users/:id/avatar` | Update avatar  | ✅   | Admin/Self |

### 7.3 Projects

| Method | Endpoint                            | Description            | Auth | Role         |
| ------ | ----------------------------------- | ---------------------- | ---- | ------------ |
| GET    | `/api/projects`                     | Get all projects       | ✅   | All          |
| POST   | `/api/projects`                     | Create project         | ✅   | Admin, PM    |
| GET    | `/api/projects/:id`                 | Get project detail     | ✅   | All          |
| PUT    | `/api/projects/:id`                 | Update project         | ✅   | Admin, Owner |
| DELETE | `/api/projects/:id`                 | Delete project         | ✅   | Admin, Owner |
| GET    | `/api/projects/:id/members`         | Get project members    | ✅   | All          |
| POST   | `/api/projects/:id/members`         | Add member             | ✅   | Admin, Owner |
| DELETE | `/api/projects/:id/members/:userId` | Remove member          | ✅   | Admin, Owner |
| GET    | `/api/projects/:id/stats`           | Get project statistics | ✅   | All          |

### 7.4 Tasks

| Method | Endpoint                | Description     | Auth | Role                |
| ------ | ----------------------- | --------------- | ---- | ------------------- |
| GET    | `/api/tasks`            | Get all tasks   | ✅   | All                 |
| POST   | `/api/tasks`            | Create task     | ✅   | Admin, PM, Dev      |
| GET    | `/api/tasks/:id`        | Get task detail | ✅   | All                 |
| PUT    | `/api/tasks/:id`        | Update task     | ✅   | Admin, PM, Assignee |
| DELETE | `/api/tasks/:id`        | Delete task     | ✅   | Admin, PM           |
| PUT    | `/api/tasks/:id/status` | Update status   | ✅   | Admin, PM, Assignee |
| PUT    | `/api/tasks/:id/assign` | Assign task     | ✅   | Admin, PM           |
| PUT    | `/api/tasks/reorder`    | Reorder tasks   | ✅   | Admin, PM, Dev      |
| GET    | `/api/tasks/my-tasks`   | Get my tasks    | ✅   | All                 |

### 7.5 Sprints

| Method | Endpoint                    | Description       | Auth | Role      |
| ------ | --------------------------- | ----------------- | ---- | --------- |
| GET    | `/api/sprints`              | Get all sprints   | ✅   | All       |
| POST   | `/api/sprints`              | Create sprint     | ✅   | Admin, PM |
| GET    | `/api/sprints/:id`          | Get sprint detail | ✅   | All       |
| PUT    | `/api/sprints/:id`          | Update sprint     | ✅   | Admin, PM |
| DELETE | `/api/sprints/:id`          | Delete sprint     | ✅   | Admin, PM |
| POST   | `/api/sprints/:id/start`    | Start sprint      | ✅   | Admin, PM |
| POST   | `/api/sprints/:id/complete` | Complete sprint   | ✅   | Admin, PM |
| GET    | `/api/sprints/:id/tasks`    | Get sprint tasks  | ✅   | All       |

### 7.6 Departments

| Method | Endpoint                     | Description           | Auth | Role  |
| ------ | ---------------------------- | --------------------- | ---- | ----- |
| GET    | `/api/departments`           | Get all departments   | ✅   | All   |
| POST   | `/api/departments`           | Create department     | ✅   | Admin |
| GET    | `/api/departments/:id`       | Get department detail | ✅   | All   |
| PUT    | `/api/departments/:id`       | Update department     | ✅   | Admin |
| DELETE | `/api/departments/:id`       | Delete department     | ✅   | Admin |
| GET    | `/api/departments/:id/stats` | Get department stats  | ✅   | All   |
| PUT    | `/api/departments/reorder`   | Reorder departments   | ✅   | Admin |

### 7.7 Teams

| Method | Endpoint                         | Description         | Auth | Role      |
| ------ | -------------------------------- | ------------------- | ---- | --------- |
| GET    | `/api/teams`                     | Get all teams       | ✅   | All       |
| POST   | `/api/teams`                     | Create team         | ✅   | Admin, PM |
| GET    | `/api/teams/:id`                 | Get team detail     | ✅   | All       |
| PUT    | `/api/teams/:id`                 | Update team         | ✅   | Admin, PM |
| DELETE | `/api/teams/:id`                 | Delete team         | ✅   | Admin     |
| GET    | `/api/teams/:id/members`         | Get team members    | ✅   | All       |
| POST   | `/api/teams/:id/members`         | Add member          | ✅   | Admin, PM |
| PUT    | `/api/teams/:id/members/:userId` | Update member       | ✅   | Admin, PM |
| DELETE | `/api/teams/:id/members/:userId` | Remove member       | ✅   | Admin, PM |
| GET    | `/api/teams/my-teams`            | Get my teams        | ✅   | All       |
| GET    | `/api/teams/:id/available-users` | Get available users | ✅   | Admin, PM |

### 7.8 Comments

| Method | Endpoint                     | Description       | Auth | Role           |
| ------ | ---------------------------- | ----------------- | ---- | -------------- |
| GET    | `/api/comments/task/:taskId` | Get task comments | ✅   | All            |
| POST   | `/api/comments`              | Create comment    | ✅   | Admin, PM, Dev |
| PUT    | `/api/comments/:id`          | Update comment    | ✅   | Author         |
| DELETE | `/api/comments/:id`          | Delete comment    | ✅   | Admin, Author  |

### 7.9 Notifications

| Method | Endpoint                          | Description          | Auth | Role  |
| ------ | --------------------------------- | -------------------- | ---- | ----- |
| GET    | `/api/notifications`              | Get my notifications | ✅   | All   |
| GET    | `/api/notifications/unread-count` | Get unread count     | ✅   | All   |
| PUT    | `/api/notifications/:id/read`     | Mark as read         | ✅   | Owner |
| PUT    | `/api/notifications/read-all`     | Mark all as read     | ✅   | Owner |
| DELETE | `/api/notifications/:id`          | Delete notification  | ✅   | Owner |

### 7.10 AI

| Method | Endpoint                      | Description          | Auth | Role  |
| ------ | ----------------------------- | -------------------- | ---- | ----- |
| POST   | `/api/ai/chat`                | Chat with AI         | ✅   | All   |
| POST   | `/api/ai/chat/stream`         | Stream chat          | ✅   | All   |
| GET    | `/api/ai/suggestions/:taskId` | Get task suggestions | ✅   | All   |
| GET    | `/api/ai/insights/:projectId` | Get project insights | ✅   | All   |
| GET    | `/api/ai/settings`            | Get AI settings      | ✅   | Admin |
| PUT    | `/api/ai/settings`            | Update AI settings   | ✅   | Admin |
| GET    | `/api/ai/usage`               | Get AI usage stats   | ✅   | Admin |

### 7.11 Activities

| Method | Endpoint                             | Description            | Auth | Role |
| ------ | ------------------------------------ | ---------------------- | ---- | ---- |
| GET    | `/api/activities`                    | Get all activities     | ✅   | All  |
| GET    | `/api/activities/project/:projectId` | Get project activities | ✅   | All  |
| GET    | `/api/activities/user/:userId`       | Get user activities    | ✅   | All  |

### 7.12 Attachments

| Method | Endpoint                  | Description   | Auth | Role            |
| ------ | ------------------------- | ------------- | ---- | --------------- |
| POST   | `/api/attachments/upload` | Upload file   | ✅   | Admin, PM, Dev  |
| GET    | `/api/attachments/:id`    | Download file | ✅   | All             |
| DELETE | `/api/attachments/:id`    | Delete file   | ✅   | Admin, Uploader |

### 7.13 Labels

| Method | Endpoint          | Description    | Auth | Role      |
| ------ | ----------------- | -------------- | ---- | --------- |
| GET    | `/api/labels`     | Get all labels | ✅   | All       |
| POST   | `/api/labels`     | Create label   | ✅   | Admin, PM |
| PUT    | `/api/labels/:id` | Update label   | ✅   | Admin, PM |
| DELETE | `/api/labels/:id` | Delete label   | ✅   | Admin, PM |

### 7.14 Time Logs

| Method | Endpoint                     | Description        | Auth | Role           |
| ------ | ---------------------------- | ------------------ | ---- | -------------- |
| GET    | `/api/timelogs`              | Get all time logs  | ✅   | All            |
| POST   | `/api/timelogs`              | Create time log    | ✅   | Admin, PM, Dev |
| PUT    | `/api/timelogs/:id`          | Update time log    | ✅   | Admin, Owner   |
| DELETE | `/api/timelogs/:id`          | Delete time log    | ✅   | Admin, Owner   |
| GET    | `/api/timelogs/task/:taskId` | Get task time logs | ✅   | All            |
| GET    | `/api/timelogs/user/:userId` | Get user time logs | ✅   | Admin, Self    |

---

## 8. Konfigurasi

### 8.1 Environment Variables (Backend)

```env
# Application
NODE_ENV=development
PORT=5000
APP_NAME=MPM Agile Tools

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mpm_agile_tools
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRE=7d

# Email (Nodemailer)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=noreply@mpm-agile.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Database Auto-Sync Configuration
DB_AUTO_SYNC=false
DB_SYNC_MODE=alter

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash
GEMINI_MAX_TOKENS=2048
GEMINI_TEMPERATURE=0.7

# AI Feature Toggle
AI_ENABLED=true

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# AI Rate Limiting & Quota
AI_RATE_LIMIT_PER_USER=50
AI_RATE_LIMIT_WINDOW_MS=3600000
AI_QUEUE_CONCURRENCY=5
AI_DAILY_TOKEN_LIMIT=100000
AI_USER_DAILY_LIMIT=100
AI_CACHE_TTL=86400
```

### 8.2 Frontend Configuration

#### Vite Config (`vite.config.js`)

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/socket.io": {
        target: "http://localhost:5000",
        ws: true,
      },
    },
  },
});
```

#### Tailwind Config (`tailwind.config.js`)

```javascript
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#eff6ff",
          // ... color scale
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};
```

---

## 9. Panduan Instalasi

### 9.1 Prerequisites

- Node.js v18+
- MySQL 8.0+
- Redis (optional, untuk AI queue)
- Git

### 9.2 Clone Repository

```bash
git clone https://github.com/ThomsonSimbolon/app-mpm-agile-tools.git
cd app-mpm-agile-tools
```

### 9.3 Setup Database

```sql
CREATE DATABASE mpm_agile_tools;
```

### 9.4 Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Set DB_AUTO_SYNC=true for first run to create tables
# Then set it back to false

# Start server
npm run dev
```

### 9.5 Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### 9.6 Access Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- Socket.IO: http://localhost:5000

---

## 10. Panduan Penggunaan

### 10.1 Pertama Kali

1. **Register Admin Account**

   - Buka http://localhost:5173/register
   - Daftar dengan email dan password
   - User pertama otomatis jadi admin (atau ubah manual di database)

2. **Login**

   - Buka http://localhost:5173/login
   - Masukkan credentials

3. **Setup Organization**

   - Buat Department di menu Teams
   - Buat Team di dalam Department
   - Invite anggota tim

4. **Create Project**
   - Klik "New Project" di Dashboard
   - Isi detail project
   - Add team members ke project

### 10.2 Workflow Sehari-hari

#### Project Manager

1. Create/manage sprints
2. Create tasks dan assign ke developer
3. Monitor progress di Dashboard
4. Review completed tasks

#### Developer

1. Check assigned tasks di "My Tasks"
2. Update task status sesuai progress
3. Add comments dan time logs
4. Move tasks di Kanban board

#### Viewer

1. View project progress
2. View tasks dan sprints
3. Access reports dan dashboard

### 10.3 Fitur AI Assistant

1. **Akses AI Chat**

   - Klik icon AI di header
   - Atau buka menu AI Dashboard

2. **Gunakan AI untuk:**
   - Generate task breakdown
   - Analisis bug
   - Sprint planning suggestions
   - Code review

### 10.4 Notifications

- Real-time notifications via WebSocket
- Notification badge di header
- Click untuk melihat detail
- Mark as read / Mark all as read

---

## 📝 Catatan Penting

### Security Considerations

1. Ganti `JWT_SECRET` di production
2. Gunakan HTTPS di production
3. Set `DB_AUTO_SYNC=false` di production
4. Implementasi rate limiting
5. Validasi input di semua endpoint

### Performance Tips

1. Enable Redis untuk caching AI responses
2. Gunakan pagination untuk list besar
3. Optimize database queries dengan indexing
4. Implement lazy loading di frontend

### Known Limitations

1. File upload max 10MB
2. AI rate limit 50 requests/hour per user
3. WebSocket tidak support clustering tanpa Redis adapter

---

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

---

## 📄 License

MIT License - lihat file LICENSE untuk detail.

---

> **Dokumentasi ini diupdate pada:** 10 Desember 2025  
> **Versi Aplikasi:** 1.0.0  
> **Maintained by:** MPM Agile Tools Team
