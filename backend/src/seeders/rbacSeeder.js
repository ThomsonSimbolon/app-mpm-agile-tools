/**
 * =============================================================================
 * RBAC SEEDER - Enterprise Role-Based Access Control Data Initialization
 * =============================================================================
 * Seeder untuk menginisialisasi data RBAC:
 * 1. Default Permissions
 * 2. Role-Permission Mappings
 * 3. Default Divisions/Departments
 *
 * Cara penggunaan:
 * - Jalankan: node src/seeders/rbacSeeder.js
 * - Atau dari app.js: require('./seeders/rbacSeeder').seedAll()
 * =============================================================================
 */

const { Sequelize } = require("sequelize");

/**
 * Initialize RBAC Seeder
 * @param {Object} models - Sequelize models object
 */
const initSeeder = (models) => {
  const { RbacPermission, RolePermission, Department, sequelize } = models;

  // =============================================================================
  // PERMISSION DEFINITIONS
  // =============================================================================
  const PERMISSIONS = [
    // System Permissions
    {
      code: "manage_all_users",
      name: "Kelola Semua User",
      description: "Dapat mengelola semua user di sistem",
      category: "system",
    },
    {
      code: "manage_all_projects",
      name: "Kelola Semua Project",
      description: "Dapat mengelola semua project di sistem",
      category: "system",
    },
    {
      code: "view_audit_logs",
      name: "Lihat Audit Log",
      description: "Dapat melihat log audit sistem",
      category: "system",
    },
    {
      code: "manage_rbac",
      name: "Kelola RBAC",
      description: "Dapat mengelola role dan permission",
      category: "system",
    },
    {
      code: "system_settings",
      name: "Pengaturan Sistem",
      description: "Dapat mengubah pengaturan sistem",
      category: "system",
    },
    {
      code: "override_permission",
      name: "Override Permission",
      description: "Dapat override permission user lain",
      category: "system",
    },
    {
      code: "manage_audit_logs",
      name: "Kelola Audit Log",
      description: "Dapat mengelola (hapus/arsip) audit log",
      category: "system",
    },

    // AI Permissions
    {
      code: "manage_ai_settings",
      name: "Kelola AI Settings",
      description: "Dapat mengkonfigurasi AI settings",
      category: "ai",
    },
    {
      code: "view_ai_analytics",
      name: "Lihat AI Analytics",
      description: "Dapat melihat analytics penggunaan AI",
      category: "ai",
    },
    {
      code: "use_ai_features",
      name: "Gunakan Fitur AI",
      description: "Dapat menggunakan fitur AI",
      category: "ai",
    },
    {
      code: "manage_ai_quota",
      name: "Kelola AI Quota",
      description: "Dapat mengelola quota penggunaan AI",
      category: "ai",
    },

    // Division Permissions
    {
      code: "manage_division",
      name: "Kelola Divisi",
      description: "Dapat mengelola divisi",
      category: "division",
    },
    {
      code: "view_division_reports",
      name: "Lihat Report Divisi",
      description: "Dapat melihat laporan divisi",
      category: "division",
    },
    {
      code: "manage_division_members",
      name: "Kelola Anggota Divisi",
      description: "Dapat mengelola anggota divisi",
      category: "division",
    },
    {
      code: "approve_division_requests",
      name: "Approve Request Divisi",
      description: "Dapat menyetujui request di divisi",
      category: "division",
    },
    {
      code: "view_division_budget",
      name: "Lihat Budget Divisi",
      description: "Dapat melihat budget divisi",
      category: "division",
    },
    {
      code: "manage_division_budget",
      name: "Kelola Budget Divisi",
      description: "Dapat mengelola budget divisi",
      category: "division",
    },
    {
      code: "view_hr_data",
      name: "Lihat Data HR",
      description: "Dapat melihat data HR (khusus HRD)",
      category: "division",
    },
    {
      code: "manage_hr_data",
      name: "Kelola Data HR",
      description: "Dapat mengelola data HR (khusus HRD)",
      category: "division",
    },

    // Team Permissions
    {
      code: "manage_team",
      name: "Kelola Team",
      description: "Dapat mengelola team",
      category: "team",
    },
    {
      code: "manage_team_members",
      name: "Kelola Anggota Team",
      description: "Dapat menambah/hapus anggota team",
      category: "team",
    },
    {
      code: "assign_team_tasks",
      name: "Assign Task Team",
      description: "Dapat assign task ke anggota team",
      category: "team",
    },
    {
      code: "manage_sprints",
      name: "Kelola Sprint",
      description: "Dapat mengelola sprint",
      category: "team",
    },
    {
      code: "manage_backlog",
      name: "Kelola Backlog",
      description: "Dapat mengelola product backlog",
      category: "team",
    },
    {
      code: "manage_qa",
      name: "Kelola QA",
      description: "Dapat mengelola quality assurance",
      category: "team",
    },
    {
      code: "view_team_reports",
      name: "Lihat Report Team",
      description: "Dapat melihat laporan team",
      category: "team",
    },

    // Project Permissions
    {
      code: "create_project",
      name: "Buat Project",
      description: "Dapat membuat project baru",
      category: "project",
    },
    {
      code: "edit_project",
      name: "Edit Project",
      description: "Dapat mengedit project",
      category: "project",
    },
    {
      code: "delete_project",
      name: "Hapus Project",
      description: "Dapat menghapus project",
      category: "project",
    },
    {
      code: "archive_project",
      name: "Arsipkan Project",
      description: "Dapat mengarsipkan project",
      category: "project",
    },
    {
      code: "manage_project_members",
      name: "Kelola Anggota Project",
      description: "Dapat mengelola anggota project",
      category: "project",
    },
    {
      code: "view_project_reports",
      name: "Lihat Report Project",
      description: "Dapat melihat laporan project",
      category: "project",
    },
    {
      code: "export_project",
      name: "Export Project",
      description: "Dapat export data project",
      category: "project",
    },
    {
      code: "manage_project_settings",
      name: "Kelola Settings Project",
      description: "Dapat mengelola pengaturan project",
      category: "project",
    },

    // Task Permissions
    {
      code: "create_task",
      name: "Buat Task",
      description: "Dapat membuat task baru",
      category: "task",
    },
    {
      code: "edit_task",
      name: "Edit Task",
      description: "Dapat mengedit task",
      category: "task",
    },
    {
      code: "edit_own_task",
      name: "Edit Task Sendiri",
      description: "Dapat mengedit task yang di-assign ke diri sendiri",
      category: "task",
    },
    {
      code: "delete_task",
      name: "Hapus Task",
      description: "Dapat menghapus task",
      category: "task",
    },
    {
      code: "assign_task",
      name: "Assign Task",
      description: "Dapat assign task ke user lain",
      category: "task",
    },
    {
      code: "change_task_status",
      name: "Ubah Status Task",
      description: "Dapat mengubah status task",
      category: "task",
    },
    {
      code: "change_task_priority",
      name: "Ubah Prioritas Task",
      description: "Dapat mengubah prioritas task",
      category: "task",
    },
    {
      code: "manage_task_labels",
      name: "Kelola Label Task",
      description: "Dapat mengelola label task",
      category: "task",
    },
    {
      code: "edit_story_points",
      name: "Edit Story Points",
      description: "Dapat mengedit story points task",
      category: "task",
    },
    {
      code: "approve_task",
      name: "Approve Task",
      description: "Dapat approve/reject task",
      category: "task",
    },
    {
      code: "bulk_edit_tasks",
      name: "Bulk Edit Tasks",
      description: "Dapat bulk edit banyak task sekaligus",
      category: "task",
    },
    {
      code: "edit_qa_fields",
      name: "Edit QA Fields",
      description: "Dapat mengedit field QA pada task",
      category: "task",
    },

    // Common Permissions
    {
      code: "view_dashboard",
      name: "Lihat Dashboard",
      description: "Dapat melihat dashboard",
      category: "common",
    },
    {
      code: "view_reports",
      name: "Lihat Reports",
      description: "Dapat melihat laporan",
      category: "common",
    },
    {
      code: "add_comment",
      name: "Tambah Komentar",
      description: "Dapat menambah komentar",
      category: "common",
    },
    {
      code: "upload_attachment",
      name: "Upload Attachment",
      description: "Dapat upload file",
      category: "common",
    },
    {
      code: "log_time",
      name: "Log Waktu",
      description: "Dapat mencatat waktu kerja",
      category: "common",
    },
  ];

  // =============================================================================
  // ROLE-PERMISSION MAPPINGS
  // =============================================================================
  const ROLE_PERMISSION_MAPPINGS = {
    // System Roles
    system: {
      super_admin: [
        "manage_all_users",
        "manage_all_projects",
        "view_audit_logs",
        "manage_rbac",
        "system_settings",
        "override_permission",
        "manage_audit_logs",
        "manage_ai_settings",
        "view_ai_analytics",
        "use_ai_features",
        "manage_ai_quota",
        "manage_division",
        "view_division_reports",
        "manage_division_members",
        "approve_division_requests",
        "view_division_budget",
        "manage_division_budget",
        "view_hr_data",
        "manage_hr_data",
        "manage_team",
        "manage_team_members",
        "assign_team_tasks",
        "manage_sprints",
        "manage_backlog",
        "manage_qa",
        "view_team_reports",
        "create_project",
        "edit_project",
        "delete_project",
        "archive_project",
        "manage_project_members",
        "view_project_reports",
        "export_project",
        "manage_project_settings",
        "create_task",
        "edit_task",
        "delete_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "approve_task",
        "bulk_edit_tasks",
        "edit_qa_fields",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
      ],
      admin: [
        "manage_all_users",
        "manage_all_projects",
        "view_audit_logs",
        "manage_rbac",
        "system_settings",
        "manage_ai_settings",
        "view_ai_analytics",
        "use_ai_features",
        "manage_ai_quota",
        "manage_division",
        "view_division_reports",
        "manage_division_members",
        "approve_division_requests",
        "view_division_budget",
        "manage_team",
        "manage_team_members",
        "assign_team_tasks",
        "manage_sprints",
        "manage_backlog",
        "manage_qa",
        "view_team_reports",
        "create_project",
        "edit_project",
        "delete_project",
        "archive_project",
        "manage_project_members",
        "view_project_reports",
        "export_project",
        "manage_project_settings",
        "create_task",
        "edit_task",
        "delete_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "approve_task",
        "bulk_edit_tasks",
        "edit_qa_fields",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
      ],
      security_officer: [
        "view_audit_logs",
        "manage_audit_logs",
        "view_ai_analytics",
        "view_division_reports",
        "view_team_reports",
        "view_project_reports",
        "view_dashboard",
        "view_reports",
      ],
      ai_admin: [
        "manage_ai_settings",
        "view_ai_analytics",
        "use_ai_features",
        "manage_ai_quota",
        "view_dashboard",
        "view_reports",
      ],
    },

    // Division Roles
    division: {
      division_head: [
        "manage_division",
        "view_division_reports",
        "manage_division_members",
        "approve_division_requests",
        "view_division_budget",
        "manage_division_budget",
        "manage_team",
        "manage_team_members",
        "view_team_reports",
        "create_project",
        "edit_project",
        "manage_project_members",
        "view_project_reports",
        "create_task",
        "edit_task",
        "assign_task",
        "change_task_status",
        "approve_task",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      division_manager: [
        "view_division_reports",
        "manage_division_members",
        "approve_division_requests",
        "view_division_budget",
        "manage_team",
        "manage_team_members",
        "view_team_reports",
        "create_project",
        "edit_project",
        "manage_project_members",
        "view_project_reports",
        "create_task",
        "edit_task",
        "assign_task",
        "change_task_status",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      division_viewer: [
        "view_division_reports",
        "view_division_budget",
        "view_team_reports",
        "view_project_reports",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "log_time",
      ],
      hr_reviewer: [
        "view_division_reports",
        "view_hr_data",
        "manage_hr_data",
        "view_team_reports",
        "view_project_reports",
        "view_dashboard",
        "view_reports",
        "add_comment",
      ],
    },

    // Team Roles
    team: {
      team_admin: [
        "manage_team",
        "manage_team_members",
        "assign_team_tasks",
        "manage_sprints",
        "manage_backlog",
        "view_team_reports",
        "create_task",
        "edit_task",
        "delete_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "approve_task",
        "bulk_edit_tasks",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      team_lead: [
        "manage_team_members",
        "assign_team_tasks",
        "manage_sprints",
        "view_team_reports",
        "create_task",
        "edit_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "approve_task",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      scrum_master: [
        "manage_sprints",
        "manage_backlog",
        "assign_team_tasks",
        "view_team_reports",
        "create_task",
        "edit_task",
        "assign_task",
        "change_task_status",
        "edit_story_points",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      product_owner: [
        "manage_backlog",
        "view_team_reports",
        "create_task",
        "edit_task",
        "change_task_priority",
        "edit_story_points",
        "approve_task",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "use_ai_features",
      ],
      qa_lead: [
        "manage_qa",
        "view_team_reports",
        "create_task",
        "edit_qa_fields",
        "change_task_status",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
      ],
      member: [
        "view_team_reports",
        "create_task",
        "edit_own_task",
        "change_task_status",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
      ],
    },

    // Project Roles
    project: {
      project_owner: [
        "edit_project",
        "delete_project",
        "archive_project",
        "manage_project_members",
        "view_project_reports",
        "export_project",
        "manage_project_settings",
        "create_task",
        "edit_task",
        "delete_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "approve_task",
        "bulk_edit_tasks",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      project_manager: [
        "edit_project",
        "manage_project_members",
        "view_project_reports",
        "export_project",
        "manage_project_settings",
        "create_task",
        "edit_task",
        "delete_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "approve_task",
        "bulk_edit_tasks",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      tech_lead: [
        "view_project_reports",
        "create_task",
        "edit_task",
        "delete_task",
        "assign_task",
        "change_task_status",
        "change_task_priority",
        "manage_task_labels",
        "edit_story_points",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      developer: [
        "view_project_reports",
        "create_task",
        "edit_own_task",
        "change_task_status",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
        "use_ai_features",
      ],
      qa_tester: [
        "view_project_reports",
        "create_task",
        "edit_qa_fields",
        "change_task_status",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
      ],
      report_viewer: [
        "view_project_reports",
        "view_dashboard",
        "view_reports",
        "add_comment",
      ],
      stakeholder: ["view_project_reports", "view_dashboard", "add_comment"],
      member: [
        "view_project_reports",
        "create_task",
        "edit_own_task",
        "change_task_status",
        "view_dashboard",
        "view_reports",
        "add_comment",
        "upload_attachment",
        "log_time",
      ],
    },
  };

  // =============================================================================
  // DEFAULT DIVISIONS
  // =============================================================================
  const DEFAULT_DIVISIONS = [
    {
      name: "IT",
      code: "IT",
      description: "Information Technology Division",
      level: 0,
      order: 1,
      is_active: true,
    },
    {
      name: "HRD",
      code: "HRD",
      description: "Human Resources Development",
      level: 0,
      order: 2,
      is_active: true,
    },
    {
      name: "Finance",
      code: "FIN",
      description: "Finance Division",
      level: 0,
      order: 3,
      is_active: true,
    },
    {
      name: "Admin Marketing",
      code: "ADM",
      description: "Admin Marketing Division",
      level: 0,
      order: 4,
      is_active: true,
    },
    {
      name: "Marketing",
      code: "MKT",
      description: "Marketing Division",
      level: 0,
      order: 5,
      is_active: true,
    },
    {
      name: "Instruktur",
      code: "INS",
      description: "Instructor Division",
      level: 0,
      order: 6,
      is_active: true,
    },
  ];

  // =============================================================================
  // SEEDER FUNCTIONS
  // =============================================================================

  /**
   * Seed permissions
   */
  const seedPermissions = async () => {
    console.log("🔐 Seeding RBAC Permissions...");

    let created = 0;
    let existing = 0;

    for (const perm of PERMISSIONS) {
      const [permission, wasCreated] = await RbacPermission.findOrCreate({
        where: { code: perm.code },
        defaults: perm,
      });

      if (wasCreated) {
        created++;
      } else {
        existing++;
      }
    }

    console.log(`   ✓ Created: ${created} permissions`);
    console.log(`   ✓ Already existing: ${existing} permissions`);

    return { created, existing };
  };

  /**
   * Seed role-permission mappings
   */
  const seedRolePermissionMappings = async () => {
    console.log("🔗 Seeding Role-Permission Mappings...");

    let created = 0;
    let errors = 0;

    for (const [roleType, roles] of Object.entries(ROLE_PERMISSION_MAPPINGS)) {
      for (const [roleName, permissionCodes] of Object.entries(roles)) {
        for (const permCode of permissionCodes) {
          try {
            // Get permission ID
            const permission = await RbacPermission.findOne({
              where: { code: permCode },
            });

            if (!permission) {
              console.warn(
                `   ⚠ Permission not found: ${permCode} for ${roleType}.${roleName}`
              );
              errors++;
              continue;
            }

            // Create mapping
            const [mapping, wasCreated] = await RolePermission.findOrCreate({
              where: {
                role_type: roleType,
                role_name: roleName,
                permission_id: permission.id,
              },
              defaults: {
                role_type: roleType,
                role_name: roleName,
                permission_id: permission.id,
                is_conditional: false,
              },
            });

            if (wasCreated) {
              created++;
            }
          } catch (error) {
            console.error(
              `   ✗ Error mapping ${permCode} to ${roleType}.${roleName}:`,
              error.message
            );
            errors++;
          }
        }
      }
    }

    console.log(`   ✓ Created: ${created} mappings`);
    if (errors > 0) {
      console.log(`   ⚠ Errors: ${errors}`);
    }

    return { created, errors };
  };

  /**
   * Seed default divisions
   */
  const seedDivisions = async () => {
    console.log("🏢 Seeding Default Divisions...");

    let created = 0;
    let existing = 0;

    for (const div of DEFAULT_DIVISIONS) {
      const [department, wasCreated] = await Department.findOrCreate({
        where: { code: div.code },
        defaults: div,
      });

      if (wasCreated) {
        created++;
      } else {
        existing++;
      }
    }

    console.log(`   ✓ Created: ${created} divisions`);
    console.log(`   ✓ Already existing: ${existing} divisions`);

    return { created, existing };
  };

  /**
   * Seed conditional role permissions (e.g., own_only for staff)
   */
  const seedConditionalPermissions = async () => {
    console.log("⚙️ Seeding Conditional Permissions...");

    const conditionalMappings = [
      // Staff: edit_own_task only
      {
        role_type: "team",
        role_name: "member",
        permission_code: "edit_own_task",
        is_conditional: true,
        condition_type: "own_only",
        condition_config: { field: "assigned_to", check: "equals_user_id" },
      },
      // Developer: edit_own_task only
      {
        role_type: "project",
        role_name: "developer",
        permission_code: "edit_own_task",
        is_conditional: true,
        condition_type: "own_only",
        condition_config: { field: "assigned_to", check: "equals_user_id" },
      },
      // QA Tester: edit_qa_fields only
      {
        role_type: "project",
        role_name: "qa_tester",
        permission_code: "edit_qa_fields",
        is_conditional: true,
        condition_type: "qa_fields_only",
        condition_config: {
          allowed_fields: [
            "test_status",
            "test_notes",
            "bug_count",
            "is_verified",
          ],
        },
      },
      // QA Lead: edit_qa_fields
      {
        role_type: "team",
        role_name: "qa_lead",
        permission_code: "edit_qa_fields",
        is_conditional: true,
        condition_type: "qa_fields_only",
        condition_config: {
          allowed_fields: [
            "test_status",
            "test_notes",
            "bug_count",
            "is_verified",
            "qa_priority",
          ],
        },
      },
    ];

    let updated = 0;

    for (const cond of conditionalMappings) {
      const permission = await RbacPermission.findOne({
        where: { code: cond.permission_code },
      });

      if (!permission) {
        console.warn(`   ⚠ Permission not found: ${cond.permission_code}`);
        continue;
      }

      const [affected] = await RolePermission.update(
        {
          is_conditional: cond.is_conditional,
          condition_type: cond.condition_type,
          condition_config: cond.condition_config,
        },
        {
          where: {
            role_type: cond.role_type,
            role_name: cond.role_name,
            permission_id: permission.id,
          },
        }
      );

      if (affected > 0) {
        updated++;
      }
    }

    console.log(`   ✓ Updated: ${updated} conditional permissions`);

    return { updated };
  };

  /**
   * Seed all RBAC data
   */
  const seedAll = async () => {
    console.log("\n" + "=".repeat(60));
    console.log("🚀 Starting RBAC Seeder...");
    console.log("=".repeat(60) + "\n");

    const startTime = Date.now();

    try {
      // Run seeders in order
      const permResult = await seedPermissions();
      const divResult = await seedDivisions();
      const mappingResult = await seedRolePermissionMappings();
      const condResult = await seedConditionalPermissions();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log("\n" + "=".repeat(60));
      console.log("✅ RBAC Seeder Completed!");
      console.log("=".repeat(60));
      console.log(`📊 Summary:`);
      console.log(
        `   - Permissions: ${permResult.created} created, ${permResult.existing} existing`
      );
      console.log(
        `   - Divisions: ${divResult.created} created, ${divResult.existing} existing`
      );
      console.log(
        `   - Role Mappings: ${mappingResult.created} created, ${mappingResult.errors} errors`
      );
      console.log(
        `   - Conditional Permissions: ${condResult.updated} updated`
      );
      console.log(`⏱️ Duration: ${duration}s\n`);

      return {
        success: true,
        permissions: permResult,
        divisions: divResult,
        mappings: mappingResult,
        conditions: condResult,
        duration,
      };
    } catch (error) {
      console.error("\n❌ RBAC Seeder Failed:", error.message);
      console.error(error.stack);
      return {
        success: false,
        error: error.message,
      };
    }
  };

  /**
   * Clear all RBAC data (use with caution!)
   */
  const clearAll = async () => {
    console.log("\n⚠️ Clearing all RBAC data...");

    await RolePermission.destroy({ where: {}, truncate: true });
    await RbacPermission.destroy({ where: {}, truncate: true });

    console.log("✓ RBAC data cleared\n");
  };

  return {
    seedPermissions,
    seedRolePermissionMappings,
    seedDivisions,
    seedConditionalPermissions,
    seedAll,
    clearAll,
    PERMISSIONS,
    ROLE_PERMISSION_MAPPINGS,
    DEFAULT_DIVISIONS,
  };
};

// =============================================================================
// CLI EXECUTION
// =============================================================================
if (require.main === module) {
  // Run as standalone script
  const models = require("../models");
  const seeder = initSeeder(models);

  // Check command line args
  const args = process.argv.slice(2);

  if (args.includes("--clear")) {
    seeder
      .clearAll()
      .then(() => seeder.seedAll())
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  } else {
    seeder
      .seedAll()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error(err);
        process.exit(1);
      });
  }
}

module.exports = initSeeder;
