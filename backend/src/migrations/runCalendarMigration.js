/**
 * Calendar & Scheduling Migration Runner
 * Run this script to create calendar-related tables
 *
 * Usage: node src/migrations/runCalendarMigration.js
 */

require("dotenv").config();
const mysql = require("mysql2/promise");

async function runMigration() {
  console.log("🚀 Starting Calendar & Scheduling Migration...\n");

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "mpm_agile_tools",
    multipleStatements: true,
  });

  try {
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;

    // ========================================================================
    // 1. CREATE CALENDAR_EVENTS TABLE
    // ========================================================================
    console.log("📋 Creating calendar_events table...");
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS calendar_events (
          id INT PRIMARY KEY AUTO_INCREMENT,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          event_type ENUM('meeting', 'reminder', 'deadline', 'milestone', 'task', 'sprint', 'leave', 'other') NOT NULL DEFAULT 'other',
          start_datetime DATETIME NOT NULL,
          end_datetime DATETIME,
          all_day BOOLEAN NOT NULL DEFAULT FALSE,
          location VARCHAR(500),
          meeting_link VARCHAR(500),
          recurrence_rule VARCHAR(255),
          recurrence_end_date DATE,
          color VARCHAR(7) DEFAULT '#3B82F6',
          reminder_minutes INT DEFAULT 30,
          project_id INT,
          task_id INT,
          created_by INT NOT NULL,
          attendees JSON,
          external_id VARCHAR(255),
          external_source ENUM('internal', 'google', 'outlook') NOT NULL DEFAULT 'internal',
          is_private BOOLEAN NOT NULL DEFAULT FALSE,
          status ENUM('scheduled', 'cancelled', 'completed') NOT NULL DEFAULT 'scheduled',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_calendar_events_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE SET NULL,
          CONSTRAINT fk_calendar_events_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL,
          CONSTRAINT fk_calendar_events_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_calendar_events_created_by (created_by),
          INDEX idx_calendar_events_project_id (project_id),
          INDEX idx_calendar_events_start_datetime (start_datetime),
          INDEX idx_calendar_events_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Created table: calendar_events");
      successCount++;
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⏭️  Table already exists: calendar_events");
        skipCount++;
      } else {
        console.error("❌ Error creating calendar_events:", error.message);
        errorCount++;
      }
    }

    // ========================================================================
    // 2. CREATE PROJECT_MILESTONES TABLE
    // ========================================================================
    console.log("📋 Creating project_milestones table...");
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS project_milestones (
          id INT PRIMARY KEY AUTO_INCREMENT,
          project_id INT NOT NULL,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          target_date DATE NOT NULL,
          completed_date DATE,
          status ENUM('pending', 'completed', 'overdue', 'cancelled') NOT NULL DEFAULT 'pending',
          color VARCHAR(7) DEFAULT '#10B981',
          sort_order INT DEFAULT 0,
          created_by INT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_milestones_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
          CONSTRAINT fk_milestones_creator FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
          INDEX idx_milestones_project_id (project_id),
          INDEX idx_milestones_target_date (target_date),
          INDEX idx_milestones_status (status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Created table: project_milestones");
      successCount++;
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⏭️  Table already exists: project_milestones");
        skipCount++;
      } else {
        console.error("❌ Error creating project_milestones:", error.message);
        errorCount++;
      }
    }

    // ========================================================================
    // 3. CREATE CALENDAR_INTEGRATIONS TABLE
    // ========================================================================
    console.log("📋 Creating calendar_integrations table...");
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS calendar_integrations (
          id INT PRIMARY KEY AUTO_INCREMENT,
          user_id INT NOT NULL,
          provider ENUM('google', 'outlook', 'apple') NOT NULL,
          access_token TEXT,
          refresh_token TEXT,
          token_expires_at DATETIME,
          calendar_id VARCHAR(255),
          calendar_name VARCHAR(255),
          sync_enabled BOOLEAN NOT NULL DEFAULT TRUE,
          sync_direction ENUM('bidirectional', 'push_only', 'pull_only') NOT NULL DEFAULT 'bidirectional',
          last_sync_at DATETIME,
          sync_status ENUM('active', 'error', 'disabled') NOT NULL DEFAULT 'active',
          sync_error TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_calendar_integrations_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY uk_user_provider (user_id, provider),
          INDEX idx_calendar_integrations_user_id (user_id),
          INDEX idx_calendar_integrations_sync_status (sync_status)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Created table: calendar_integrations");
      successCount++;
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⏭️  Table already exists: calendar_integrations");
        skipCount++;
      } else {
        console.error(
          "❌ Error creating calendar_integrations:",
          error.message
        );
        errorCount++;
      }
    }

    // ========================================================================
    // 4. CREATE TASK_DEPENDENCIES TABLE
    // ========================================================================
    console.log("📋 Creating task_dependencies table...");
    try {
      await connection.query(`
        CREATE TABLE IF NOT EXISTS task_dependencies (
          id INT PRIMARY KEY AUTO_INCREMENT,
          predecessor_id INT NOT NULL,
          successor_id INT NOT NULL,
          dependency_type ENUM('FS', 'SS', 'FF', 'SF') NOT NULL DEFAULT 'FS',
          lag_days INT NOT NULL DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          CONSTRAINT fk_task_dependencies_predecessor FOREIGN KEY (predecessor_id) REFERENCES tasks(id) ON DELETE CASCADE,
          CONSTRAINT fk_task_dependencies_successor FOREIGN KEY (successor_id) REFERENCES tasks(id) ON DELETE CASCADE,
          UNIQUE KEY uk_predecessor_successor (predecessor_id, successor_id),
          INDEX idx_task_dependencies_predecessor (predecessor_id),
          INDEX idx_task_dependencies_successor (successor_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log("✅ Created table: task_dependencies");
      successCount++;
    } catch (error) {
      if (error.code === "ER_TABLE_EXISTS_ERROR") {
        console.log("⏭️  Table already exists: task_dependencies");
        skipCount++;
      } else {
        console.error("❌ Error creating task_dependencies:", error.message);
        errorCount++;
      }
    }

    // ========================================================================
    // 5. ALTER TASKS TABLE - Add new columns
    // ========================================================================
    console.log("📋 Adding new columns to tasks table...");

    // Add start_date column
    try {
      await connection.query(
        `ALTER TABLE tasks ADD COLUMN start_date DATE NULL`
      );
      console.log("✅ Added column: tasks.start_date");
      successCount++;
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⏭️  Column already exists: tasks.start_date");
        skipCount++;
      } else {
        console.error("❌ Error adding start_date:", error.message);
        errorCount++;
      }
    }

    // Add estimated_hours column
    try {
      await connection.query(
        `ALTER TABLE tasks ADD COLUMN estimated_hours FLOAT NULL`
      );
      console.log("✅ Added column: tasks.estimated_hours");
      successCount++;
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⏭️  Column already exists: tasks.estimated_hours");
        skipCount++;
      } else {
        console.error("❌ Error adding estimated_hours:", error.message);
        errorCount++;
      }
    }

    // Add progress_percentage column
    try {
      await connection.query(
        `ALTER TABLE tasks ADD COLUMN progress_percentage INT DEFAULT 0`
      );
      console.log("✅ Added column: tasks.progress_percentage");
      successCount++;
    } catch (error) {
      if (error.code === "ER_DUP_FIELDNAME") {
        console.log("⏭️  Column already exists: tasks.progress_percentage");
        skipCount++;
      } else {
        console.error("❌ Error adding progress_percentage:", error.message);
        errorCount++;
      }
    }

    // ========================================================================
    // SUMMARY
    // ========================================================================
    console.log("\n" + "=".repeat(50));
    console.log("📊 Migration Summary:");
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors:  ${errorCount}`);
    console.log("=".repeat(50));

    // Verify tables were created
    console.log("\n🔍 Verifying tables...\n");

    const [tables] = await connection.query(
      `
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME IN ('calendar_events', 'project_milestones', 'calendar_integrations', 'task_dependencies')
    `,
      [process.env.DB_NAME || "mpm_agile_tools"]
    );

    if (tables.length === 4) {
      console.log("✅ All 4 calendar tables created successfully!");
      tables.forEach((t) => console.log(`   - ${t.TABLE_NAME}`));
    } else {
      console.log(`⚠️  Only ${tables.length}/4 tables found:`);
      tables.forEach((t) => console.log(`   - ${t.TABLE_NAME}`));
    }

    // Check tasks table for new columns
    const [columns] = await connection.query(
      `
      SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? 
      AND TABLE_NAME = 'tasks' 
      AND COLUMN_NAME IN ('start_date', 'estimated_hours', 'progress_percentage')
    `,
      [process.env.DB_NAME || "mpm_agile_tools"]
    );

    if (columns.length === 3) {
      console.log("\n✅ All 3 new columns added to tasks table!");
      columns.forEach((c) => console.log(`   - ${c.COLUMN_NAME}`));
    } else {
      console.log(`\n⚠️  Only ${columns.length}/3 columns found in tasks:`);
      columns.forEach((c) => console.log(`   - ${c.COLUMN_NAME}`));
    }

    console.log("\n🎉 Calendar & Scheduling migration completed!\n");
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();
