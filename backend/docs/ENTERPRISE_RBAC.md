# 🔐 Enterprise RBAC System - Complete Documentation

> **MPM Agile Tools - Multi-Layer Role-Based Access Control**  
> Version: 2.0.0  
> Updated: 10 Desember 2025

---

## 📋 Daftar Isi

1. [Overview](#1-overview)
2. [Architecture](#2-architecture)
3. [Role Hierarchy](#3-role-hierarchy)
4. [RBAC Matrix](#4-rbac-matrix)
5. [Database Schema](#5-database-schema)
6. [Implementation Guide](#6-implementation-guide)
7. [API Reference](#7-api-reference)
8. [Usage Examples](#8-usage-examples)
9. [Institution Mapping](#9-institution-mapping)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

### 1.1 Konsep Dasar

Enterprise RBAC System mengimplementasikan **4-layer role hierarchy** dengan prioritas resolusi:

```
SYSTEM > DIVISION > TEAM > PROJECT
```

**Formula Effective Permission:**

```
FinalAccess = SystemRole ∪ DivisionRole ∪ TeamRole ∪ ProjectRole
```

### 1.2 Key Features

- ✅ Multi-layer role resolving
- ✅ Context-aware permission checking
- ✅ Super Admin override capability
- ✅ Conditional permissions (own_only, partial, qa_fields_only)
- ✅ Resource ownership validation
- ✅ Audit logging untuk semua perubahan permission
- ✅ Dynamic role assignment dengan validity period
- ✅ Backward compatible dengan role existing

### 1.3 Struktur Organisasi yang Didukung

**Divisi:**

- IT
- HRD
- Finance
- Admin Marketing
- Marketing
- Instruktur

**Role Jabatan Instansi:**

- Superadmin
- Admin Sistem
- Manager
- HRD
- Kepala Divisi (Kadiv)
- Project Manager
- Staff

**Project:**

- Aplikasi
- Instruktur
- Muliartha
- LSP Digital Marketing
- LSP Artificial Intelligence Indonesia
- Asosiasi AI
- Digimind

---

## 2. Architecture

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           REQUEST FLOW                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   Request → Auth Middleware → roleCheckAdvanced → Controller → Response     │
│                                      │                                       │
│                         ┌────────────┴────────────┐                         │
│                         │                         │                          │
│                         ▼                         ▼                          │
│              ┌──────────────────┐    ┌──────────────────┐                   │
│              │ Role Resolution  │    │Permission Check  │                   │
│              │                  │    │                  │                   │
│              │ • System Role    │    │ • Matrix Lookup  │                   │
│              │ • Division Role  │    │ • Conditional    │                   │
│              │ • Team Role      │    │ • Ownership      │                   │
│              │ • Project Role   │    │ • Override       │                   │
│              └──────────────────┘    └──────────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 File Structure

```
backend/src/
├── config/
│   └── rbacConfig.js          # RBAC configuration & permission matrices
├── middleware/
│   ├── auth.js                # JWT authentication
│   ├── roleCheck.js           # Legacy role check (backward compatible)
│   └── roleCheckAdvanced.js   # Enterprise RBAC middleware
├── models/
│   ├── User.js                # + system_role, institution_role
│   ├── DepartmentMember.js    # Division memberships
│   ├── TeamMember.js          # + new team roles
│   ├── ProjectMember.js       # + new project roles
│   ├── RbacPermission.js      # Permission definitions
│   ├── RolePermission.js      # Role-permission mapping
│   ├── UserRoleAssignment.js  # Dynamic role assignments
│   └── PermissionAuditLog.js  # Audit trail
├── routes/
│   ├── rbacRoutes.js          # RBAC management API
│   └── exampleRbacRoutes.js   # Usage examples
└── migrations/
    └── 20251210_enterprise_rbac.sql
```

### 2.3 Database ERD

```
┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│     Users       │────<│  department_members  │>────│   Departments   │
│                 │     └──────────────────────┘     │                 │
│ + system_role   │                                  │                 │
│ + institution_  │     ┌──────────────────────┐     │                 │
│   role          │────<│    team_members      │>────│     Teams       │
└─────────────────┘     │                      │     └─────────────────┘
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

┌─────────────────┐     ┌──────────────────────┐     ┌─────────────────┐
│rbac_permissions │────<│  role_permissions    │     │                 │
│                 │     │                      │     │                 │
│ code            │     │ + is_conditional     │     │                 │
│ category        │     │ + condition_type     │     │                 │
└─────────────────┘     └──────────────────────┘     └─────────────────┘

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

---

## 3. Role Hierarchy

### 3.1 System-Level Roles

Role dengan akses global ke seluruh sistem.

| Role               | Deskripsi                                  | Override |
| ------------------ | ------------------------------------------ | -------- |
| `super_admin`      | Full access ke seluruh sistem              | ✅ Ya    |
| `admin`            | Manage users, departments, teams, projects | ❌ Tidak |
| `security_officer` | Audit logs dan security monitoring         | ❌ Tidak |
| `ai_admin`         | Konfigurasi AI settings                    | ❌ Tidak |

### 3.2 Division-Level Roles

Role dalam konteks departemen/divisi.

| Role               | Deskripsi                                     |
| ------------------ | --------------------------------------------- |
| `division_head`    | Kepala divisi - full access dalam divisi      |
| `division_manager` | Manager divisi - manage tapi tidak bisa hapus |
| `division_viewer`  | Hanya lihat data divisi                       |
| `hr_reviewer`      | HRD - approve workflow, cuti, delegasi        |

### 3.3 Team-Level Roles

Role dalam konteks tim.

| Role            | Deskripsi                         |
| --------------- | --------------------------------- |
| `team_admin`    | Admin tim - full access tim       |
| `team_lead`     | Lead tim - manage members & tasks |
| `scrum_master`  | Manage sprint & ceremonies        |
| `product_owner` | Prioritize backlog                |
| `qa_lead`       | QA approval & testing             |
| `member`        | Anggota biasa                     |

### 3.4 Project-Level Roles

Role dalam konteks project.

| Role              | Deskripsi                                 |
| ----------------- | ----------------------------------------- |
| `project_owner`   | Pemilik project - full access             |
| `project_manager` | Manager project - manage tapi tidak hapus |
| `tech_lead`       | Technical lead - edit sprint & tasks      |
| `qa_tester`       | QA testing - edit QA fields only          |
| `developer`       | Developer - edit own tasks                |
| `report_viewer`   | Hanya lihat report                        |
| `stakeholder`     | External stakeholder - view only          |

---

## 4. RBAC Matrix

### 4.1 System-Level Permissions

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

### 4.2 Division-Level Permissions

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

### 4.3 Team-Level Permissions

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

### 4.4 Project-Level Permissions

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

---

## 5. Database Schema

### 5.1 ALTER users Table

```sql
ALTER TABLE users
ADD COLUMN system_role ENUM(
  'super_admin',
  'admin',
  'security_officer',
  'ai_admin'
) NULL DEFAULT NULL AFTER role,
ADD COLUMN institution_role VARCHAR(50) NULL
  COMMENT 'Role jabatan instansi' AFTER system_role;
```

### 5.2 CREATE department_members Table

```sql
CREATE TABLE department_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM(
    'division_head',
    'division_manager',
    'division_viewer',
    'hr_reviewer'
  ) NOT NULL DEFAULT 'division_viewer',
  position VARCHAR(100) NULL,
  is_head BOOLEAN DEFAULT FALSE,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_dept_user (department_id, user_id)
);
```

### 5.3 ALTER team_members Table

```sql
ALTER TABLE team_members
MODIFY COLUMN role ENUM(
  'member', 'lead', 'admin',
  'team_admin', 'team_lead', 'scrum_master',
  'product_owner', 'qa_lead'
) DEFAULT 'member',
ADD COLUMN specialization VARCHAR(100) NULL,
ADD COLUMN capacity_percentage INT DEFAULT 100;
```

### 5.4 ALTER project_members Table

```sql
ALTER TABLE project_members
MODIFY COLUMN role ENUM(
  'owner', 'manager', 'developer', 'viewer',
  'project_owner', 'project_manager', 'tech_lead',
  'qa_tester', 'report_viewer', 'stakeholder'
) DEFAULT 'developer',
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE,
ADD COLUMN allocation_percentage INT DEFAULT 100,
ADD COLUMN can_approve BOOLEAN DEFAULT FALSE;
```

### 5.5 RBAC Tables

Lihat file `migrations/20251210_enterprise_rbac.sql` untuk schema lengkap:

- `rbac_permissions`
- `role_permissions`
- `user_role_assignments`
- `permission_audit_logs`

---

## 6. Implementation Guide

### 6.1 Middleware Usage

#### Basic Role Check

```javascript
const {
  roleCheckAdvanced,
  SYSTEM_ROLES,
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
```

#### Permission-Based Check

```javascript
const {
  roleCheckAdvanced,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

// Check specific permissions
router.post(
  "/tasks",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.CREATE_TASK],
  }),
  createTask
);
```

#### Combined Roles + Permissions

```javascript
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

#### Require ALL Permissions

```javascript
router.post(
  "/bulk-delete",
  auth,
  roleCheckAdvanced({
    permissions: [PERMISSIONS.DELETE_TASK, PERMISSIONS.MANAGE_ALL_PROJECTS],
    requireAll: true, // Must have ALL permissions
  }),
  bulkDelete
);
```

### 6.2 Convenience Middleware

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

### 6.3 Controller-Level Permission Check

```javascript
const {
  checkPermission,
  checkRole,
} = require("../middleware/roleCheckAdvanced");

const updateSprint = async (req, res) => {
  // Check if user can change sprint status
  const canStartComplete = await checkPermission(
    req,
    PERMISSIONS.START_END_SPRINT
  );

  if (req.body.status && !canStartComplete) {
    return res.status(403).json({
      success: false,
      message: "You can edit sprint details but cannot change status",
    });
  }

  // Continue with update...
};
```

### 6.4 Get User Effective Permissions

```javascript
const {
  resolveEffectivePermissions,
} = require("../middleware/roleCheckAdvanced");

const getUserPermissions = async (userId, projectId) => {
  const { roles, permissions } = await resolveEffectivePermissions(userId, {
    projectId,
  });

  console.log("User roles:", roles);
  console.log("Effective permissions:", permissions);

  return permissions;
};
```

---

## 7. API Reference

### 7.1 Permission Management

#### GET /api/rbac/permissions

Get all permissions grouped by category.

**Response:**

```json
{
  "success": true,
  "data": {
    "permissions": [...],
    "grouped": {
      "system": [...],
      "division": [...],
      "team": [...],
      "project": [...],
      "common": [...]
    }
  }
}
```

### 7.2 User Role Management

#### GET /api/rbac/users/:userId/roles

Get all roles for a user across all layers.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {...},
    "systemRole": "admin",
    "institutionRole": "Manager",
    "divisionRoles": [
      { "departmentId": 1, "departmentName": "IT", "role": "division_manager" }
    ],
    "teamRoles": [
      { "teamId": 1, "teamName": "Dev Team", "role": "team_lead" }
    ],
    "projectRoles": [
      { "projectId": 1, "projectName": "Aplikasi", "role": "project_manager" }
    ]
  }
}
```

#### PUT /api/rbac/users/:userId/system-role

Update user's system role (Super Admin only).

**Request:**

```json
{
  "system_role": "admin",
  "institution_role": "Admin Sistem",
  "reason": "Promoted to admin"
}
```

### 7.3 Dynamic Role Assignment

#### POST /api/rbac/users/:userId/assignments

Create temporary role assignment with validity period.

**Request:**

```json
{
  "role_type": "project",
  "role_name": "project_manager",
  "resource_type": "project",
  "resource_id": 5,
  "valid_from": "2025-01-01",
  "valid_until": "2025-03-31",
  "notes": "Temporary PM for Q1 project"
}
```

### 7.4 Permission Check

#### GET /api/rbac/my-permissions

Get current user's effective permissions.

**Query Parameters:**

- `department_id` - Department context
- `team_id` - Team context
- `project_id` - Project context

**Response:**

```json
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

#### POST /api/rbac/check-permission

Check if user has specific permission.

**Request:**

```json
{
  "permission": "delete_task",
  "project_id": 5,
  "task_id": 123
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "permission": "delete_task",
    "allowed": true,
    "context": { "projectId": 5, "taskId": 123 }
  }
}
```

---

## 8. Usage Examples

### 8.1 Scenario: Developer Edit Own Task

```javascript
// Developer wants to edit task
// - Has project role: developer
// - Task assigned to them

PUT /api/tasks/123
Authorization: Bearer <token>

// Middleware checks:
// 1. User has permission EDIT_TASK? → Conditional (own_only)
// 2. Is task.assigned_to === user.id? → Yes
// 3. Result: ALLOWED
```

### 8.2 Scenario: Scrum Master Start Sprint

```javascript
// Scrum Master wants to start sprint
// - Has team role: scrum_master

POST /api/sprints/5/start
Authorization: Bearer <token>

// Middleware checks:
// 1. User has role scrum_master? → Yes
// 2. User has permission START_END_SPRINT? → Yes
// 3. Result: ALLOWED
```

### 8.3 Scenario: QA Tester Edit Task

```javascript
// QA Tester wants to edit task
// - Has project role: qa_tester

PUT /api/tasks/123
{
  "qa_status": "passed",
  "test_notes": "All tests passed"
}

// Middleware checks:
// 1. User has permission EDIT_TASK_DETAILS? → Conditional (qa_fields_only)
// 2. Only allowed fields: qa_status, test_notes, bug_details
// 3. Result: ALLOWED
```

### 8.4 Scenario: Super Admin Override

```javascript
// Super Admin always has access to everything

DELETE /api/projects/5
Authorization: Bearer <super_admin_token>

// Middleware checks:
// 1. User has system_role === 'super_admin'? → Yes
// 2. Result: ALLOWED (bypass all other checks)
```

---

## 9. Institution Mapping

### 9.1 Role Jabatan Instansi → System Role

| Jabatan Instansi | System Role   | Division Role      |
| ---------------- | ------------- | ------------------ |
| Superadmin       | `super_admin` | -                  |
| Admin Sistem     | `admin`       | -                  |
| Manager          | -             | `division_manager` |
| HRD              | -             | `hr_reviewer`      |
| Kepala Divisi    | -             | `division_head`    |
| Project Manager  | -             | `project_manager`  |
| Staff            | -             | `member`           |

### 9.2 Divisi → Department

| Divisi          | Department Code |
| --------------- | --------------- |
| IT              | `IT`            |
| HRD             | `HRD`           |
| Finance         | `FIN`           |
| Admin Marketing | `ADM`           |
| Marketing       | `MKT`           |
| Instruktur      | `INS`           |

### 9.3 Sample User Configuration

```javascript
// User: Kepala Divisi IT
{
  username: "kadiv_it",
  system_role: null, // Not system admin
  institution_role: "Kepala Divisi",

  // Division membership
  department_members: [
    { department: "IT", role: "division_head", is_head: true }
  ],

  // Team membership (optional)
  team_members: [
    { team: "Dev Team", role: "team_lead" }
  ],

  // Project membership
  project_members: [
    { project: "Aplikasi", role: "project_owner" },
    { project: "Digimind", role: "project_manager" }
  ]
}
```

---

## 10. Troubleshooting

### 10.1 Common Issues

#### "Insufficient role privileges"

```json
{
  "success": false,
  "message": "Insufficient role privileges",
  "required": ["project_manager", "tech_lead"],
  "current": ["developer"]
}
```

**Solution:** User doesn't have required role. Check user's role assignment.

#### "Insufficient permissions"

```json
{
  "success": false,
  "message": "Insufficient permissions",
  "required": ["delete_task"],
  "requireAll": false
}
```

**Solution:** User's role doesn't have required permission. Check role_permissions mapping.

#### "Resource ownership required"

**Solution:** For conditional permissions (own_only), user must be owner/assignee of the resource.

### 10.2 Debug Mode

Enable debug logging:

```javascript
// In roleCheckAdvanced.js
const DEBUG_RBAC = process.env.DEBUG_RBAC === "true";

if (DEBUG_RBAC) {
  console.log("RBAC Check:", {
    userId: user.id,
    roles: userRoles,
    permissions: userPermissions,
    required: options.permissions,
  });
}
```

### 10.3 Migration Issues

If you encounter issues with ENUM updates:

```sql
-- Check current ENUM values
SHOW COLUMNS FROM team_members WHERE Field = 'role';

-- Force update (backup first!)
ALTER TABLE team_members MODIFY COLUMN role VARCHAR(50);
-- Then run migration again
```

### 10.4 Performance Tips

1. **Cache effective permissions** - Consider Redis caching for frequently checked users
2. **Use context** - Always provide context (projectId, teamId) for accurate permission resolution
3. **Batch checks** - Use `resolveEffectivePermissions` once and cache in `req.userPermissions`

---

## Quick Reference Card

```javascript
// Import
const {
  roleCheckAdvanced,
  requireSystemAdmin,
  requireProjectManager,
  requireSprintManager,
  checkPermission,
  SYSTEM_ROLES,
  DIVISION_ROLES,
  TEAM_ROLES,
  PROJECT_ROLES,
  PERMISSIONS,
} = require("../middleware/roleCheckAdvanced");

// Basic patterns
router.post(
  "/resource",
  auth,
  roleCheckAdvanced({
    roles: [ROLE1, ROLE2], // User must have ONE of these roles
    permissions: [PERM1, PERM2], // User must have ONE of these permissions
    requireAll: false, // true = require ALL permissions
    checkOwnership: false, // true = verify resource ownership
    resourceType: "task", // Resource type for ownership check
    resourceIdParam: "id", // Request param with resource ID
  }),
  handler
);

// Shortcuts
router.delete("/users/:id", auth, requireSuperAdmin(), handler);
router.post("/sprints/:id/start", auth, requireSprintManager(), handler);
router.put("/ai/settings", auth, requireAiAdmin(), handler);

// In controller
const allowed = await checkPermission(req, PERMISSIONS.DELETE_TASK);
const isSuperAdmin = checkRole(req, SYSTEM_ROLES.SUPER_ADMIN);
```

---

**Built with ❤️ for MPM Agile Tools**

_Enterprise RBAC System v2.0.0 - December 2025_
