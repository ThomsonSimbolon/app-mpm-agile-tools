# 🚀 MPM Agile Tools

> Mini Project Management Application with **Enterprise RBAC System** for Multi-Layer Role-Based Access Control

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue)](https://reactjs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)](https://www.mysql.com/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Enterprise RBAC System](#-enterprise-rbac-system)
- [Quick Start](#-quick-start)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Contributing](#-contributing)

---

## 📖 About

**MPM Agile Tools** is a comprehensive project management application designed for teams using Agile methodologies. It features a powerful **4-layer Enterprise RBAC System** that provides granular access control across System, Division, Team, and Project levels.

### 🎯 Target Users

- Software Development Teams
- Project Managers
- Scrum Masters
- Product Owners
- QA Teams
- Stakeholders

---

## ✨ Features

### Core Features

- 📁 **Project Management** - Create, manage, and track multiple projects
- 📋 **Kanban Board** - Drag & drop task management with status tracking
- 🏃 **Sprint Management** - Plan, execute, and review sprints
- ✅ **Task Management** - Full task lifecycle with comments & attachments
- 👥 **Team Collaboration** - Department → Team hierarchy
- 🔔 **Real-time Notifications** - WebSocket-based instant updates
- 📊 **Reports & Dashboard** - Visual project analytics

### Enterprise Features (NEW!)

- 🔐 **4-Layer RBAC** - System > Division > Team > Project hierarchy
- 🛡️ **Granular Permissions** - 40+ permission codes
- 📝 **Audit Logging** - Full permission change tracking
- ⏰ **Time-bound Roles** - Temporary role assignments with validity periods
- 🏢 **Institution Mapping** - Map organizational structure to RBAC

### AI Features

- 🤖 **AI Assistant** - Powered by Google Gemini
- 💬 **Streaming Chat** - Real-time AI responses
- 📈 **Smart Suggestions** - Task breakdown & sprint planning

---

## 🛠️ Tech Stack

| Layer         | Technology                   |
| ------------- | ---------------------------- |
| **Frontend**  | React 18, Vite, Tailwind CSS |
| **Backend**   | Node.js, Express.js          |
| **Database**  | MySQL with Sequelize ORM     |
| **Real-time** | Socket.IO                    |
| **AI**        | Google Gemini                |
| **Auth**      | JWT                          |
| **Caching**   | Redis (optional)             |

---

## 🔐 Enterprise RBAC System

### 4-Layer Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│                   PRIORITY: SYSTEM > DIVISION > TEAM > PROJECT  │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  SYSTEM LEVEL     │ super_admin, admin, security_officer,       │
│                   │ ai_admin                                     │
│                                                                  │
│  DIVISION LEVEL   │ division_head, division_manager,            │
│                   │ division_viewer, hr_reviewer                 │
│                                                                  │
│  TEAM LEVEL       │ team_admin, team_lead, scrum_master,        │
│                   │ product_owner, qa_lead, member               │
│                                                                  │
│  PROJECT LEVEL    │ project_owner, project_manager, tech_lead,  │
│                   │ qa_tester, developer, report_viewer,         │
│                   │ stakeholder                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Permission Resolution

```
FinalAccess = SystemRole ∪ DivisionRole ∪ TeamRole ∪ ProjectRole
```

The system uses **union** of permissions from all applicable roles, with **Super Admin** having override capability.

### Quick Reference

| Role              | Level    | Key Permissions                            |
| ----------------- | -------- | ------------------------------------------ |
| `super_admin`     | System   | Full access, override all                  |
| `admin`           | System   | Manage users, departments, teams, projects |
| `division_head`   | Division | Full access within division                |
| `team_lead`       | Team     | Manage team members & tasks                |
| `scrum_master`    | Team     | Manage sprints & ceremonies                |
| `product_owner`   | Team     | Prioritize backlog                         |
| `project_manager` | Project  | Manage project (no delete)                 |
| `developer`       | Project  | Edit own tasks only                        |
| `qa_tester`       | Project  | Edit QA fields only                        |

---

## 🚀 Quick Start

### Prerequisites

- Node.js v18+
- MySQL 8.0+
- Redis (optional)
- Git

### 1. Clone Repository

```bash
git clone https://github.com/your-username/app-mpm-agile-tools.git
cd app-mpm-agile-tools
```

### 2. Setup Database

```sql
CREATE DATABASE mpm_agile_tools;
```

### 3. Run RBAC Migration

```bash
mysql -u root -p mpm_agile_tools < backend/src/migrations/20251210_enterprise_rbac.sql
```

### 4. Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 5. Seed RBAC Data

```bash
cd backend
node src/seeders/rbacSeeder.js
```

### 6. Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

### 7. Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000

---

## ⚙️ Environment Variables

### Backend (.env)

```env
# Application
NODE_ENV=development
PORT=5000

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=mpm_agile_tools
DB_USER=root
DB_PASSWORD=

# JWT
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=7d

# Frontend URL (CORS)
FRONTEND_URL=http://localhost:5173

# Gemini AI
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
AI_ENABLED=true

# Redis (optional)
REDIS_HOST=localhost
REDIS_PORT=6379

# RBAC
RBAC_DEBUG=false
RBAC_CACHE_TTL=3600
```

---

## 📚 API Documentation

### Authentication

| Method | Endpoint             | Description                 |
| ------ | -------------------- | --------------------------- |
| POST   | `/api/auth/register` | Register user               |
| POST   | `/api/auth/login`    | Login user                  |
| GET    | `/api/auth/me`       | Get current user with roles |

### RBAC Management

| Method | Endpoint                          | Description                    |
| ------ | --------------------------------- | ------------------------------ |
| GET    | `/api/rbac/permissions`           | Get all permissions            |
| GET    | `/api/rbac/role-definitions`      | Get role definitions           |
| GET    | `/api/rbac/my-permissions`        | Get current user's permissions |
| PUT    | `/api/rbac/users/:id/system-role` | Update user's system role      |
| POST   | `/api/rbac/users/:id/assignments` | Create role assignment         |
| GET    | `/api/rbac/audit-logs`            | Get audit logs                 |

### Projects

| Method | Endpoint            | Description         |
| ------ | ------------------- | ------------------- |
| GET    | `/api/projects`     | Get user's projects |
| POST   | `/api/projects`     | Create project      |
| PUT    | `/api/projects/:id` | Update project      |
| DELETE | `/api/projects/:id` | Delete project      |

### Tasks

| Method | Endpoint                        | Description        |
| ------ | ------------------------------- | ------------------ |
| POST   | `/api/tasks/projects/:id/tasks` | Create task        |
| GET    | `/api/tasks/:id`                | Get task detail    |
| PUT    | `/api/tasks/:id`                | Update task        |
| PUT    | `/api/tasks/:id/status`         | Update task status |
| DELETE | `/api/tasks/:id`                | Delete task        |

### Sprints

| Method | Endpoint                            | Description     |
| ------ | ----------------------------------- | --------------- |
| POST   | `/api/sprints/projects/:id/sprints` | Create sprint   |
| POST   | `/api/sprints/:id/start`            | Start sprint    |
| POST   | `/api/sprints/:id/complete`         | Complete sprint |

For complete API documentation, see [DOCUMENTATION.md](DOCUMENTATION.md).

---

## 📁 Project Structure

```
app-mpm-agile-tools/
├── DOCUMENTATION.md      # Full documentation
├── README.md             # This file
├── backend/
│   ├── server.js         # Entry point
│   ├── package.json
│   └── src/
│       ├── app.js
│       ├── config/
│       │   ├── rbacConfig.js     # 🔐 RBAC configuration
│       │   └── ...
│       ├── controllers/
│       │   ├── rbacController.js # 🔐 RBAC management
│       │   └── ...
│       ├── middleware/
│       │   ├── roleCheckAdvanced.js  # 🔐 RBAC middleware
│       │   └── ...
│       ├── migrations/
│       │   └── 20251210_enterprise_rbac.sql
│       ├── models/
│       │   ├── DepartmentMember.js   # 🔐
│       │   ├── RbacPermission.js     # 🔐
│       │   ├── RolePermission.js     # 🔐
│       │   ├── UserRoleAssignment.js # 🔐
│       │   └── ...
│       ├── routes/
│       │   ├── rbacRoutes.js     # 🔐 RBAC API routes
│       │   └── ...
│       └── seeders/
│           └── rbacSeeder.js     # 🔐 Seed RBAC data
└── frontend/
    ├── package.json
    └── src/
        ├── App.jsx
        ├── pages/
        │   └── UserRoleManagement.jsx  # 🔐 RBAC UI
        ├── services/
        │   └── rbacService.js    # 🔐 RBAC API service
        └── ...
```

---

## 🔧 Usage Examples

### RBAC Middleware Usage

```javascript
const {
  roleCheckAdvanced,
  SYSTEM_ROLES,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

// Check specific roles
router.delete(
  "/users/:id",
  auth,
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN],
  }),
  deleteUser
);

// Check specific permissions
router.post(
  "/tasks",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.CREATE_TASK],
  }),
  createTask
);

// Ownership check (developer can only edit own tasks)
router.put(
  "/tasks/:id",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.EDIT_TASK],
    checkOwnership: true,
    resourceType: "task",
  }),
  updateTask
);
```

### Convenience Middlewares

```javascript
const {
  requireSystemAdmin,
  requireSuperAdmin,
  requireSprintManager,
  requireTaskEditor,
  requireAiAdmin,
} = require("../middleware/roleCheckAdvanced");

router.delete("/users/:id", auth, requireSuperAdmin(), deleteUser);
router.post("/sprints/:id/start", auth, requireSprintManager(), startSprint);
router.put("/ai/settings", auth, requireAiAdmin(), updateAiSettings);
```

---

## 📊 Summary

| Category            | Count |
| ------------------- | ----- |
| API Endpoints       | 90+   |
| Database Tables     | 20+   |
| RBAC Roles          | 21    |
| RBAC Permissions    | 40+   |
| Frontend Components | 40+   |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 📞 Support

For support, please create an issue or contact the development team.

---

**Built with ❤️ using Node.js, React, TailwindCSS, and Enterprise RBAC**

> **Version:** 2.0.0  
> **Last Updated:** December 11, 2025
