/**
 * =============================================================================
 * ENTERPRISE RBAC CONFIGURATION
 * =============================================================================
 * Multi-layer Role-Based Access Control untuk MPM Agile Tools
 *
 * Struktur Organisasi:
 * - Divisi: IT, HRD, Finance, Admin Marketing, Marketing, Instruktur
 * - Role Jabatan: Superadmin, Admin Sistem, Manager, HRD, Kepala Divisi, Project Manager, Staff
 * - Project: Aplikasi, Instruktur, Muliartha, LSP Digital Marketing, LSP AI Indonesia, Asosiasi AI, Digimind
 *
 * Layer Prioritas: SYSTEM > DIVISION > TEAM > PROJECT
 * =============================================================================
 */

// =============================================================================
// 1. SYSTEM-LEVEL ROLES
// =============================================================================
const SYSTEM_ROLES = {
  SUPER_ADMIN: "super_admin",
  ADMIN: "admin",
  SECURITY_OFFICER: "security_officer",
  AI_ADMIN: "ai_admin",
};

// =============================================================================
// 2. DIVISION-LEVEL ROLES
// =============================================================================
const DIVISION_ROLES = {
  DIVISION_HEAD: "division_head",
  DIVISION_MANAGER: "division_manager",
  DIVISION_VIEWER: "division_viewer",
  HR_REVIEWER: "hr_reviewer",
};

// =============================================================================
// 3. TEAM-LEVEL ROLES
// =============================================================================
const TEAM_ROLES = {
  TEAM_ADMIN: "team_admin",
  TEAM_LEAD: "team_lead",
  SCRUM_MASTER: "scrum_master",
  PRODUCT_OWNER: "product_owner",
  QA_LEAD: "qa_lead",
  MEMBER: "member",
};

// =============================================================================
// 4. PROJECT-LEVEL ROLES
// =============================================================================
const PROJECT_ROLES = {
  PROJECT_OWNER: "project_owner",
  PROJECT_MANAGER: "project_manager",
  TECH_LEAD: "tech_lead",
  QA_TESTER: "qa_tester",
  DEVELOPER: "developer",
  REPORT_VIEWER: "report_viewer",
  STAKEHOLDER: "stakeholder",
};

// =============================================================================
// MAPPING: ROLE JABATAN INSTANSI → SYSTEM ROLES
// =============================================================================
const INSTITUTION_ROLE_MAPPING = {
  Superadmin: SYSTEM_ROLES.SUPER_ADMIN,
  "Admin Sistem": SYSTEM_ROLES.ADMIN,
  Manager: DIVISION_ROLES.DIVISION_MANAGER,
  HRD: DIVISION_ROLES.HR_REVIEWER,
  "Kepala Divisi": DIVISION_ROLES.DIVISION_HEAD,
  "Project Manager": PROJECT_ROLES.PROJECT_MANAGER,
  Staff: TEAM_ROLES.MEMBER,
};

// =============================================================================
// MAPPING: DIVISI INSTANSI → DIVISION CODES
// =============================================================================
const DIVISIONS = {
  IT: {
    code: "IT",
    name: "IT",
    description: "Information Technology Division",
  },
  HRD: { code: "HRD", name: "HRD", description: "Human Resources Development" },
  FINANCE: { code: "FIN", name: "Finance", description: "Finance Division" },
  ADMIN_MARKETING: {
    code: "ADM",
    name: "Admin Marketing",
    description: "Admin Marketing Division",
  },
  MARKETING: {
    code: "MKT",
    name: "Marketing",
    description: "Marketing Division",
  },
  INSTRUKTUR: {
    code: "INS",
    name: "Instruktur",
    description: "Instructor Division",
  },
};

