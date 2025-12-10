/**
 * Export Controller
 *
 * Handles export to PDF and Excel for reports
 */

const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const { Op } = require("sequelize");
const {
  Project,
  Sprint,
  Task,
  User,
  ProjectMember,
  TimeLog,
} = require("../models");
const { formatResponse } = require("../utils/helpers");

/**
 * Export Project Report to PDF
 * GET /api/reports/projects/:projectId/export/pdf
 */
exports.exportProjectPDF = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Get project data
    const project = await Project.findByPk(projectId, {
      include: [
        {
          model: User,
          as: "owner",
          attributes: ["id", "full_name"],
        },
      ],
    });

    if (!project) {
      return res.status(404).json(formatResponse(false, "Project not found"));
    }

    // Get tasks
    const tasks = await Task.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "full_name"],
        },
      ],
      order: [
        ["status", "ASC"],
        ["priority", "DESC"],
      ],
    });

    // Get sprints
    const sprints = await Sprint.findAll({
      where: { project_id: projectId },
      order: [["start_date", "DESC"]],
    });

    // Calculate statistics
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === "done").length,
      totalPoints: tasks.reduce((sum, t) => sum + (t.story_points || 0), 0),
      completedPoints: tasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.story_points || 0), 0),
    };

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.name.replace(/\s+/g, "_")}_Report.pdf"`
    );

    // Pipe PDF to response
    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Project Report", { align: "center" });
    doc.moveDown();

    // Project Info
    doc.fontSize(18).font("Helvetica-Bold").text(project.name);
    doc
      .fontSize(12)
      .font("Helvetica")
      .text(`Key: ${project.key || "N/A"}`);
    doc.text(`Owner: ${project.owner?.full_name || "N/A"}`);
    doc.text(`Generated: ${new Date().toLocaleDateString("id-ID")}`);
    doc.moveDown();

    // Description
    if (project.description) {
      doc.fontSize(14).font("Helvetica-Bold").text("Description");
      doc.fontSize(11).font("Helvetica").text(project.description);
      doc.moveDown();
    }

    // Statistics
    doc.fontSize(14).font("Helvetica-Bold").text("Statistics");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Tasks: ${stats.totalTasks}`);
    doc.text(`Completed Tasks: ${stats.completedTasks}`);
    doc.text(
      `Completion Rate: ${
        stats.totalTasks > 0
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
          : 0
      }%`
    );
    doc.text(`Total Story Points: ${stats.totalPoints}`);
    doc.text(`Completed Points: ${stats.completedPoints}`);
    doc.text(`Total Sprints: ${sprints.length}`);
    doc.moveDown();

    // Tasks by Status
    doc.fontSize(14).font("Helvetica-Bold").text("Tasks by Status");
    doc.fontSize(11).font("Helvetica");
    const statusCounts = {
      backlog: tasks.filter((t) => t.status === "backlog").length,
      todo: tasks.filter((t) => t.status === "todo").length,
      in_progress: tasks.filter((t) => t.status === "in_progress").length,
      in_review: tasks.filter((t) => t.status === "in_review").length,
      done: tasks.filter((t) => t.status === "done").length,
    };
    Object.entries(statusCounts).forEach(([status, count]) => {
      doc.text(`${status.replace("_", " ").toUpperCase()}: ${count}`);
    });
    doc.moveDown();

    // Task List
    doc.addPage();
    doc.fontSize(14).font("Helvetica-Bold").text("Task List");
    doc.moveDown(0.5);

    tasks.slice(0, 50).forEach((task, index) => {
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${index + 1}. ${task.title}`);
      doc.fontSize(9).font("Helvetica");
      doc.text(
        `   Key: ${task.task_key} | Status: ${task.status} | Priority: ${
          task.priority
        } | Points: ${task.story_points || 0}`
      );
      doc.text(`   Assignee: ${task.assignee?.full_name || "Unassigned"}`);
      doc.moveDown(0.3);
    });

    if (tasks.length > 50) {
      doc.text(`... and ${tasks.length - 50} more tasks`);
    }

    // Finalize PDF
    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Export Project Report to Excel
 * GET /api/reports/projects/:projectId/export/excel
 */
