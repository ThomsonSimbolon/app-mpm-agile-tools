/**
 * =============================================================================
 * DATABASE MIGRATION: Enterprise RBAC Schema
 * =============================================================================
 * Migration untuk menambahkan tabel dan kolom yang diperlukan untuk
 * Enterprise RBAC System (multi-layer roles)
 * 
 * Struktur:
 * 1. ALTER users - tambah system_role
 * 2. CREATE department_members - anggota departemen dengan role
 * 3. ALTER team_members - tambah role baru
 * 4. ALTER project_members - tambah role baru
 * 5. CREATE rbac_permissions - definisi permission
 * 6. CREATE role_permissions - mapping role ke permission
 * 7. CREATE user_role_assignments - assignment role dinamis
 * 8. Indexes & Foreign Keys
 * =============================================================================
 */

-- =============================================================================
-- 1. ALTER TABLE users - Tambah system_role
-- =============================================================================
ALTER TABLE users 
ADD COLUMN system_role ENUM(
  'super_admin',
  'admin', 
  'security_officer',
  'ai_admin'
) NULL DEFAULT NULL AFTER role,
ADD COLUMN institution_role VARCHAR(50) NULL COMMENT 'Role jabatan instansi: Superadmin, Admin Sistem, Manager, HRD, Kepala Divisi, Project Manager, Staff' AFTER system_role;

-- Migrate existing admin roles to system_role
UPDATE users SET system_role = 'admin' WHERE role = 'admin';

-- Add index for system_role
CREATE INDEX idx_users_system_role ON users(system_role);
CREATE INDEX idx_users_institution_role ON users(institution_role);