// =============================================================================
// MAPPING: PROJECT INSTANSI
// =============================================================================
const INSTITUTION_PROJECTS = {
  APLIKASI: {
    key: "APP",
    name: "Aplikasi",
    description: "Internal Application Development",
  },
  INSTRUKTUR: {
    key: "INS",
    name: "Instruktur",
    description: "Instructor Management System",
  },
  MULIARTHA: {
    key: "MUL",
    name: "Muliartha",
    description: "Muliartha Project",
  },
  LSP_DM: {
    key: "LSPDM",
    name: "LSP Digital Marketing",
    description: "LSP Digital Marketing",
  },
  LSP_AI: {
    key: "LSPAI",
    name: "LSP Artificial Intelligence Indonesia",
    description: "LSP AI Indonesia",
  },
  ASOSIASI_AI: {
    key: "AAI",
    name: "Asosiasi AI",
    description: "Asosiasi Artificial Intelligence",
  },
  DIGIMIND: { key: "DGM", name: "Digimind", description: "Digimind Project" },
};

// =============================================================================
// PERMISSION DEFINITIONS
// =============================================================================
const PERMISSIONS = {
  // System-level permissions
  MANAGE_USERS: "manage_users",
  MANAGE_ALL_USERS: "manage_all_users", // Alias for backward compatibility
  MANAGE_GLOBAL_ROLES: "manage_global_roles",
  MANAGE_DEPARTMENTS: "manage_departments",
  MANAGE_ALL_TEAMS: "manage_all_teams",
  MANAGE_TEAM: "manage_team", // Alias for team management
  MANAGE_ALL_PROJECTS: "manage_all_projects",
  VIEW_AUDIT_LOGS: "view_audit_logs",
  MANAGE_AUDIT_LOGS: "manage_audit_logs",
  MANAGE_AI: "manage_ai",
  OVERRIDE_PERMISSION: "override_permission",
  VIEW_ALL_REPORTS: "view_all_reports",

  // Division-level permissions
  VIEW_DIVISION_PROJECTS: "view_division_projects",
  CREATE_PROJECT: "create_project",
  EDIT_PROJECT: "edit_project",
  DELETE_PROJECT: "delete_project",
  VIEW_DIVISION_SPRINTS: "view_division_sprints",
  APPROVE_WORKFLOW: "approve_workflow",
  MANAGE_DIVISION_MEMBERS: "manage_division_members",
  MANAGE_DIVISION_TEAMS: "manage_division_teams",
  MANAGE_LEAVE_DELEGATION: "manage_leave_delegation",

  // Team-level permissions
  MANAGE_TEAM_MEMBERS: "manage_team_members",
  ASSIGN_TASK: "assign_task",
  PRIORITIZE_BACKLOG: "prioritize_backlog",
  MANAGE_SPRINT: "manage_sprint",
  START_END_SPRINT: "start_end_sprint",
  QA_APPROVAL: "qa_approval",
  EDIT_TASK: "edit_task",
  MOVE_TASK_KANBAN: "move_task_kanban",
  DELETE_TASK: "delete_task",

  // Project-level permissions
  EDIT_PROJECT_DETAILS: "edit_project_details",
  DELETE_PROJECT_DETAILS: "delete_project_details",
  CREATE_SPRINT: "create_sprint",
  EDIT_SPRINT: "edit_sprint",
  CREATE_TASK: "create_task",
  EDIT_TASK_DETAILS: "edit_task_details",
  QA_TESTING: "qa_testing",
  CHANGE_TASK_STATUS: "change_task_status",
  VIEW_REPORT: "view_report",
  WORKLOAD_MANAGEMENT: "workload_management",

  // Common permissions
  VIEW_PROJECT: "view_project",
  VIEW_TASK: "view_task",
  VIEW_SPRINT: "view_sprint",
  ADD_COMMENT: "add_comment",
  UPLOAD_ATTACHMENT: "upload_attachment",
  LOG_TIME: "log_time",
};