exports.exportProjectExcel = async (req, res, next) => {
  try {
    const { projectId } = req.params;

    // Get project data
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json(formatResponse(false, "Project not found"));
    }

    // Get tasks with all details
    const tasks = await Task.findAll({
      where: { project_id: projectId },
      include: [
        {
          model: User,
          as: "assignee",
          attributes: ["id", "full_name"],
        },
        {
          model: User,
          as: "creator",
          attributes: ["id", "full_name"],
        },
        {
          model: Sprint,
          as: "sprint",
          attributes: ["id", "name"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MPM Agile Tools";
    workbook.created = new Date();

    // Sheet 1: Summary
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 20 },
    ];

    const stats = {
      "Project Name": project.name,
      "Project Key": project.key || "N/A",
      "Total Tasks": tasks.length,
      "Completed Tasks": tasks.filter((t) => t.status === "done").length,
      "In Progress": tasks.filter((t) => t.status === "in_progress").length,
      "In Review": tasks.filter((t) => t.status === "in_review").length,
      "To Do": tasks.filter((t) => t.status === "todo").length,
      Backlog: tasks.filter((t) => t.status === "backlog").length,
      "Total Story Points": tasks.reduce(
        (sum, t) => sum + (t.story_points || 0),
        0
      ),
      "Completed Points": tasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.story_points || 0), 0),
      "Report Generated": new Date().toLocaleString("id-ID"),
    };

    Object.entries(stats).forEach(([metric, value]) => {
      summarySheet.addRow({ metric, value });
    });

    // Style summary header
    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B46C1" },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Sheet 2: Tasks
    const tasksSheet = workbook.addWorksheet("Tasks");
    tasksSheet.columns = [
      { header: "Task Key", key: "task_key", width: 15 },
      { header: "Title", key: "title", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Story Points", key: "story_points", width: 15 },
      { header: "Assignee", key: "assignee", width: 20 },
      { header: "Sprint", key: "sprint", width: 20 },
      { header: "Created By", key: "created_by", width: 20 },
      { header: "Created At", key: "created_at", width: 20 },
      { header: "Due Date", key: "due_date", width: 15 },
    ];

    tasks.forEach((task) => {
      tasksSheet.addRow({
        task_key: task.task_key,
        title: task.title,
        status: task.status,
        priority: task.priority,
        story_points: task.story_points || 0,
        assignee: task.assignee?.full_name || "Unassigned",
        sprint: task.sprint?.name || "No Sprint",
        created_by: task.creator?.full_name || "Unknown",
        created_at: task.createdAt
          ? new Date(task.createdAt).toLocaleDateString("id-ID")
          : "",
        due_date: task.due_date
          ? new Date(task.due_date).toLocaleDateString("id-ID")
          : "",
      });
    });

    // Style tasks header
    tasksSheet.getRow(1).font = { bold: true };
    tasksSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B46C1" },
    };
    tasksSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Add borders
    tasksSheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" },
        };
      });
    });

    // Sheet 3: Tasks by Status
    const statusSheet = workbook.addWorksheet("By Status");
    statusSheet.columns = [
      { header: "Status", key: "status", width: 20 },
      { header: "Count", key: "count", width: 15 },
      { header: "Story Points", key: "points", width: 15 },
      { header: "Percentage", key: "percentage", width: 15 },
    ];

    const statuses = ["backlog", "todo", "in_progress", "in_review", "done"];
    statuses.forEach((status) => {
      const statusTasks = tasks.filter((t) => t.status === status);
      statusSheet.addRow({
        status: status.replace("_", " ").toUpperCase(),
        count: statusTasks.length,
        points: statusTasks.reduce((sum, t) => sum + (t.story_points || 0), 0),
        percentage:
          tasks.length > 0
            ? `${Math.round((statusTasks.length / tasks.length) * 100)}%`
            : "0%",
      });
    });

    statusSheet.getRow(1).font = { bold: true };
    statusSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B46C1" },
    };
    statusSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${project.name.replace(/\s+/g, "_")}_Report.xlsx"`
    );

    // Write to response
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Export Sprint Report to PDF
 * GET /api/reports/sprints/:sprintId/export/pdf
 */
