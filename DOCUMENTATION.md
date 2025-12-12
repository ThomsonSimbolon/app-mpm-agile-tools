# 📚 MPM Agile Tools - Dokumentasi Lengkap

> **Versi:** 2.0.0  
> **Tanggal Update:** 11 Desember 2025  
> **Status:** Production Ready with Enterprise RBAC

---

## 📋 Daftar Isi

1. [Overview Aplikasi](#1-overview-aplikasi)
2. [Arsitektur Sistem](#2-arsitektur-sistem)
3. [Struktur Folder](#3-struktur-folder)
4. [Database Schema](#4-database-schema)
5. [Enterprise RBAC System](#5-enterprise-rbac-system)
6. [Fitur-Fitur Aplikasi](#6-fitur-fitur-aplikasi)
7. [API Endpoints](#7-api-endpoints)
8. [Konfigurasi](#8-konfigurasi)
9. [Panduan Instalasi](#9-panduan-instalasi)
10. [Panduan Penggunaan](#10-panduan-penggunaan)

---

## 1. Overview Aplikasi

### 1.1 Deskripsi

**MPM Agile Tools** adalah aplikasi manajemen proyek berbasis metodologi Agile yang dirancang untuk membantu tim dalam mengelola proyek, sprint, task, dan kolaborasi tim secara efektif. Dilengkapi dengan **Enterprise RBAC System (Multi-Layer Role-Based Access Control)** untuk kontrol akses yang granular.

### 1.2 Tech Stack

| Layer              | Teknologi                    |
| ------------------ | ---------------------------- |
| **Frontend**       | React 18, Vite, Tailwind CSS |
| **Backend**        | Node.js, Express.js          |
| **Database**       | MySQL dengan Sequelize ORM   |
| **Real-time**      | Socket.IO                    |
| **AI Integration** | Google Gemini AI             |
| **Authentication** | JWT (JSON Web Token)         |
| **Authorization**  | Enterprise RBAC (4-Layer)    |
| **File Upload**    | Multer                       |
| **Caching**        | Redis                        |

### 1.3 Fitur Utama

- ✅ Manajemen Proyek
- ✅ Kanban Board dengan Drag & Drop
- ✅ Sprint Management
- ✅ Task Management
- ✅ **Enterprise RBAC System (NEW!)**
- ✅ Tim & Organisasi (Department → Team)
- ✅ Real-time Notifications (WebSocket)
- ✅ Dashboard & Reporting
- ✅ AI Assistant (Gemini)
- ✅ Activity Logging
- ✅ File Attachments
- ✅ Comments & Collaboration
- ✅ Permission Audit Logs

---

## 2. Arsitektur Sistem

### 2.1 System Architecture

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
│                                                            │             │
│                                               ┌────────────┴──────────┐ │
│                                               │   RBAC Middleware     │ │
│                                               │  roleCheckAdvanced.js │ │
│                                               └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │    MySQL    │ │    Redis    │ │  Gemini AI  │
            │  Database   │ │   (Cache)   │ │    API      │
            └─────────────┘ └─────────────┘ └─────────────┘
```

### 2.2 RBAC Request Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW WITH RBAC                              │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│   Request → Auth Middleware → roleCheckAdvanced → Controller → Response      │
│                                      │                                        │
│                         ┌────────────┴────────────┐                          │
│                         │                         │                           │
│                         ▼                         ▼                           │
│              ┌──────────────────┐    ┌──────────────────┐                    │
│              │ Role Resolution  │    │Permission Check  │                    │
│              │                  │    │                  │                    │
│              │ • System Role    │    │ • Matrix Lookup  │                    │
│              │ • Division Role  │    │ • Conditional    │                    │
│              │ • Team Role      │    │ • Ownership      │                    │
│              │ • Project Role   │    │ • Override       │                    │
│              └──────────────────┘    └──────────────────┘                    │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Struktur Folder

### 3.1 Backend Structure

```
backend/
├── server.js                 # Entry point
├── package.json
├── .env                      # Environment variables
├── docs/
│   └── ENTERPRISE_RBAC.md    # RBAC documentation
└── src/
    ├── app.js                # Express app configuration
    ├── config/
    │   ├── auth.js           # JWT configuration
    │   ├── database.js       # Sequelize configuration
    │   ├── gemini.js         # Gemini AI configuration
    │   ├── multer.js         # File upload configuration
    │   ├── rbacConfig.js     # 🔐 RBAC configuration & matrices
    │   ├── redis.js          # Redis configuration
    │   └── socket.js         # Socket.IO configuration
    ├── controllers/
    │   ├── activityController.js
    │   ├── aiController.js
    │   ├── attachmentController.js
    │   ├── authController.js
    │   ├── commentController.js
    │   ├── departmentController.js
    │   ├── exportController.js
    │   ├── labelController.js
    │   ├── notificationController.js
    │   ├── projectController.js
    │   ├── rbacController.js      # 🔐 RBAC management
    │   ├── reportController.js
    │   ├── sprintController.js
    │   ├── taskController.js
    │   ├── teamController.js
    │   ├── timeLogController.js
    │   └── userController.js
    ├── middleware/
    │   ├── activityLogger.js
    │   ├── aiRateLimiter.js
    │   ├── auth.js               # JWT verification
    │   ├── errorHandler.js
    │   ├── roleCheck.js          # Legacy role check
    │   ├── roleCheckAdvanced.js  # 🔐 Enterprise RBAC middleware
    │   └── validation.js
    ├── migrations/
    │   └── 20251210_enterprise_rbac.sql  # 🔐 RBAC schema
    ├── models/
    │   ├── index.js              # Model associations
    │   ├── ActivityLog.js
    │   ├── AiCache.js
    │   ├── AiSetting.js
    │   ├── AiUsageLog.js
    │   ├── Attachment.js
    │   ├── Comment.js
    │   ├── Department.js
    │   ├── DepartmentMember.js   # 🔐 Division memberships
    │   ├── Label.js
    │   ├── Notification.js
    │   ├── PermissionAuditLog.js # 🔐 Audit trail
    │   ├── Project.js
    │   ├── ProjectMember.js      # 🔐 + new project roles
    │   ├── RbacPermission.js     # 🔐 Permission definitions
    │   ├── RolePermission.js     # 🔐 Role-permission mapping
    │   ├── Sprint.js
    │   ├── Task.js
    │   ├── TaskLabel.js
    │   ├── Team.js
    │   ├── TeamMember.js         # 🔐 + new team roles
    │   ├── TimeLog.js
    │   ├── User.js               # 🔐 + system_role, institution_role
    │   └── UserRoleAssignment.js # 🔐 Dynamic role assignment
    ├── routes/
    │   ├── index.js              # Route aggregator
    │   ├── activityRoutes.js
    │   ├── aiRoutes.js
    │   ├── attachmentRoutes.js
    │   ├── authRoutes.js
    │   ├── commentRoutes.js
    │   ├── departmentRoutes.js
    │   ├── exampleRbacRoutes.js  # 🔐 RBAC usage examples
    │   ├── labelRoutes.js
    │   ├── notificationRoutes.js
    │   ├── projectRoutes.js
    │   ├── rbacRoutes.js         # 🔐 RBAC management API
    │   ├── rbacRoutesV2.js       # 🔐 RBAC API v2
    │   ├── reportRoutes.js
    │   ├── sprintRoutes.js
    │   ├── taskRoutes.js
    │   ├── teamRoutes.js
    │   ├── timeLogRoutes.js
    │   └── userRoutes.js
    ├── seeders/
    │   └── rbacSeeder.js         # 🔐 RBAC data seeder
    ├── services/
    │   ├── aiQueueService.js
    │   ├── geminiService.js
    │   └── notificationService.js
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
    │   ├── auth/
    │   │   └── PrivateRoute.jsx
    │   ├── common/
    │   ├── kanban/
    │   ├── layout/
    │   │   └── Header.jsx
    │   ├── notification/
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
    │   ├── TeamManagement.jsx
    │   └── UserRoleManagement.jsx  # 🔐 RBAC management UI
    ├── services/
    │   ├── api.js
    │   ├── aiService.js
    │   ├── authService.js
    │   ├── commentService.js
    │   ├── projectService.js
    │   ├── rbacService.js    # 🔐 RBAC API service
    │   ├── sprintService.js
    │   ├── taskService.js
    │   ├── teamService.js
    │   └── userService.js
    └── styles/
        └── index.css
```

---

## 4. Database Schema

### 4.1 Complete ERD with RBAC

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│     Users       │────<│  department_members  │>────│   Departments   │
│                 │     └──────────────────────┘     │                 │
│ + system_role   │                                  │                 │
│ + institution_  │     ┌──────────────────────┐     │                 │
│   role          │────<│    team_members      │>────│     Teams       │
└─────────────────┘     │                      │     └─────────────────┘
         │              │ + team_admin         │
         │              │ + scrum_master       │
         │              │ + product_owner      │
         │              │ + qa_lead            │
         │              └──────────────────────┘
         │
         │              ┌──────────────────────┐     ┌─────────────────┐
         └─────────────<│   project_members    │>────│    Projects     │
                        │                      │     │                 │
                        │ + project_owner      │     │                 │
                        │ + tech_lead          │     │                 │
                        │ + qa_tester          │     │                 │
                        │ + stakeholder        │     │                 │
                        └──────────────────────┘     └─────────────────┘

┌─────────────────┐     ┌──────────────────────┐
│rbac_permissions │────<│  role_permissions    │
│                 │     │                      │
│ code            │     │ + is_conditional     │
│ category        │     │ + condition_type     │
└─────────────────┘     └──────────────────────┘

┌─────────────────┐     ┌──────────────────────┐
│     Users       │────<│user_role_assignments │
│                 │     │                      │
│                 │     │ + valid_from         │
│                 │     │ + valid_until        │
│                 │     └──────────────────────┘
│                 │
│                 │     ┌──────────────────────┐
│                 │────<│permission_audit_logs │
│                 │     │                      │
└─────────────────┘     └──────────────────────┘
```

### 4.2 Core Tables

#### Users (Updated with RBAC)

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100),
  avatar_url VARCHAR(255),
  role ENUM('admin', 'project_manager', 'developer', 'viewer') DEFAULT 'developer',
  -- 🔐 NEW RBAC Fields
  system_role ENUM('super_admin', 'admin', 'security_officer', 'ai_admin') NULL,
  institution_role VARCHAR(50) NULL COMMENT 'Jabatan: Superadmin, Admin Sistem, Manager, HRD, Kepala Divisi, Project Manager, Staff',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  last_login DATETIME,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_users_system_role (system_role),
  INDEX idx_users_institution_role (institution_role)
);
```

#### Department Members (NEW - RBAC)

```sql
CREATE TABLE department_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM('division_head', 'division_manager', 'division_viewer', 'hr_reviewer')
       NOT NULL DEFAULT 'division_viewer',
  position VARCHAR(100) NULL,
  is_head BOOLEAN DEFAULT FALSE,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dept_user (department_id, user_id),
  INDEX idx_dept_members_role (role)
);
```

#### Team Members (Updated with RBAC)

```sql
CREATE TABLE team_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  team_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM(
    'member', 'lead', 'admin',  -- Legacy roles
    'team_admin', 'team_lead', 'scrum_master',
    'product_owner', 'qa_lead'  -- 🔐 New RBAC roles
  ) DEFAULT 'member',
  position VARCHAR(100) NULL,
  specialization VARCHAR(100) NULL COMMENT 'frontend, backend, devops, qa, etc.',
  capacity_percentage INT DEFAULT 100 COMMENT '0-100%',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY (team_id, user_id),
  INDEX idx_team_members_role (role)
);
```

#### Project Members (Updated with RBAC)

```sql
CREATE TABLE project_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  project_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM(
    'owner', 'manager', 'developer', 'viewer',  -- Legacy roles
    'project_owner', 'project_manager', 'tech_lead',
    'qa_tester', 'report_viewer', 'stakeholder'  -- 🔐 New RBAC roles
  ) DEFAULT 'developer',
  is_primary BOOLEAN DEFAULT FALSE,
  allocation_percentage INT DEFAULT 100 COMMENT '0-100%',
  can_approve BOOLEAN DEFAULT FALSE,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY (project_id, user_id),
  INDEX idx_project_members_role (role)
);
```

### 4.3 RBAC Tables (NEW)

#### RBAC Permissions

```sql
CREATE TABLE rbac_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category ENUM('system', 'division', 'team', 'project', 'common') NOT NULL DEFAULT 'common',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_permissions_code (code),
  INDEX idx_permissions_category (category)
);
```

#### Role Permissions

```sql
CREATE TABLE role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_type ENUM('system', 'division', 'team', 'project') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  permission_id INT NOT NULL,
  is_conditional BOOLEAN DEFAULT FALSE,
  condition_type VARCHAR(50) NULL COMMENT 'own_only, partial, qa_fields_only',
  condition_config JSON NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (permission_id) REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  UNIQUE KEY unique_role_permission (role_type, role_name, permission_id)
);
```

#### User Role Assignments

```sql
CREATE TABLE user_role_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_type ENUM('system', 'division', 'team', 'project') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NULL COMMENT 'department, team, project',
  resource_id INT NULL,
  assigned_by INT NOT NULL,
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NULL COMMENT 'NULL = permanent',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_role_assign_validity (valid_from, valid_until)
);
```

#### Permission Audit Logs

```sql
CREATE TABLE permission_audit_logs (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL COMMENT 'User yang melakukan perubahan',
  target_user_id INT NOT NULL COMMENT 'User yang rolenya diubah',
  action ENUM('grant', 'revoke', 'modify') NOT NULL,
  role_type VARCHAR(50) NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NULL,
  resource_id INT NULL,
  old_role VARCHAR(50) NULL,
  new_role VARCHAR(50) NULL,
  reason TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_perm_audit_created (created_at)
);
```

---

## 5. Enterprise RBAC System

### 5.1 Konsep Multi-Layer RBAC

Enterprise RBAC System mengimplementasikan **4-layer role hierarchy** dengan prioritas resolusi:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    PRIORITY: SYSTEM > DIVISION > TEAM > PROJECT             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       SYSTEM LEVEL (Global)                          │   │
│   │    super_admin │ admin │ security_officer │ ai_admin                 │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                      DIVISION LEVEL (Per Divisi)                     │   │
│   │    division_head │ division_manager │ division_viewer │ hr_reviewer  │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                       TEAM LEVEL (Per Team)                          │   │
│   │   team_admin │ team_lead │ scrum_master │ product_owner │ qa_lead   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                    ▼                                         │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │                     PROJECT LEVEL (Per Project)                      │   │
│   │  project_owner │ project_manager │ tech_lead │ qa_tester │ developer│   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Formula Effective Permission:**

```
FinalAccess = SystemRole ∪ DivisionRole ∪ TeamRole ∪ ProjectRole
```

### 5.2 Role Definitions

#### 5.2.1 System-Level Roles

| Role               | Deskripsi                                                      | Override |
| ------------------ | -------------------------------------------------------------- | -------- |
| `super_admin`      | Full access ke seluruh sistem, dapat override semua permission | ✅ Ya    |
| `admin`            | Manage users, departments, teams, projects                     | ❌ Tidak |
| `security_officer` | Audit logs dan security monitoring                             | ❌ Tidak |
| `ai_admin`         | Konfigurasi AI settings                                        | ❌ Tidak |

#### 5.2.2 Division-Level Roles

| Role               | Deskripsi                                     |
| ------------------ | --------------------------------------------- |
| `division_head`    | Kepala divisi - full access dalam divisi      |
| `division_manager` | Manager divisi - manage tapi tidak bisa hapus |
| `division_viewer`  | Hanya lihat data divisi                       |
| `hr_reviewer`      | HRD - approve workflow, cuti, delegasi        |

#### 5.2.3 Team-Level Roles

| Role            | Deskripsi                         |
| --------------- | --------------------------------- |
| `team_admin`    | Admin tim - full access tim       |
| `team_lead`     | Lead tim - manage members & tasks |
| `scrum_master`  | Manage sprint & ceremonies        |
| `product_owner` | Prioritize backlog                |
| `qa_lead`       | QA approval & testing             |
| `member`        | Anggota biasa                     |

#### 5.2.4 Project-Level Roles

| Role              | Deskripsi                                 |
| ----------------- | ----------------------------------------- |
| `project_owner`   | Pemilik project - full access             |
| `project_manager` | Manager project - manage tapi tidak hapus |
| `tech_lead`       | Technical lead - edit sprint & tasks      |
| `qa_tester`       | QA testing - edit QA fields only          |
| `developer`       | Developer - edit own tasks                |
| `report_viewer`   | Hanya lihat report                        |
| `stakeholder`     | External stakeholder - view only          |

### 5.3 RBAC Permission Matrix

#### 5.3.1 System-Level Permissions

| Aksi                    | super_admin | admin | security_officer | ai_admin |
| ----------------------- | :---------: | :---: | :--------------: | :------: |
| Kelola seluruh pengguna |     ✅      |  ✅   |        ❌        |    ❌    |
| Kelola roles global     |     ✅      |  ✅   |        ❌        |    ❌    |
| Kelola departments      |     ✅      |  ✅   |        ❌        |    ❌    |
| Kelola teams            |     ✅      |  ✅   |        ❌        |    ❌    |
| Kelola semua project    |     ✅      |  ✅   |        ❌        |    ❌    |
| Lihat audit logs        |     ✅      |  🟧   |        ✅        |    ❌    |
| Kelola audit logs       |     ✅      |  ❌   |        ✅        |    ❌    |
| Kelola AI               |     ✅      |  ✅   |        ❌        |    ✅    |
| Override permission     |     ✅      |  ❌   |        ❌        |    ❌    |
| Lihat semua report      |     ✅      |  ✅   |        ✅        |    ✅    |

**Legend:** ✅ = Full Access | 🟧 = Conditional/Partial | ❌ = No Access

#### 5.3.2 Division-Level Permissions

| Aksi                       | division_head | division_manager | division_viewer | hr_reviewer |
| -------------------------- | :-----------: | :--------------: | :-------------: | :---------: |
| Lihat semua project divisi |      ✅       |        ✅        |       ✅        |     🟧      |
| Buat project               |      ✅       |        ✅        |       ❌        |     ❌      |
| Edit project               |      ✅       |        ✅        |       ❌        |     ❌      |
| Hapus project              |      ✅       |        ❌        |       ❌        |     ❌      |
| Lihat sprint/task divisi   |      ✅       |        ✅        |       🟧        |     🟧      |
| Approve workflow           |      ✅       |        ✅        |       ❌        |     ✅      |
| Kelola anggota divisi      |      ✅       |        ✅        |       ❌        |     ❌      |
| Kelola tim                 |      ✅       |        ✅        |       ❌        |     ❌      |
| Cuti & delegasi otomatis   |      ❌       |        ❌        |       ❌        |     ✅      |

#### 5.3.3 Team-Level Permissions

| Aksi                | team_admin | team_lead | scrum_master | product_owner | qa_lead | member |
| ------------------- | :--------: | :-------: | :----------: | :-----------: | :-----: | :----: |
| Manage team members |     ✅     |    🟧     |      ❌      |      ❌       |   ❌    |   ❌   |
| Assign task         |     ✅     |    ✅     |      ✅      |      ✅       |   ❌    |   ❌   |
| Prioritize backlog  |     ✅     |    ✅     |      ❌      |      ✅       |   ❌    |   ❌   |
| Manage sprint       |     ✅     |    ✅     |      ✅      |      ❌       |   ❌    |   ❌   |
| Start/end sprint    |     ✅     |    ✅     |      ✅      |      ❌       |   ❌    |   ❌   |
| QA approval         |     ❌     |    ❌     |      ❌      |      ❌       |   ✅    |   ❌   |
| Edit task           |     ✅     |    ✅     |      ✅      |      ✅       |   ✅    |   🟧   |
| Move task kanban    |     ✅     |    ✅     |      ✅      |      ✅       |   ✅    |   ✅   |
| Delete task         |     ✅     |    ✅     |      ❌      |      ❌       |   ❌    |   ❌   |

#### 5.3.4 Project-Level Permissions

| Aksi                | project_owner | project_manager | tech_lead | qa_tester | developer | report_viewer | stakeholder |
| ------------------- | :-----------: | :-------------: | :-------: | :-------: | :-------: | :-----------: | :---------: |
| Edit project        |      ✅       |       ✅        |    ❌     |    ❌     |    ❌     |      ❌       |     ❌      |
| Delete project      |      ✅       |       ❌        |    ❌     |    ❌     |    ❌     |      ❌       |     ❌      |
| Create sprint       |      ✅       |       ✅        |    ❌     |    ❌     |    ❌     |      ❌       |     ❌      |
| Edit sprint         |      ✅       |       ✅        |    🟧     |    ❌     |    ❌     |      ❌       |     ❌      |
| Create task         |      ✅       |       ✅        |    ✅     |    ❌     |    ✅     |      ❌       |     ❌      |
| Edit task           |      ✅       |       ✅        |    ✅     |    🟧     |    🟧     |      ❌       |     ❌      |
| QA testing          |      ❌       |       ❌        |    ❌     |    ✅     |    ❌     |      ❌       |     ❌      |
| Change status       |      ✅       |       ✅        |    ✅     |    ✅     |    🟧     |      ❌       |     ❌      |
| View report         |      ✅       |       ✅        |    ✅     |    ✅     |    🟧     |      ✅       |     ✅      |
| Workload management |      ✅       |       ✅        |    ✅     |    ❌     |    ❌     |      ❌       |     ❌      |

### 5.4 Conditional Permissions

| Rule Key                        | Condition        | Deskripsi                                                    |
| ------------------------------- | ---------------- | ------------------------------------------------------------ |
| `member:edit_task`              | `own_only`       | Member hanya bisa edit task yang di-assign ke dirinya        |
| `developer:edit_task_details`   | `own_only`       | Developer hanya bisa edit task sendiri                       |
| `developer:change_task_status`  | `own_only`       | Developer hanya bisa ubah status task sendiri                |
| `qa_tester:edit_task_details`   | `qa_fields_only` | QA hanya bisa edit field: qa_status, test_notes, bug_details |
| `tech_lead:edit_sprint`         | `partial`        | Tech lead bisa edit detail tapi tidak start/complete         |
| `team_lead:manage_team_members` | `partial`        | Bisa add/remove tapi tidak bisa assign role admin            |
| `admin:view_audit_logs`         | `partial`        | Bisa lihat log tapi tanpa sensitive data                     |

### 5.5 Institution Mapping

#### Role Jabatan Instansi → System Role

| Jabatan Instansi | System Role   | Division Role      |
| ---------------- | ------------- | ------------------ |
| Superadmin       | `super_admin` | -                  |
| Admin Sistem     | `admin`       | -                  |
| Manager          | -             | `division_manager` |
| HRD              | -             | `hr_reviewer`      |
| Kepala Divisi    | -             | `division_head`    |
| Project Manager  | -             | `project_manager`  |
| Staff            | -             | `member`           |

#### Divisi Instansi → Department

| Divisi          | Department Code | Deskripsi                       |
| --------------- | --------------- | ------------------------------- |
| IT              | `IT`            | Information Technology Division |
| HRD             | `HRD`           | Human Resources Development     |
| Finance         | `FIN`           | Finance Division                |
| Admin Marketing | `ADM`           | Admin Marketing Division        |
| Marketing       | `MKT`           | Marketing Division              |
| Instruktur      | `INS`           | Instructor Division             |

#### Project Instansi

| Project               | Code    | Deskripsi                             |
| --------------------- | ------- | ------------------------------------- |
| Aplikasi              | `APP`   | Internal Application Development      |
| Instruktur            | `INS`   | Instructor Management System          |
| Muliartha             | `MUL`   | Muliartha Project                     |
| LSP Digital Marketing | `LSPDM` | LSP Digital Marketing                 |
| LSP AI Indonesia      | `LSPAI` | LSP Artificial Intelligence Indonesia |
| Asosiasi AI           | `AAI`   | Asosiasi Artificial Intelligence      |
| Digimind              | `DGM`   | Digimind Project                      |

### 5.6 Middleware Implementation

#### Basic Usage

```javascript
const {
  roleCheckAdvanced,
  SYSTEM_ROLES,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

// Check specific roles
router.post(
  "/projects",
  auth,
  roleCheckAdvanced({
    roles: [SYSTEM_ROLES.SUPER_ADMIN, SYSTEM_ROLES.ADMIN],
  }),
  createProject
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

// Combined roles + permissions with ownership check
router.put(
  "/tasks/:id",
  auth,
  roleCheckAdvanced({
    roles: [PROJECT_ROLES.PROJECT_MANAGER, PROJECT_ROLES.TECH_LEAD],
    permissions: [PERMISSIONS.EDIT_TASK],
    checkOwnership: true,
    resourceType: "task",
    resourceIdParam: "id",
  }),
  updateTask
);
```

#### Convenience Middlewares

```javascript
const {
  requireSystemAdmin,
  requireSuperAdmin,
  requireDivisionLead,
  requireProjectManager,
  requireSprintManager,
  requireTaskEditor,
  requireTeamManager,
  requireAiAdmin,
} = require("../middleware/roleCheckAdvanced");

// Quick shortcuts
router.delete("/users/:id", auth, requireSuperAdmin(), deleteUser);
router.post("/sprints/:id/start", auth, requireSprintManager(), startSprint);
router.put("/ai/settings", auth, requireAiAdmin(), updateAiSettings);
```

### 5.7 Usage Scenarios

#### Scenario 1: Developer Edit Own Task

```javascript
// Developer wants to edit task assigned to them
PUT /api/tasks/123
Authorization: Bearer <token>

// Middleware checks:
// 1. User has permission EDIT_TASK? → Conditional (own_only)
// 2. Is task.assigned_to === user.id? → Yes
// 3. Result: ALLOWED
```

#### Scenario 2: Scrum Master Start Sprint

```javascript
// Scrum Master wants to start sprint
POST /api/sprints/5/start
Authorization: Bearer <token>

// Middleware checks:
// 1. User has role scrum_master? → Yes
// 2. User has permission START_END_SPRINT? → Yes
// 3. Result: ALLOWED
```

#### Scenario 3: Super Admin Override

```javascript
// Super Admin always has access to everything
DELETE /api/projects/5
Authorization: Bearer <super_admin_token>

// Middleware checks:
// 1. User has system_role === 'super_admin'? → Yes
// 2. Result: ALLOWED (bypass all other checks)
```

---

## 6. Fitur-Fitur Aplikasi

### 6.1 Authentication & Authorization

#### Login Flow

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Login   │ →  │  POST    │ →  │ Validate │ →  │  Return  │
│  Form    │    │  /auth/  │    │ Password │    │ JWT +    │
│          │    │  login   │    │ & User   │    │ Roles    │
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

### 6.5 Team & Organization Management

#### Organization Structure

```
┌────────────────────────────────────────────────────────────┐
│                     ORGANIZATION                            │
│                                                             │
│  ┌─────────────────┐     ┌─────────────────┐               │
│  │   Department    │     │   Department    │               │
│  │  (IT Division)  │     │ (HRD Division)  │               │
│  │                 │     │                 │               │
│  │ division_head   │     │ hr_reviewer     │               │
│  └────────┬────────┘     └────────┬────────┘               │
│           │                       │                         │
│     ┌─────┴─────┐           ┌─────┴─────┐                  │
│     │           │           │           │                   │
│  ┌──┴──┐     ┌──┴──┐     ┌──┴──┐     ┌──┴──┐              │
│  │Team │     │Team │     │Team │     │Team │              │
│  │Dev  │     │ QA  │     │ HR  │     │Train│              │
│  │     │     │     │     │     │     │     │              │
│  │team_│     │qa_  │     │team_│     │team_│              │
│  │lead │     │lead │     │lead │     │lead │              │
│  └─────┘     └─────┘     └─────┘     └─────┘              │
│                                                             │
└────────────────────────────────────────────────────────────┘
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

### 6.7 AI Assistant (Gemini)

#### AI Features

1. **Task Suggestions** - Saran untuk breakdown task
2. **Sprint Planning** - Rekomendasi kapasitas sprint
3. **Bug Analysis** - Analisis dan saran fix bug
4. **Code Review** - Review kode otomatis
5. **Daily Summary** - Ringkasan aktivitas harian

### 6.8 RBAC Management (NEW!)

- User Role Assignment
- Permission Management
- Dynamic Role Assignment dengan validity period
- Permission Audit Logs
- Role-Permission Mapping

---

## 7. API Endpoints

### 7.1 Authentication

| Method | Endpoint             | Description                 | Auth |
| ------ | -------------------- | --------------------------- | ---- |
| POST   | `/api/auth/register` | Register user baru          | ❌   |
| POST   | `/api/auth/login`    | Login user                  | ❌   |
| POST   | `/api/auth/logout`   | Logout user                 | ✅   |
| GET    | `/api/auth/me`       | Get current user with roles | ✅   |
| POST   | `/api/auth/refresh`  | Refresh token               | ✅   |

### 7.2 RBAC Management (NEW!)

| Method | Endpoint                              | Description                      | Auth | Role             |
| ------ | ------------------------------------- | -------------------------------- | ---- | ---------------- |
| GET    | `/api/rbac/permissions`               | Get all permissions              | ✅   | Admin            |
| GET    | `/api/rbac/role-definitions`          | Get role definitions for UI      | ✅   | All              |
| GET    | `/api/rbac/dashboard`                 | Get RBAC statistics              | ✅   | Admin            |
| GET    | `/api/rbac/users/:userId/roles`       | Get user roles across all layers | ✅   | Admin            |
| PUT    | `/api/rbac/users/:userId/system-role` | Update system role               | ✅   | Super Admin      |
| POST   | `/api/rbac/users/:userId/assignments` | Create temporary role assignment | ✅   | Admin            |
| GET    | `/api/rbac/my-permissions`            | Get current user's permissions   | ✅   | All              |
| POST   | `/api/rbac/check-permission`          | Check specific permission        | ✅   | All              |
| GET    | `/api/rbac/audit-logs`                | Get permission audit logs        | ✅   | Security Officer |

### 7.3 Projects (with RBAC)

| Method | Endpoint                       | Description           | Auth | Permission       |
| ------ | ------------------------------ | --------------------- | ---- | ---------------- |
| GET    | `/api/projects`                | Get all user projects | ✅   | `view_project`   |
| POST   | `/api/projects`                | Create project        | ✅   | `create_project` |
| GET    | `/api/projects/:id`            | Get project detail    | ✅   | `view_project`   |
| PUT    | `/api/projects/:id`            | Update project        | ✅   | `edit_project`   |
| DELETE | `/api/projects/:id`            | Delete project        | ✅   | `delete_project` |
| GET    | `/api/projects/:id/statistics` | Get project stats     | ✅   | `view_report`    |

### 7.4 Tasks (with RBAC)

| Method | Endpoint                               | Description            | Auth | Permission                    |
| ------ | -------------------------------------- | ---------------------- | ---- | ----------------------------- |
| POST   | `/api/tasks/projects/:projectId/tasks` | Create task            | ✅   | `create_task`                 |
| GET    | `/api/tasks/projects/:projectId/tasks` | Get project tasks      | ✅   | `view_task`                   |
| GET    | `/api/tasks/:id`                       | Get task detail        | ✅   | `view_task`                   |
| PUT    | `/api/tasks/:id`                       | Update task            | ✅   | `edit_task` / `edit_own_task` |
| PUT    | `/api/tasks/:id/status`                | Update status (Kanban) | ✅   | `change_task_status`          |
| DELETE | `/api/tasks/:id`                       | Delete task            | ✅   | `delete_task`                 |

### 7.5 Sprints (with RBAC)

| Method | Endpoint                                   | Description     | Auth | Permission       |
| ------ | ------------------------------------------ | --------------- | ---- | ---------------- |
| POST   | `/api/sprints/projects/:projectId/sprints` | Create sprint   | ✅   | `manage_sprints` |
| PUT    | `/api/sprints/:id`                         | Update sprint   | ✅   | `manage_sprints` |
| DELETE | `/api/sprints/:id`                         | Delete sprint   | ✅   | `manage_sprints` |
| POST   | `/api/sprints/:id/start`                   | Start sprint    | ✅   | `manage_sprints` |
| POST   | `/api/sprints/:id/complete`                | Complete sprint | ✅   | `manage_sprints` |

### 7.6 Departments

| Method | Endpoint                       | Description         | Auth | Permission                |
| ------ | ------------------------------ | ------------------- | ---- | ------------------------- |
| GET    | `/api/departments`             | Get all departments | ✅   | All                       |
| POST   | `/api/departments`             | Create department   | ✅   | `manage_departments`      |
| PUT    | `/api/departments/:id`         | Update department   | ✅   | `manage_departments`      |
| DELETE | `/api/departments/:id`         | Delete department   | ✅   | `manage_departments`      |
| POST   | `/api/departments/:id/members` | Add division member | ✅   | `manage_division_members` |

### 7.7 Teams

| Method | Endpoint                         | Description        | Auth | Permission              |
| ------ | -------------------------------- | ------------------ | ---- | ----------------------- |
| GET    | `/api/teams`                     | Get all teams      | ✅   | All                     |
| POST   | `/api/teams`                     | Create team        | ✅   | `manage_division_teams` |
| POST   | `/api/teams/:id/members`         | Add team member    | ✅   | `manage_team_members`   |
| PUT    | `/api/teams/:id/members/:userId` | Update member role | ✅   | `manage_team_members`   |

### 7.8 AI

| Method | Endpoint              | Description              | Auth | Permission        |
| ------ | --------------------- | ------------------------ | ---- | ----------------- |
| POST   | `/api/ai/chat/stream` | Chat with AI (streaming) | ✅   | `use_ai_features` |
| GET    | `/api/ai/settings`    | Get AI settings          | ✅   | `manage_ai`       |
| PUT    | `/api/ai/settings`    | Update AI settings       | ✅   | `manage_ai`       |

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

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# Database Auto-Sync Configuration
DB_AUTO_SYNC=false
DB_SYNC_MODE=alter

# Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.0-flash
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

# RBAC Configuration
RBAC_DEBUG=false
RBAC_CACHE_TTL=3600
```

---

## 9. Panduan Instalasi

### 9.1 Prerequisites

- Node.js v18+
- MySQL 8.0+
- Redis (optional, untuk AI queue & RBAC caching)
- Git

### 9.2 Setup Database

```sql
CREATE DATABASE mpm_agile_tools;
```

### 9.3 Run RBAC Migration

```bash
# Login to MySQL
mysql -u root -p mpm_agile_tools < backend/src/migrations/20251210_enterprise_rbac.sql
```

### 9.4 Seed RBAC Data

```bash
cd backend
node src/seeders/rbacSeeder.js
```

### 9.5 Setup Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your configuration
npm run dev
```

### 9.6 Setup Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## 10. Panduan Penggunaan

### 10.1 Setup RBAC Pertama Kali

1. **Create Super Admin**

   - Register user pertama via `/register`
   - Update system_role di database:

   ```sql
   UPDATE users SET system_role = 'super_admin' WHERE email = 'admin@example.com';
   ```

2. **Setup Departments (Divisi)**

   - Login sebagai Super Admin
   - Buka menu Departments
   - Tambahkan divisi: IT, HRD, Finance, dll

3. **Setup Teams**

   - Buat team di dalam department
   - Assign team lead dan members

4. **Setup Projects**
   - Buat project baru
   - Assign project members dengan role yang sesuai

### 10.2 Assign Roles

#### Via API

```javascript
// Update user's system role (Super Admin only)
PUT /api/rbac/users/5/system-role
{
  "system_role": "admin",
  "institution_role": "Admin Sistem",
  "reason": "Promoted to admin"
}

// Create temporary role assignment
POST /api/rbac/users/5/assignments
{
  "role_type": "project",
  "role_name": "project_manager",
  "resource_type": "project",
  "resource_id": 3,
  "valid_from": "2025-01-01",
  "valid_until": "2025-03-31",
  "notes": "Temporary PM for Q1 project"
}
```

### 10.3 Check Permissions

```javascript
// Get current user's effective permissions
GET /api/rbac/my-permissions?project_id=5

// Response
{
  "success": true,
  "data": {
    "userId": 1,
    "context": { "projectId": 5 },
    "roles": {
      "system": "admin",
      "division": null,
      "team": "team_lead",
      "project": "project_manager"
    },
    "permissions": ["create_task", "edit_task", "delete_task", ...],
    "permissionCount": 25
  }
}
```

---

## 📊 Summary

### Total Components

| Category            | Count |
| ------------------- | ----- |
| API Endpoints       | 100+  |
| Database Tables     | 23+   |
| RBAC Roles          | 21    |
| RBAC Permissions    | 40+   |
| Frontend Components | 45+   |

### Key Features

- ✅ Multi-Layer RBAC (4 levels)
- ✅ Conditional Permissions
- ✅ Super Admin Override
- ✅ Permission Audit Logging
- ✅ Dynamic Role Assignment
- ✅ Validity Period for Roles
- ✅ Institution Mapping
- ✅ AI Integration (Gemini)
- ✅ Real-time Notifications
- ✅ Kanban Board
- ✅ **Approval Workflow** (NEW!)
- ✅ **Leave & Delegation Management** (NEW!)

---

## 11. Approval Workflow & Delegation System (NEW!)

### 11.1 Overview

Sistem Approval Workflow dan Delegasi Tugas memungkinkan:

- Task memerlukan persetujuan sebelum lanjut ke tahap berikutnya
- User dapat mengajukan cuti dan menunjuk delegate
- Otomatis reassign task ke delegate saat user cuti
- Tracking history delegasi dan approval

### 11.2 Approval Workflow

#### Flow Approval

```
┌─────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│  Create │────▶│  Request  │────▶│  Pending │────▶│ Approved │
│   Task  │     │  Approval │     │  Review  │     │   /Done  │
└─────────┘     └───────────┘     └──────────┘     └──────────┘
                                        │
                                        ▼
                                  ┌──────────┐
                                  │ Rejected │
                                  └──────────┘
```

#### Approval Types

| Type              | Description                       |
| ----------------- | --------------------------------- |
| task_creation     | Approval saat task baru dibuat    |
| status_change     | Approval saat status task berubah |
| priority_change   | Approval saat prioritas berubah   |
| assignment_change | Approval saat task dipindahkan    |
| sprint_move       | Approval saat task pindah sprint  |
| qa_review         | QA Review sebelum task selesai    |

#### API Endpoints

| Method | Endpoint                    | Description                  |
| ------ | --------------------------- | ---------------------------- |
| GET    | /api/approvals/my-pending   | Get pending approvals for me |
| GET    | /api/approvals/pending      | Get all pending approvals    |
| GET    | /api/approvals/task/:taskId | Get approvals for a task     |
| GET    | /api/approvals/history      | Get approval history         |
| GET    | /api/approvals/stats        | Get approval statistics      |
| POST   | /api/approvals/request      | Request approval for a task  |
| PUT    | /api/approvals/:id/approve  | Approve a request            |
| PUT    | /api/approvals/:id/reject   | Reject a request             |
| PUT    | /api/approvals/:id/cancel   | Cancel a request             |

### 11.3 Leave & Delegation Management

#### Leave Flow

```
┌─────────┐     ┌───────────┐     ┌──────────┐     ┌──────────┐
│ Request │────▶│  Pending  │────▶│ Approved │────▶│  Active  │
│  Leave  │     │  Approval │     │          │     │          │
└─────────┘     └───────────┘     └──────────┘     └──────────┘
                      │                                  │
                      ▼                                  ▼
                ┌──────────┐                       ┌──────────┐
                │ Rejected │                       │ Complete │
                └──────────┘                       └──────────┘
```

#### Delegation Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                        LEAVE ACTIVATED                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Auto-delegate tasks to designated delegate (if enabled)           │
│  - All active tasks of user are reassigned                          │
│  - Delegation records created for tracking                          │
│  - Delegate receives notification                                   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        LEAVE COMPLETED                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐
    │ Return tasks to │             │ Keep tasks with │
    │ original owner  │             │    delegate     │
    └─────────────────┘             └─────────────────┘
```

#### Leave Types

| Type      | Description        |
| --------- | ------------------ |
| annual    | Cuti Tahunan       |
| sick      | Cuti Sakit         |
| personal  | Cuti Pribadi       |
| maternity | Cuti Melahirkan    |
| paternity | Cuti Ayah          |
| unpaid    | Cuti Tanpa Gaji    |
| remote    | Work From Home     |
| training  | Training/Pelatihan |
| other     | Lainnya            |

#### API Endpoints

| Method | Endpoint                               | Description                 |
| ------ | -------------------------------------- | --------------------------- |
| GET    | /api/leaves/my                         | Get my leave requests       |
| GET    | /api/leaves                            | Get all leaves (admin)      |
| GET    | /api/leaves/pending                    | Get pending leave approvals |
| POST   | /api/leaves                            | Create leave request        |
| PUT    | /api/leaves/:id                        | Update leave request        |
| DELETE | /api/leaves/:id                        | Cancel leave request        |
| POST   | /api/leaves/:id/approve                | Approve leave request       |
| POST   | /api/leaves/:id/reject                 | Reject leave request        |
| POST   | /api/leaves/:id/activate               | Activate leave (admin)      |
| POST   | /api/leaves/:id/complete               | Complete leave (admin)      |
| GET    | /api/leaves/delegations/my             | Get my delegations          |
| GET    | /api/leaves/users/:userId/leave-status | Check user leave status     |

### 11.4 Database Tables

| Table            | Description                        |
| ---------------- | ---------------------------------- |
| task_approvals   | Stores approval requests for tasks |
| user_leaves      | Stores user leave/absence records  |
| task_delegations | Stores task delegation history     |

### 11.5 RBAC Permissions

| Permission              | Roles                       |
| ----------------------- | --------------------------- |
| approve_workflow        | PM, Team Lead, Scrum Master |
| qa_approval             | QA Lead, Tech Lead          |
| manage_leave_delegation | Division Head, HR, Admin    |

### 11.6 Frontend Pages

| Page              | Path       | Description                      |
| ----------------- | ---------- | -------------------------------- |
| ApprovalDashboard | /approvals | View & manage approval requests  |
| LeaveManagement   | /leaves    | Request leave & view delegations |

---

> **Dokumentasi ini diupdate pada:** 12 Desember 2025  
> **Versi Aplikasi:** 2.1.0  
> **Maintained by:** MPM Agile Tools Team

---

**Built with ❤️ using Node.js, React, TailwindCSS, and Enterprise RBAC**
