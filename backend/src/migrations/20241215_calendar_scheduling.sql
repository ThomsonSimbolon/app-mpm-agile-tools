-- ============================================================================
-- Calendar & Scheduling Migration
-- Version: 1.0.0
-- Date: 2024-12-15
-- Description: Tables for calendar view, Gantt chart, meeting scheduler, 
--              and external calendar integration
-- ============================================================================

-- ============================================================================
-- 1. CALENDAR EVENTS TABLE
-- Purpose: Store calendar events (meetings, reminders, deadlines, etc.)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `calendar_events` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `event_type` ENUM('meeting', 'reminder', 'deadline', 'milestone', 'task', 'sprint', 'leave', 'other') NOT NULL DEFAULT 'other',
  `start_datetime` DATETIME NOT NULL,
  `end_datetime` DATETIME,
  `all_day` BOOLEAN NOT NULL DEFAULT FALSE,
  `location` VARCHAR(500),
  `meeting_link` VARCHAR(500),
  `recurrence_rule` VARCHAR(255) COMMENT 'iCal RRULE format (e.g., FREQ=WEEKLY;BYDAY=MO,WE,FR)',
  `recurrence_end_date` DATE,
  `color` VARCHAR(7) DEFAULT '#3B82F6',
  `reminder_minutes` INT DEFAULT 30 COMMENT 'Minutes before event to send reminder',
  `project_id` INT,
  `task_id` INT,
  `created_by` INT NOT NULL,
  `attendees` JSON COMMENT 'Array of user IDs attending the event',
  `external_id` VARCHAR(255) COMMENT 'ID from external calendar (Google/Outlook)',
  `external_source` ENUM('internal', 'google', 'outlook') NOT NULL DEFAULT 'internal',
  `is_private` BOOLEAN NOT NULL DEFAULT FALSE,
  `status` ENUM('scheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'scheduled',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT `fk_calendar_events_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_events_task` FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_calendar_events_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_calendar_events_created_by` (`created_by`),
  INDEX `idx_calendar_events_project_id` (`project_id`),
  INDEX `idx_calendar_events_task_id` (`task_id`),
  INDEX `idx_calendar_events_event_type` (`event_type`),
  INDEX `idx_calendar_events_start_datetime` (`start_datetime`),
  INDEX `idx_calendar_events_end_datetime` (`end_datetime`),
  INDEX `idx_calendar_events_external_id` (`external_id`),
  INDEX `idx_calendar_events_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 2. PROJECT MILESTONES TABLE
-- Purpose: Track project milestones for Gantt chart visualization
-- ============================================================================
CREATE TABLE IF NOT EXISTS `project_milestones` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `project_id` INT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `target_date` DATE NOT NULL,
  `completed_date` DATE,
  `status` ENUM('pending', 'completed', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
  `color` VARCHAR(7) DEFAULT '#10B981',
  `sort_order` INT DEFAULT 0,
  `created_by` INT NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT `fk_milestones_project` FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_milestones_creator` FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Indexes
  INDEX `idx_milestones_project_id` (`project_id`),
  INDEX `idx_milestones_target_date` (`target_date`),
  INDEX `idx_milestones_status` (`status`),
  INDEX `idx_milestones_created_by` (`created_by`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 3. CALENDAR INTEGRATIONS TABLE
-- Purpose: Store OAuth tokens for Google/Outlook calendar sync
-- ============================================================================
CREATE TABLE IF NOT EXISTS `calendar_integrations` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `provider` ENUM('google', 'outlook', 'apple') NOT NULL,
  `access_token` TEXT COMMENT 'Encrypted access token',
  `refresh_token` TEXT COMMENT 'Encrypted refresh token',
  `token_expires_at` DATETIME,
  `calendar_id` VARCHAR(255) COMMENT 'Primary calendar ID from provider',
  `calendar_name` VARCHAR(255),
  `sync_enabled` BOOLEAN NOT NULL DEFAULT TRUE,
  `sync_direction` ENUM('bidirectional', 'push_only', 'pull_only') NOT NULL DEFAULT 'bidirectional',
  `last_sync_at` DATETIME,
  `sync_status` ENUM('active', 'error', 'disabled') NOT NULL DEFAULT 'active',
  `sync_error` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT `fk_calendar_integrations_user` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  
  -- Unique constraint: One integration per provider per user
  UNIQUE KEY `uk_user_provider` (`user_id`, `provider`),
  
  -- Indexes
  INDEX `idx_calendar_integrations_user_id` (`user_id`),
  INDEX `idx_calendar_integrations_provider` (`provider`),
  INDEX `idx_calendar_integrations_sync_status` (`sync_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 4. TASK DEPENDENCIES TABLE
-- Purpose: Define task dependencies for Gantt chart (critical path calculation)
-- ============================================================================
CREATE TABLE IF NOT EXISTS `task_dependencies` (
  `id` INT PRIMARY KEY AUTO_INCREMENT,
  `predecessor_id` INT NOT NULL COMMENT 'Task that must be completed first',
  `successor_id` INT NOT NULL COMMENT 'Task that depends on predecessor',
  `dependency_type` ENUM('FS', 'SS', 'FF', 'SF') NOT NULL DEFAULT 'FS' 
    COMMENT 'FS=Finish-to-Start, SS=Start-to-Start, FF=Finish-to-Finish, SF=Start-to-Finish',
  `lag_days` INT NOT NULL DEFAULT 0 COMMENT 'Days of lag/lead time between tasks',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Foreign Keys
  CONSTRAINT `fk_task_dependencies_predecessor` FOREIGN KEY (`predecessor_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_task_dependencies_successor` FOREIGN KEY (`successor_id`) REFERENCES `tasks`(`id`) ON DELETE CASCADE,
  
  -- Unique constraint: Prevent duplicate dependencies
  UNIQUE KEY `uk_predecessor_successor` (`predecessor_id`, `successor_id`),
  
  -- Indexes
  INDEX `idx_task_dependencies_predecessor` (`predecessor_id`),
  INDEX `idx_task_dependencies_successor` (`successor_id`),
  INDEX `idx_task_dependencies_type` (`dependency_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================================
-- 5. ALTER TASKS TABLE
-- Purpose: Add new columns for Gantt chart support
-- ============================================================================
ALTER TABLE `tasks`
  ADD COLUMN IF NOT EXISTS `start_date` DATE NULL COMMENT 'Task start date for Gantt chart',
  ADD COLUMN IF NOT EXISTS `estimated_hours` FLOAT NULL COMMENT 'Estimated hours to complete the task',
  ADD COLUMN IF NOT EXISTS `progress_percentage` INT DEFAULT 0 COMMENT 'Task progress percentage (0-100) for Gantt chart';


-- ============================================================================
-- 6. ADD INDEX TO TASKS (if not exists)
-- ============================================================================
-- Note: MySQL 8.0+ supports IF NOT EXISTS for indexes
-- For older versions, you may need to check manually
-- ALTER TABLE `tasks` ADD INDEX IF NOT EXISTS `idx_tasks_start_date` (`start_date`);
-- ALTER TABLE `tasks` ADD INDEX IF NOT EXISTS `idx_tasks_due_date` (`due_date`);


-- ============================================================================
-- VERIFICATION QUERIES (Run after migration to verify tables)
-- ============================================================================
-- SHOW TABLES LIKE 'calendar%';
-- SHOW TABLES LIKE 'project_milestones';
-- SHOW TABLES LIKE 'task_dependencies';
-- DESCRIBE calendar_events;
-- DESCRIBE project_milestones;
-- DESCRIBE calendar_integrations;
-- DESCRIBE task_dependencies;
-- SHOW COLUMNS FROM tasks LIKE 'start_date';
-- SHOW COLUMNS FROM tasks LIKE 'estimated_hours';
-- SHOW COLUMNS FROM tasks LIKE 'progress_percentage';
