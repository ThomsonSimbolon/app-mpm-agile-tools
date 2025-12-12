-- =============================================================================
-- APPROVAL WORKFLOW & DELEGATION SYSTEM
-- =============================================================================
-- Migration untuk sistem approval workflow dan delegasi tugas
-- Jalankan setelah enterprise_rbac.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- TABLE: task_approvals
-- Menyimpan request approval untuk task
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_approvals (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  requested_by INT NOT NULL,
  approver_id INT NOT NULL,
  approval_type ENUM(
    'task_creation',
    'status_change', 
    'priority_change',
    'assignment_change',
    'sprint_move',
    'qa_review'
  ) NOT NULL DEFAULT 'task_creation',
  status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
  priority ENUM('low', 'normal', 'high', 'urgent') NOT NULL DEFAULT 'normal',
  request_message TEXT NULL,
  response_message TEXT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  responded_at DATETIME NULL,
  due_date DATETIME NULL,
  auto_approve_at DATETIME NULL,
  metadata JSON NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approver_id) REFERENCES users(id) ON DELETE CASCADE,
  
  INDEX idx_task_approvals_task (task_id),
  INDEX idx_task_approvals_approver (approver_id),
  INDEX idx_task_approvals_requester (requested_by),
  INDEX idx_task_approvals_status (status),
  INDEX idx_task_approvals_type (approval_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE: user_leaves
-- Menyimpan data cuti/ketidaktersediaan user
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_leaves (
  id INT PRIMARY KEY AUTO_INCREMENT,
  user_id INT NOT NULL,
  delegate_id INT NULL,
  leave_type ENUM(
    'annual',
    'sick',
    'personal',
    'maternity',
    'paternity', 
    'unpaid',
    'remote',
    'training',
    'other'
  ) NOT NULL DEFAULT 'annual',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status ENUM(
    'pending',
    'approved',
    'rejected',
    'active',
    'completed',
    'cancelled'
  ) NOT NULL DEFAULT 'pending',
  reason TEXT NULL,
  auto_delegate_tasks BOOLEAN NOT NULL DEFAULT TRUE,
  return_tasks_after BOOLEAN NOT NULL DEFAULT TRUE,
  approved_by INT NULL,
  approved_at DATETIME NULL,
  contact_info VARCHAR(255) NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (delegate_id) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  
  INDEX idx_user_leaves_user (user_id),
  INDEX idx_user_leaves_delegate (delegate_id),
  INDEX idx_user_leaves_status (status),
  INDEX idx_user_leaves_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- TABLE: task_delegations
-- Menyimpan history delegasi task
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_delegations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  task_id INT NOT NULL,
  original_assignee_id INT NOT NULL,
  delegate_id INT NOT NULL,
  delegated_by INT NOT NULL,
  user_leave_id INT NULL,
  delegation_type ENUM(
    'auto_leave',
    'manual',
    'workload_balance',
    'skill_match',
    'emergency'
  ) NOT NULL DEFAULT 'auto_leave',
  status ENUM(
    'active',
    'returned',
    'permanent',
    'cancelled'
  ) NOT NULL DEFAULT 'active',
  reason TEXT NULL,
  delegated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATE NULL,
  returned_at DATETIME NULL,
  notes TEXT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (original_assignee_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (delegate_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (delegated_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_leave_id) REFERENCES user_leaves(id) ON DELETE SET NULL,
  
  INDEX idx_task_delegations_task (task_id),
  INDEX idx_task_delegations_original (original_assignee_id),
  INDEX idx_task_delegations_delegate (delegate_id),
  INDEX idx_task_delegations_status (status),
  INDEX idx_task_delegations_leave (user_leave_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------------------------------
-- OPTIONAL: Add approval fields to tasks table
-- Run only if you want tasks to track approval status directly
-- -----------------------------------------------------------------------------
-- ALTER TABLE tasks
--   ADD COLUMN requires_approval BOOLEAN NOT NULL DEFAULT FALSE,
--   ADD COLUMN approval_status ENUM('none', 'pending', 'approved', 'rejected') NOT NULL DEFAULT 'none',
--   ADD COLUMN current_approval_id INT NULL,
--   ADD FOREIGN KEY (current_approval_id) REFERENCES task_approvals(id) ON DELETE SET NULL;

-- =============================================================================
-- SAMPLE DATA (Optional - for testing)
-- =============================================================================

-- Insert sample approval types settings (can be customized per project)
-- This could be extended to a separate approval_settings table if needed

-- Example: Enable approval for task creation in a specific project
-- INSERT INTO task_approvals (task_id, requested_by, approver_id, approval_type, priority)
-- SELECT t.id, t.created_by, p.owner_id, 'task_creation', 'normal'
-- FROM tasks t
-- JOIN projects p ON t.project_id = p.id
-- WHERE p.requires_task_approval = true;

-- =============================================================================
-- VIEWS (Optional - for easier querying)
-- =============================================================================

-- View: Pending approvals with full details
CREATE OR REPLACE VIEW v_pending_approvals AS
SELECT 
  ta.id AS approval_id,
  ta.task_id,
  t.title AS task_title,
  t.status AS task_status,
  p.name AS project_name,
  ta.approval_type,
  ta.priority,
  ta.request_message,
  ta.requested_at,
  ta.due_date,
  r.username AS requester_username,
  r.full_name AS requester_name,
  a.username AS approver_username,
  a.full_name AS approver_name
FROM task_approvals ta
JOIN tasks t ON ta.task_id = t.id
JOIN projects p ON t.project_id = p.id
JOIN users r ON ta.requested_by = r.id
JOIN users a ON ta.approver_id = a.id
WHERE ta.status = 'pending'
ORDER BY ta.priority DESC, ta.requested_at ASC;

-- View: Active leaves with delegation status
CREATE OR REPLACE VIEW v_active_leaves AS
SELECT
  ul.id AS leave_id,
  ul.user_id,
  u.full_name AS user_name,
  ul.leave_type,
  ul.start_date,
  ul.end_date,
  ul.delegate_id,
  d.full_name AS delegate_name,
  ul.status,
  (SELECT COUNT(*) FROM task_delegations td WHERE td.user_leave_id = ul.id AND td.status = 'active') AS active_delegations
FROM user_leaves ul
JOIN users u ON ul.user_id = u.id
LEFT JOIN users d ON ul.delegate_id = d.id
WHERE ul.status IN ('approved', 'active')
  AND ul.start_date <= CURDATE()
  AND ul.end_date >= CURDATE();

-- =============================================================================
-- EVENTS (Optional - for auto-activation/completion of leaves)
-- =============================================================================

-- Note: MySQL Events must be enabled in your server configuration
-- SET GLOBAL event_scheduler = ON;

-- Event to auto-activate approved leaves on start date
-- DELIMITER //
-- CREATE EVENT IF NOT EXISTS evt_activate_leaves
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_DATE + INTERVAL 1 HOUR
-- DO
-- BEGIN
--   UPDATE user_leaves
--   SET status = 'active'
--   WHERE status = 'approved'
--     AND start_date <= CURDATE();
-- END //
-- DELIMITER ;

-- Event to auto-complete leaves on end date
-- DELIMITER //
-- CREATE EVENT IF NOT EXISTS evt_complete_leaves
-- ON SCHEDULE EVERY 1 DAY
-- STARTS CURRENT_DATE + INTERVAL 2 HOUR
-- DO
-- BEGIN
--   UPDATE user_leaves
--   SET status = 'completed'
--   WHERE status = 'active'
--     AND end_date < CURDATE();
-- END //
-- DELIMITER ;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