// =============================================================================
// PERMISSION MATRIX - SYSTEM LEVEL
// =============================================================================
const SYSTEM_PERMISSION_MATRIX = {
  [SYSTEM_ROLES.SUPER_ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.MANAGE_GLOBAL_ROLES,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.MANAGE_ALL_TEAMS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_ALL_PROJECTS,
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_AUDIT_LOGS,
    PERMISSIONS.MANAGE_AI,
    PERMISSIONS.OVERRIDE_PERMISSION,
    PERMISSIONS.VIEW_ALL_REPORTS,
    // Super admin has ALL permissions
    ...Object.values(PERMISSIONS),
  ],
  [SYSTEM_ROLES.ADMIN]: [
    PERMISSIONS.MANAGE_USERS,
    PERMISSIONS.MANAGE_ALL_USERS,
    PERMISSIONS.MANAGE_GLOBAL_ROLES,
    PERMISSIONS.MANAGE_DEPARTMENTS,
    PERMISSIONS.MANAGE_ALL_TEAMS,
    PERMISSIONS.MANAGE_TEAM,
    PERMISSIONS.MANAGE_ALL_PROJECTS,
    PERMISSIONS.VIEW_AUDIT_LOGS, // Conditional - partial
    PERMISSIONS.MANAGE_AI,
    PERMISSIONS.VIEW_ALL_REPORTS,
  ],
  [SYSTEM_ROLES.SECURITY_OFFICER]: [
    PERMISSIONS.VIEW_AUDIT_LOGS,
    PERMISSIONS.MANAGE_AUDIT_LOGS,
    PERMISSIONS.VIEW_ALL_REPORTS,
  ],
  [SYSTEM_ROLES.AI_ADMIN]: [
    PERMISSIONS.MANAGE_AI,
    PERMISSIONS.VIEW_ALL_REPORTS,
  ],
};

// =============================================================================
// PERMISSION MATRIX - DIVISION LEVEL
// =============================================================================
const DIVISION_PERMISSION_MATRIX = {
  [DIVISION_ROLES.DIVISION_HEAD]: [
    PERMISSIONS.VIEW_DIVISION_PROJECTS,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    PERMISSIONS.DELETE_PROJECT,
    PERMISSIONS.VIEW_DIVISION_SPRINTS,
    PERMISSIONS.APPROVE_WORKFLOW,
    PERMISSIONS.MANAGE_DIVISION_MEMBERS,
    PERMISSIONS.MANAGE_DIVISION_TEAMS,
  ],
  [DIVISION_ROLES.DIVISION_MANAGER]: [
    PERMISSIONS.VIEW_DIVISION_PROJECTS,
    PERMISSIONS.CREATE_PROJECT,
    PERMISSIONS.EDIT_PROJECT,
    // No DELETE_PROJECT
    PERMISSIONS.VIEW_DIVISION_SPRINTS,
    PERMISSIONS.APPROVE_WORKFLOW,
    PERMISSIONS.MANAGE_DIVISION_MEMBERS,
    PERMISSIONS.MANAGE_DIVISION_TEAMS,
  ],
  [DIVISION_ROLES.DIVISION_VIEWER]: [
    PERMISSIONS.VIEW_DIVISION_PROJECTS,
    // Conditional: VIEW_DIVISION_SPRINTS - partial access
  ],
  [DIVISION_ROLES.HR_REVIEWER]: [
    // Conditional: VIEW_DIVISION_PROJECTS - partial access
    // Conditional: VIEW_DIVISION_SPRINTS - partial access
    PERMISSIONS.APPROVE_WORKFLOW,
    PERMISSIONS.MANAGE_LEAVE_DELEGATION,
  ],
};