exports.exportSprintPDF = async (req, res, next) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findByPk(sprintId, {
      include: [
        {
          model: Task,
          as: "tasks",
          include: [
            {
              model: User,
              as: "assignee",
              attributes: ["id", "full_name"],
            },
          ],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key"],
        },
      ],
    });

    if (!sprint) {
      return res.status(404).json(formatResponse(false, "Sprint not found"));
    }

    const tasks = sprint.tasks;
    const stats = {
      totalTasks: tasks.length,
      completedTasks: tasks.filter((t) => t.status === "done").length,
      totalPoints: tasks.reduce((sum, t) => sum + (t.story_points || 0), 0),
      completedPoints: tasks
        .filter((t) => t.status === "done")
        .reduce((sum, t) => sum + (t.story_points || 0), 0),
    };

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sprint.name.replace(/\s+/g, "_")}_Report.pdf"`
    );

    doc.pipe(res);

    // Header
    doc
      .fontSize(24)
      .font("Helvetica-Bold")
      .text("Sprint Report", { align: "center" });
    doc.moveDown();

    // Sprint Info
    doc.fontSize(18).font("Helvetica-Bold").text(sprint.name);
    doc.fontSize(12).font("Helvetica");
    doc.text(`Project: ${sprint.project?.name || "N/A"}`);
    doc.text(`Status: ${sprint.status.toUpperCase()}`);
    doc.text(
      `Period: ${new Date(sprint.start_date).toLocaleDateString(
        "id-ID"
      )} - ${new Date(sprint.end_date).toLocaleDateString("id-ID")}`
    );
    doc.text(`Generated: ${new Date().toLocaleDateString("id-ID")}`);
    doc.moveDown();

    // Goal
    if (sprint.goal) {
      doc.fontSize(14).font("Helvetica-Bold").text("Sprint Goal");
      doc.fontSize(11).font("Helvetica").text(sprint.goal);
      doc.moveDown();
    }

    // Statistics
    doc.fontSize(14).font("Helvetica-Bold").text("Sprint Metrics");
    doc.fontSize(11).font("Helvetica");
    doc.text(`Total Tasks: ${stats.totalTasks}`);
    doc.text(`Completed Tasks: ${stats.completedTasks}`);
    doc.text(
      `Task Completion: ${
        stats.totalTasks > 0
          ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
          : 0
      }%`
    );
    doc.text(`Total Story Points: ${stats.totalPoints}`);
    doc.text(`Completed Points: ${stats.completedPoints}`);
    doc.text(
      `Points Completion: ${
        stats.totalPoints > 0
          ? Math.round((stats.completedPoints / stats.totalPoints) * 100)
          : 0
      }%`
    );
    doc.moveDown();

    // Task List
    doc.fontSize(14).font("Helvetica-Bold").text("Tasks");
    doc.moveDown(0.5);

    tasks.forEach((task, index) => {
      const statusIcon =
        task.status === "done"
          ? "✓"
          : task.status === "in_progress"
          ? "→"
          : "○";
      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(`${statusIcon} ${task.title}`);
      doc.fontSize(9).font("Helvetica");
      doc.text(
        `   ${task.task_key} | ${task.status} | ${task.priority} | ${
          task.story_points || 0
        } pts | ${task.assignee?.full_name || "Unassigned"}`
      );
      doc.moveDown(0.2);
    });

    doc.end();
  } catch (error) {
    next(error);
  }
};

/**
 * Export Sprint Report to Excel
 * GET /api/reports/sprints/:sprintId/export/excel
 */
exports.exportSprintExcel = async (req, res, next) => {
  try {
    const { sprintId } = req.params;

    const sprint = await Sprint.findByPk(sprintId, {
      include: [
        {
          model: Task,
          as: "tasks",
          include: [
            {
              model: User,
              as: "assignee",
              attributes: ["id", "full_name"],
            },
          ],
        },
        {
          model: Project,
          as: "project",
        },
      ],
    });

    if (!sprint) {
      return res.status(404).json(formatResponse(false, "Sprint not found"));
    }

    const tasks = sprint.tasks;

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = "MPM Agile Tools";
    workbook.created = new Date();

    // Summary Sheet
    const summarySheet = workbook.addWorksheet("Summary");
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 30 },
    ];

    const completedTasks = tasks.filter((t) => t.status === "done").length;
    const totalPoints = tasks.reduce(
      (sum, t) => sum + (t.story_points || 0),
      0
    );
    const completedPoints = tasks
      .filter((t) => t.status === "done")
      .reduce((sum, t) => sum + (t.story_points || 0), 0);

    const summaryData = {
      "Sprint Name": sprint.name,
      Project: sprint.project?.name || "N/A",
      Status: sprint.status.toUpperCase(),
      "Start Date": new Date(sprint.start_date).toLocaleDateString("id-ID"),
      "End Date": new Date(sprint.end_date).toLocaleDateString("id-ID"),
      "Sprint Goal": sprint.goal || "N/A",
      "Total Tasks": tasks.length,
      "Completed Tasks": completedTasks,
      "Task Completion Rate": `${
        tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0
      }%`,
      "Total Story Points": totalPoints,
      "Completed Points": completedPoints,
      "Points Completion Rate": `${
        totalPoints > 0 ? Math.round((completedPoints / totalPoints) * 100) : 0
      }%`,
    };

    Object.entries(summaryData).forEach(([metric, value]) => {
      summarySheet.addRow({ metric, value });
    });

    summarySheet.getRow(1).font = { bold: true };
    summarySheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B46C1" },
    };
    summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Tasks Sheet
    const tasksSheet = workbook.addWorksheet("Tasks");
    tasksSheet.columns = [
      { header: "Task Key", key: "task_key", width: 15 },
      { header: "Title", key: "title", width: 40 },
      { header: "Status", key: "status", width: 15 },
      { header: "Priority", key: "priority", width: 12 },
      { header: "Story Points", key: "story_points", width: 15 },
      { header: "Assignee", key: "assignee", width: 25 },
    ];

    tasks.forEach((task) => {
      tasksSheet.addRow({
        task_key: task.task_key,
        title: task.title,
        status: task.status.toUpperCase(),
        priority: task.priority.toUpperCase(),
        story_points: task.story_points || 0,
        assignee: task.assignee?.full_name || "Unassigned",
      });
    });

    tasksSheet.getRow(1).font = { bold: true };
    tasksSheet.getRow(1).fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6B46C1" },
    };
    tasksSheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };

    // Set response headers
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${sprint.name.replace(/\s+/g, "_")}_Report.xlsx"`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    next(error);
  }
};