-- =============================================================================
-- 2. CREATE TABLE department_members
-- =============================================================================
CREATE TABLE IF NOT EXISTS department_members (
  id INT PRIMARY KEY AUTO_INCREMENT,
  department_id INT NOT NULL,
  user_id INT NOT NULL,
  role ENUM(
    'division_head',
    'division_manager', 
    'division_viewer',
    'hr_reviewer'
  ) NOT NULL DEFAULT 'division_viewer',
  position VARCHAR(100) NULL COMMENT 'Posisi/jabatan dalam departemen',
  is_head BOOLEAN DEFAULT FALSE COMMENT 'Apakah kepala departemen',
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Unique constraint: user can only be in one department with one role
  UNIQUE KEY unique_dept_user (department_id, user_id),
  
  -- Indexes
  INDEX idx_dept_members_dept (department_id),
  INDEX idx_dept_members_user (user_id),
  INDEX idx_dept_members_role (role),
  INDEX idx_dept_members_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 3. ALTER TABLE team_members - Tambah role ENUM baru
-- =============================================================================
-- First, modify the role column to support new team roles
ALTER TABLE team_members 
MODIFY COLUMN role ENUM(
  -- Existing roles
  'member',
  'lead', 
  'admin',
  -- New roles
  'team_admin',
  'team_lead',
  'scrum_master',
  'product_owner',
  'qa_lead'
) DEFAULT 'member';

-- Migrate existing roles
UPDATE team_members SET role = 'team_admin' WHERE role = 'admin';
UPDATE team_members SET role = 'team_lead' WHERE role = 'lead';

-- Add additional columns for team members
ALTER TABLE team_members
ADD COLUMN specialization VARCHAR(100) NULL COMMENT 'Spesialisasi: frontend, backend, devops, qa, etc.' AFTER position,
ADD COLUMN capacity_percentage INT DEFAULT 100 COMMENT 'Kapasitas kerja dalam persen (0-100)' AFTER specialization;

-- =============================================================================
-- 4. ALTER TABLE project_members - Tambah role ENUM baru
-- =============================================================================
ALTER TABLE project_members
MODIFY COLUMN role ENUM(
  -- Existing roles
  'owner',
  'manager',
  'developer',
  'viewer',
  -- New roles
  'project_owner',
  'project_manager',
  'tech_lead',
  'qa_tester',
  'report_viewer',
  'stakeholder'
) DEFAULT 'developer';

-- Migrate existing roles
UPDATE project_members SET role = 'project_owner' WHERE role = 'owner';
UPDATE project_members SET role = 'project_manager' WHERE role = 'manager';

-- Add additional columns for project members
ALTER TABLE project_members
ADD COLUMN is_primary BOOLEAN DEFAULT FALSE COMMENT 'Apakah anggota utama project' AFTER role,
ADD COLUMN allocation_percentage INT DEFAULT 100 COMMENT 'Alokasi waktu untuk project ini (0-100)' AFTER is_primary,
ADD COLUMN can_approve BOOLEAN DEFAULT FALSE COMMENT 'Dapat approve task/sprint' AFTER allocation_percentage;

-- =============================================================================
-- 5. CREATE TABLE rbac_permissions - Definisi Permission
-- =============================================================================
CREATE TABLE IF NOT EXISTS rbac_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  code VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  description TEXT NULL,
  category ENUM('system', 'division', 'team', 'project', 'common') NOT NULL DEFAULT 'common',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes
  INDEX idx_permissions_code (code),
  INDEX idx_permissions_category (category),
  INDEX idx_permissions_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default permissions
INSERT INTO rbac_permissions (code, name, description, category) VALUES
-- System-level permissions
('manage_users', 'Kelola Pengguna', 'Dapat membuat, edit, hapus pengguna', 'system'),
('manage_global_roles', 'Kelola Role Global', 'Dapat mengatur role di seluruh sistem', 'system'),
('manage_departments', 'Kelola Departemen', 'Dapat membuat, edit, hapus departemen', 'system'),
('manage_all_teams', 'Kelola Semua Tim', 'Dapat mengelola semua tim', 'system'),
('manage_all_projects', 'Kelola Semua Project', 'Dapat mengelola semua project', 'system'),
('view_audit_logs', 'Lihat Audit Log', 'Dapat melihat log audit', 'system'),
('manage_audit_logs', 'Kelola Audit Log', 'Dapat mengelola dan export audit log', 'system'),
('manage_ai', 'Kelola AI', 'Dapat mengkonfigurasi fitur AI', 'system'),
('override_permission', 'Override Permission', 'Dapat melewati semua pembatasan', 'system'),
('view_all_reports', 'Lihat Semua Report', 'Dapat melihat semua laporan', 'system'),

-- Division-level permissions
('view_division_projects', 'Lihat Project Divisi', 'Dapat melihat semua project dalam divisi', 'division'),
('create_project', 'Buat Project', 'Dapat membuat project baru', 'division'),
('edit_project', 'Edit Project', 'Dapat mengedit project', 'division'),
('delete_project', 'Hapus Project', 'Dapat menghapus project', 'division'),
('view_division_sprints', 'Lihat Sprint Divisi', 'Dapat melihat sprint dalam divisi', 'division'),
('approve_workflow', 'Approve Workflow', 'Dapat approve workflow dan request', 'division'),
('manage_division_members', 'Kelola Anggota Divisi', 'Dapat mengelola anggota divisi', 'division'),
('manage_division_teams', 'Kelola Tim Divisi', 'Dapat mengelola tim dalam divisi', 'division'),
('manage_leave_delegation', 'Kelola Cuti & Delegasi', 'Dapat mengelola cuti dan delegasi tugas', 'division'),

-- Team-level permissions
('manage_team_members', 'Kelola Anggota Tim', 'Dapat mengelola anggota tim', 'team'),
('assign_task', 'Assign Task', 'Dapat meng-assign task ke anggota', 'team'),
('prioritize_backlog', 'Prioritas Backlog', 'Dapat memprioritaskan backlog', 'team'),
('manage_sprint', 'Kelola Sprint', 'Dapat membuat dan edit sprint', 'team'),
('start_end_sprint', 'Start/End Sprint', 'Dapat memulai dan mengakhiri sprint', 'team'),
('qa_approval', 'QA Approval', 'Dapat approve hasil QA', 'team'),
('edit_task', 'Edit Task', 'Dapat mengedit task', 'team'),
('move_task_kanban', 'Pindah Task Kanban', 'Dapat memindahkan task di kanban', 'team'),
('delete_task', 'Hapus Task', 'Dapat menghapus task', 'team'),

-- Project-level permissions
('edit_project_details', 'Edit Detail Project', 'Dapat mengedit detail project', 'project'),
('delete_project_details', 'Hapus Project', 'Dapat menghapus project', 'project'),
('create_sprint', 'Buat Sprint', 'Dapat membuat sprint', 'project'),
('edit_sprint', 'Edit Sprint', 'Dapat mengedit sprint', 'project'),
('create_task', 'Buat Task', 'Dapat membuat task', 'project'),
('edit_task_details', 'Edit Detail Task', 'Dapat mengedit detail task', 'project'),
('qa_testing', 'QA Testing', 'Dapat melakukan QA testing', 'project'),
('change_task_status', 'Ubah Status Task', 'Dapat mengubah status task', 'project'),
('view_report', 'Lihat Report', 'Dapat melihat laporan project', 'project'),
('workload_management', 'Kelola Workload', 'Dapat mengelola distribusi beban kerja', 'project'),

-- Common permissions
('view_project', 'Lihat Project', 'Dapat melihat project', 'common'),
('view_task', 'Lihat Task', 'Dapat melihat task', 'common'),
('view_sprint', 'Lihat Sprint', 'Dapat melihat sprint', 'common'),
('add_comment', 'Tambah Komentar', 'Dapat menambah komentar', 'common'),
('upload_attachment', 'Upload Attachment', 'Dapat upload file', 'common'),
('log_time', 'Log Waktu', 'Dapat mencatat waktu kerja', 'common');

-- =============================================================================
-- 6. CREATE TABLE role_permissions - Mapping Role ke Permission
-- =============================================================================
CREATE TABLE IF NOT EXISTS role_permissions (
  id INT PRIMARY KEY AUTO_INCREMENT,
  role_type ENUM('system', 'division', 'team', 'project') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  permission_id INT NOT NULL,
  is_conditional BOOLEAN DEFAULT FALSE COMMENT 'Apakah permission memiliki kondisi khusus',
  condition_type VARCHAR(50) NULL COMMENT 'Tipe kondisi: own_only, partial, qa_fields_only',
  condition_config JSON NULL COMMENT 'Konfigurasi kondisi dalam format JSON',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (permission_id) REFERENCES rbac_permissions(id) ON DELETE CASCADE,
  
  -- Unique constraint
  UNIQUE KEY unique_role_permission (role_type, role_name, permission_id),
  
  -- Indexes
  INDEX idx_role_perms_type (role_type),
  INDEX idx_role_perms_name (role_name),
  INDEX idx_role_perms_permission (permission_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 7. CREATE TABLE user_role_assignments - Dynamic Role Assignment
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_role_assignments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  role_type ENUM('system', 'division', 'team', 'project') NOT NULL,
  role_name VARCHAR(50) NOT NULL,
  resource_type VARCHAR(50) NULL COMMENT 'Tipe resource: department, team, project',
  resource_id INT NULL COMMENT 'ID resource terkait',
  assigned_by INT NOT NULL COMMENT 'User yang assign role',
  valid_from DATETIME DEFAULT CURRENT_TIMESTAMP,
  valid_until DATETIME NULL COMMENT 'NULL = tidak ada batas waktu',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
  
  -- Indexes
  INDEX idx_role_assign_user (user_id),
  INDEX idx_role_assign_type (role_type),
  INDEX idx_role_assign_resource (resource_type, resource_id),
  INDEX idx_role_assign_active (is_active),
  INDEX idx_role_assign_validity (valid_from, valid_until)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 8. CREATE TABLE permission_audit_logs - Audit Permission Changes
-- =============================================================================
CREATE TABLE IF NOT EXISTS permission_audit_logs (
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
  
  -- Constraints
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE CASCADE,
  
  -- Indexes
  INDEX idx_perm_audit_user (user_id),
  INDEX idx_perm_audit_target (target_user_id),
  INDEX idx_perm_audit_action (action),
  INDEX idx_perm_audit_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================================================
-- 9. INSERT DEFAULT ROLE PERMISSIONS MAPPING
-- =============================================================================

-- System: super_admin (all permissions)
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'system', 'super_admin', id FROM rbac_permissions;

-- System: admin (most permissions except override)
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'system', 'admin', id FROM rbac_permissions 
WHERE code NOT IN ('override_permission', 'manage_audit_logs');

-- System: security_officer
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'system', 'security_officer', id FROM rbac_permissions 
WHERE code IN ('view_audit_logs', 'manage_audit_logs', 'view_all_reports');

-- System: ai_admin
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'system', 'ai_admin', id FROM rbac_permissions 
WHERE code IN ('manage_ai', 'view_all_reports');

-- Division: division_head
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'division', 'division_head', id FROM rbac_permissions 
WHERE code IN (
  'view_division_projects', 'create_project', 'edit_project', 'delete_project',
  'view_division_sprints', 'approve_workflow', 'manage_division_members', 'manage_division_teams'
);

-- Division: division_manager
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'division', 'division_manager', id FROM rbac_permissions 
WHERE code IN (
  'view_division_projects', 'create_project', 'edit_project',
  'view_division_sprints', 'approve_workflow', 'manage_division_members', 'manage_division_teams'
);

-- Team: team_admin
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'team', 'team_admin', id FROM rbac_permissions 
WHERE code IN (
  'manage_team_members', 'assign_task', 'prioritize_backlog', 'manage_sprint',
  'start_end_sprint', 'edit_task', 'move_task_kanban', 'delete_task',
  'add_comment', 'upload_attachment', 'log_time'
);

-- Team: scrum_master
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'team', 'scrum_master', id FROM rbac_permissions 
WHERE code IN (
  'assign_task', 'manage_sprint', 'start_end_sprint', 'edit_task',
  'move_task_kanban', 'add_comment', 'upload_attachment', 'log_time'
);

-- Project: project_owner
INSERT INTO role_permissions (role_type, role_name, permission_id)
SELECT 'project', 'project_owner', id FROM rbac_permissions 
WHERE code IN (
  'edit_project_details', 'delete_project_details', 'create_sprint', 'edit_sprint',
  'create_task', 'edit_task_details', 'change_task_status', 'view_report',
  'workload_management', 'manage_team_members', 'assign_task', 'delete_task',
  'add_comment', 'upload_attachment', 'log_time'
);

-- Project: developer (with conditional permissions)
INSERT INTO role_permissions (role_type, role_name, permission_id, is_conditional, condition_type)
SELECT 'project', 'developer', id, 
  CASE WHEN code IN ('edit_task_details', 'change_task_status') THEN TRUE ELSE FALSE END,
  CASE WHEN code IN ('edit_task_details', 'change_task_status') THEN 'own_only' ELSE NULL END
FROM rbac_permissions 
WHERE code IN (
  'create_task', 'edit_task_details', 'change_task_status', 'move_task_kanban',
  'add_comment', 'upload_attachment', 'log_time', 'view_report'
);

-- =============================================================================
-- 10. VIEWS FOR EASY QUERYING
-- =============================================================================

-- View: User with all roles
CREATE OR REPLACE VIEW v_user_roles AS
SELECT 
  u.id as user_id,
  u.username,
  u.email,
  u.full_name,
  u.role as legacy_role,
  u.system_role,
  u.institution_role,
  dm.department_id,
  d.name as department_name,
  dm.role as division_role,
  tm.team_id,
  t.name as team_name,
  tm.role as team_role,
  pm.project_id,
  p.name as project_name,
  pm.role as project_role
FROM users u
LEFT JOIN department_members dm ON u.id = dm.user_id AND dm.is_active = TRUE
LEFT JOIN departments d ON dm.department_id = d.id
LEFT JOIN team_members tm ON u.id = tm.user_id AND tm.is_active = TRUE
LEFT JOIN teams t ON tm.team_id = t.id
LEFT JOIN project_members pm ON u.id = pm.user_id
LEFT JOIN projects p ON pm.project_id = p.id
WHERE u.status = 'active';

-- View: Effective permissions per user
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT 
  u.id as user_id,
  u.username,
  rp.role_type,
  rp.role_name,
  p.code as permission_code,
  p.name as permission_name,
  p.category as permission_category,
  rp.is_conditional,
  rp.condition_type
FROM users u
INNER JOIN (
  -- System roles
  SELECT id, system_role as role_name, 'system' as role_type FROM users WHERE system_role IS NOT NULL
  UNION ALL
  -- Division roles
  SELECT user_id, role, 'division' FROM department_members WHERE is_active = TRUE
  UNION ALL
  -- Team roles
  SELECT user_id, role, 'team' FROM team_members WHERE is_active = TRUE
  UNION ALL
  -- Project roles
  SELECT user_id, role, 'project' FROM project_members
) ur ON u.id = ur.id OR (ur.role_type != 'system')
INNER JOIN role_permissions rp ON ur.role_name = rp.role_name AND ur.role_type = rp.role_type
INNER JOIN rbac_permissions p ON rp.permission_id = p.id
WHERE u.status = 'active';

-- =============================================================================
-- 11. STORED PROCEDURE: Check User Permission
-- =============================================================================
DELIMITER //

CREATE PROCEDURE sp_check_user_permission(
  IN p_user_id INT,
  IN p_permission_code VARCHAR(100),
  IN p_resource_type VARCHAR(50),
  IN p_resource_id INT,
  OUT p_has_permission BOOLEAN,
  OUT p_is_conditional BOOLEAN,
  OUT p_condition_type VARCHAR(50)
)
BEGIN
  DECLARE v_system_role VARCHAR(50);
  DECLARE v_division_role VARCHAR(50);
  DECLARE v_team_role VARCHAR(50);
  DECLARE v_project_role VARCHAR(50);
  
  SET p_has_permission = FALSE;
  SET p_is_conditional = FALSE;
  SET p_condition_type = NULL;
  
  -- Get system role (always check first - super_admin bypass)
  SELECT system_role INTO v_system_role FROM users WHERE id = p_user_id;
  
  IF v_system_role = 'super_admin' THEN
    SET p_has_permission = TRUE;
  ELSE
    -- Check permission in role_permissions
    SELECT 
      TRUE, is_conditional, condition_type
    INTO 
      p_has_permission, p_is_conditional, p_condition_type
    FROM role_permissions rp
    INNER JOIN rbac_permissions p ON rp.permission_id = p.id
    WHERE p.code = p_permission_code
    AND (
      (rp.role_type = 'system' AND rp.role_name = v_system_role)
      OR (rp.role_type = 'division' AND rp.role_name = (
        SELECT dm.role FROM department_members dm WHERE dm.user_id = p_user_id AND dm.is_active = TRUE LIMIT 1
      ))
      OR (rp.role_type = 'team' AND rp.role_name = (
        SELECT tm.role FROM team_members tm WHERE tm.user_id = p_user_id AND tm.is_active = TRUE LIMIT 1
      ))
      OR (rp.role_type = 'project' AND rp.role_name = (
        SELECT pm.role FROM project_members pm WHERE pm.user_id = p_user_id AND pm.project_id = p_resource_id LIMIT 1
      ))
    )
    LIMIT 1;
  END IF;
END //

DELIMITER ;

-- =============================================================================
-- 12. SAMPLE DATA: Institution Divisions
-- =============================================================================
INSERT INTO departments (name, code, description, level, `order`, is_active) VALUES
('IT', 'IT', 'Information Technology Division', 0, 1, TRUE),
('HRD', 'HRD', 'Human Resources Development', 0, 2, TRUE),
('Finance', 'FIN', 'Finance Division', 0, 3, TRUE),
('Admin Marketing', 'ADM', 'Admin Marketing Division', 0, 4, TRUE),
('Marketing', 'MKT', 'Marketing Division', 0, 5, TRUE),
('Instruktur', 'INS', 'Instructor Division', 0, 6, TRUE)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