// =============================================================================
// PERMISSION MATRIX - TEAM LEVEL
// =============================================================================
const TEAM_PERMISSION_MATRIX = {
  [TEAM_ROLES.TEAM_ADMIN]: [
    PERMISSIONS.MANAGE_TEAM_MEMBERS,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.PRIORITIZE_BACKLOG,
    PERMISSIONS.MANAGE_SPRINT,
    PERMISSIONS.START_END_SPRINT,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [TEAM_ROLES.TEAM_LEAD]: [
    // Conditional: MANAGE_TEAM_MEMBERS - partial
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.PRIORITIZE_BACKLOG,
    PERMISSIONS.MANAGE_SPRINT,
    PERMISSIONS.START_END_SPRINT,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [TEAM_ROLES.SCRUM_MASTER]: [
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.MANAGE_SPRINT,
    PERMISSIONS.START_END_SPRINT,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [TEAM_ROLES.PRODUCT_OWNER]: [
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.PRIORITIZE_BACKLOG,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [TEAM_ROLES.QA_LEAD]: [
    PERMISSIONS.QA_APPROVAL,
    PERMISSIONS.EDIT_TASK,
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [TEAM_ROLES.MEMBER]: [
    // Conditional: EDIT_TASK - only own tasks
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
};

// =============================================================================
// PERMISSION MATRIX - PROJECT LEVEL
// =============================================================================
const PROJECT_PERMISSION_MATRIX = {
  [PROJECT_ROLES.PROJECT_OWNER]: [
    PERMISSIONS.EDIT_PROJECT_DETAILS,
    PERMISSIONS.DELETE_PROJECT_DETAILS,
    PERMISSIONS.CREATE_SPRINT,
    PERMISSIONS.EDIT_SPRINT,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK_DETAILS,
    PERMISSIONS.CHANGE_TASK_STATUS,
    PERMISSIONS.VIEW_REPORT,
    PERMISSIONS.WORKLOAD_MANAGEMENT,
    PERMISSIONS.MANAGE_TEAM_MEMBERS,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [PROJECT_ROLES.PROJECT_MANAGER]: [
    PERMISSIONS.EDIT_PROJECT_DETAILS,
    // No DELETE_PROJECT_DETAILS
    PERMISSIONS.CREATE_SPRINT,
    PERMISSIONS.EDIT_SPRINT,
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK_DETAILS,
    PERMISSIONS.CHANGE_TASK_STATUS,
    PERMISSIONS.VIEW_REPORT,
    PERMISSIONS.WORKLOAD_MANAGEMENT,
    PERMISSIONS.ASSIGN_TASK,
    PERMISSIONS.DELETE_TASK,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [PROJECT_ROLES.TECH_LEAD]: [
    // Conditional: EDIT_SPRINT - partial
    PERMISSIONS.CREATE_TASK,
    PERMISSIONS.EDIT_TASK_DETAILS,
    PERMISSIONS.CHANGE_TASK_STATUS,
    PERMISSIONS.VIEW_REPORT,
    PERMISSIONS.WORKLOAD_MANAGEMENT,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [PROJECT_ROLES.QA_TESTER]: [
    // Conditional: EDIT_TASK_DETAILS - only QA fields
    PERMISSIONS.QA_TESTING,
    PERMISSIONS.CHANGE_TASK_STATUS,
    PERMISSIONS.VIEW_REPORT,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [PROJECT_ROLES.DEVELOPER]: [
    PERMISSIONS.CREATE_TASK,
    // Conditional: EDIT_TASK_DETAILS - own tasks
    // Conditional: CHANGE_TASK_STATUS - own tasks
    // Conditional: VIEW_REPORT - partial
    PERMISSIONS.MOVE_TASK_KANBAN,
    PERMISSIONS.ADD_COMMENT,
    PERMISSIONS.UPLOAD_ATTACHMENT,
    PERMISSIONS.LOG_TIME,
  ],
  [PROJECT_ROLES.REPORT_VIEWER]: [
    PERMISSIONS.VIEW_REPORT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.VIEW_TASK,
    PERMISSIONS.VIEW_SPRINT,
  ],
  [PROJECT_ROLES.STAKEHOLDER]: [
    PERMISSIONS.VIEW_REPORT,
    PERMISSIONS.VIEW_PROJECT,
    PERMISSIONS.VIEW_TASK,
    PERMISSIONS.VIEW_SPRINT,
  ],
};

// =============================================================================
// CONDITIONAL PERMISSION RULES
// =============================================================================
const CONDITIONAL_RULES = {
  // System Level
  "admin:view_audit_logs": {
    condition: "partial",
    description: "Can view audit logs but not full details",
    filter: { excludeFields: ["ip_address", "sensitive_data"] },
  },

  // Division Level
  "division_viewer:view_division_sprints": {
    condition: "partial",
    description: "Can only view sprint summary, not full details",
    filter: { summaryOnly: true },
  },
  "hr_reviewer:view_division_projects": {
    condition: "partial",
    description: "Can only view HR-related project info",
    filter: { hrDataOnly: true },
  },

  // Team Level
  "team_lead:manage_team_members": {
    condition: "partial",
    description: "Can add/remove members but not change roles to admin",
    restriction: { excludeRoles: ["team_admin"] },
  },
  "member:edit_task": {
    condition: "own_only",
    description: "Can only edit tasks assigned to self",
    checkOwnership: true,
  },

  // Project Level
  "tech_lead:edit_sprint": {
    condition: "partial",
    description: "Can edit sprint details but not start/complete",
    restriction: { excludeActions: ["start", "complete"] },
  },
  "qa_tester:edit_task_details": {
    condition: "qa_fields_only",
    description: "Can only edit QA-related fields",
    allowedFields: ["qa_status", "test_notes", "bug_details"],
  },
  "developer:edit_task_details": {
    condition: "own_only",
    description: "Can only edit own assigned tasks",
    checkOwnership: true,
  },
  "developer:change_task_status": {
    condition: "own_only",
    description: "Can only change status of own tasks",
    checkOwnership: true,
  },
  "developer:view_report": {
    condition: "partial",
    description: "Can view basic reports only",
    filter: { basicReportsOnly: true },
  },
};

// =============================================================================
// ROLE HIERARCHY FOR INHERITANCE
// =============================================================================
const ROLE_HIERARCHY = {
  system: [
    SYSTEM_ROLES.SUPER_ADMIN,
    SYSTEM_ROLES.ADMIN,
    SYSTEM_ROLES.SECURITY_OFFICER,
    SYSTEM_ROLES.AI_ADMIN,
  ],
  division: [
    DIVISION_ROLES.DIVISION_HEAD,
    DIVISION_ROLES.DIVISION_MANAGER,
    DIVISION_ROLES.DIVISION_VIEWER,
    DIVISION_ROLES.HR_REVIEWER,
  ],
  team: [
    TEAM_ROLES.TEAM_ADMIN,
    TEAM_ROLES.TEAM_LEAD,
    TEAM_ROLES.SCRUM_MASTER,
    TEAM_ROLES.PRODUCT_OWNER,
    TEAM_ROLES.QA_LEAD,
    TEAM_ROLES.MEMBER,
  ],
  project: [
    PROJECT_ROLES.PROJECT_OWNER,
    PROJECT_ROLES.PROJECT_MANAGER,
    PROJECT_ROLES.TECH_LEAD,
    PROJECT_ROLES.QA_TESTER,
    PROJECT_ROLES.DEVELOPER,
    PROJECT_ROLES.REPORT_VIEWER,
    PROJECT_ROLES.STAKEHOLDER,
  ],
};

// =============================================================================
// EXPORTS
// =============================================================================
module.exports = {
  // Role definitions
  SYSTEM_ROLES,
  DIVISION_ROLES,
  TEAM_ROLES,
  PROJECT_ROLES,

  // Permission definitions
  PERMISSIONS,

  // Permission matrices
  SYSTEM_PERMISSION_MATRIX,
  DIVISION_PERMISSION_MATRIX,
  TEAM_PERMISSION_MATRIX,
  PROJECT_PERMISSION_MATRIX,

  // Conditional rules
  CONDITIONAL_RULES,

  // Role hierarchy
  ROLE_HIERARCHY,

  // Institution mappings
  INSTITUTION_ROLE_MAPPING,
  DIVISIONS,
  INSTITUTION_PROJECTS,

  // Helper to get all roles
  getAllRoles: () => ({
    system: Object.values(SYSTEM_ROLES),
    division: Object.values(DIVISION_ROLES),
    team: Object.values(TEAM_ROLES),
    project: Object.values(PROJECT_ROLES),
  }),

  // Helper to get all permissions
  getAllPermissions: () => Object.values(PERMISSIONS),
};
