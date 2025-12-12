/**
 * Milestone Controller
 * Handles project milestones CRUD operations
 */

const {
  ProjectMilestone,
  Project,
  User,
  ProjectMember,
  sequelize,
} = require("../models");
const { Op } = require("sequelize");

// Get all milestones for a project
exports.getMilestones = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { status, include_overdue_check } = req.query;

    // Validate project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Build where clause
    const whereClause = { project_id };
    if (status) {
      whereClause.status = status;
    }

    const milestones = await ProjectMilestone.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
      order: [
        ["sort_order", "ASC"],
        ["target_date", "ASC"],
      ],
    });

    // Optionally check and update overdue status
    if (include_overdue_check === "true") {
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      for (const milestone of milestones) {
        if (
          milestone.status === "pending" &&
          new Date(milestone.target_date) < now
        ) {
          await milestone.update({ status: "overdue" });
          milestone.status = "overdue";
        }
      }
    }

    res.json({
      success: true,
      data: milestones,
      meta: {
        total: milestones.length,
        project: {
          id: project.id,
          name: project.name,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching milestones:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch milestones",
      error: error.message,
    });
  }
};

// Get single milestone
exports.getMilestone = async (req, res) => {
  try {
    const { id } = req.params;

    const milestone = await ProjectMilestone.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    res.json({
      success: true,
      data: milestone,
    });
  } catch (error) {
    console.error("Error fetching milestone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch milestone",
      error: error.message,
    });
  }
};

// Create milestone
exports.createMilestone = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { name, description, target_date, color, sort_order } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !target_date) {
      return res.status(400).json({
        success: false,
        message: "Name and target date are required",
      });
    }

    // Validate project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check user has access to project
    const isMember = await ProjectMember.findOne({
      where: { project_id, user_id: userId },
    });

    if (!isMember && project.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this project",
      });
    }

    // Get max sort_order for this project
    const maxSortOrder = await ProjectMilestone.max("sort_order", {
      where: { project_id },
    });

    const milestone = await ProjectMilestone.create({
      project_id,
      name,
      description,
      target_date: new Date(target_date),
      color: color || "#10B981",
      sort_order: sort_order ?? (maxSortOrder || 0) + 1,
      created_by: userId,
    });

    // Reload with associations
    const createdMilestone = await ProjectMilestone.findByPk(milestone.id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Milestone created successfully",
      data: createdMilestone,
    });
  } catch (error) {
    console.error("Error creating milestone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create milestone",
      error: error.message,
    });
  }
};

// Update milestone
exports.updateMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;

    const milestone = await ProjectMilestone.findByPk(id, {
      include: [{ model: Project, as: "project" }],
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    // Check user has access
    const isMember = await ProjectMember.findOne({
      where: { project_id: milestone.project_id, user_id: userId },
    });

    if (!isMember && milestone.project.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to update this milestone",
      });
    }

    // Handle completion
    if (updateData.status === "completed" && !milestone.completed_date) {
      updateData.completed_date = new Date();
    }

    // Clear completed_date if status changed from completed
    if (updateData.status && updateData.status !== "completed") {
      updateData.completed_date = null;
    }

    await milestone.update({
      ...updateData,
      target_date: updateData.target_date
        ? new Date(updateData.target_date)
        : milestone.target_date,
    });

    // Reload with associations
    const updatedMilestone = await ProjectMilestone.findByPk(id, {
      include: [
        {
          model: User,
          as: "creator",
          attributes: ["id", "username", "email", "avatar"],
        },
        {
          model: Project,
          as: "project",
          attributes: ["id", "name", "key", "color"],
        },
      ],
    });

    res.json({
      success: true,
      message: "Milestone updated successfully",
      data: updatedMilestone,
    });
  } catch (error) {
    console.error("Error updating milestone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update milestone",
      error: error.message,
    });
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const milestone = await ProjectMilestone.findByPk(id, {
      include: [{ model: Project, as: "project" }],
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    // Check user has access
    const isMember = await ProjectMember.findOne({
      where: { project_id: milestone.project_id, user_id: userId },
    });

    if (!isMember && milestone.project.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to delete this milestone",
      });
    }

    await milestone.destroy();

    res.json({
      success: true,
      message: "Milestone deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting milestone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete milestone",
      error: error.message,
    });
  }
};

// Complete milestone
exports.completeMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const milestone = await ProjectMilestone.findByPk(id, {
      include: [{ model: Project, as: "project" }],
    });

    if (!milestone) {
      return res.status(404).json({
        success: false,
        message: "Milestone not found",
      });
    }

    // Check user has access
    const isMember = await ProjectMember.findOne({
      where: { project_id: milestone.project_id, user_id: userId },
    });

    if (!isMember && milestone.project.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to complete this milestone",
      });
    }

    await milestone.update({
      status: "completed",
      completed_date: new Date(),
    });

    res.json({
      success: true,
      message: "Milestone completed successfully",
      data: milestone,
    });
  } catch (error) {
    console.error("Error completing milestone:", error);
    res.status(500).json({
      success: false,
      message: "Failed to complete milestone",
      error: error.message,
    });
  }
};

// Reorder milestones
exports.reorderMilestones = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { milestones } = req.body; // Array of { id, sort_order }
    const userId = req.user.id;

    // Validate project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Check user has access
    const isMember = await ProjectMember.findOne({
      where: { project_id, user_id: userId },
    });

    if (!isMember && project.owner_id !== userId) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to reorder milestones",
      });
    }

    // Update sort orders in transaction
    await sequelize.transaction(async (t) => {
      for (const item of milestones) {
        await ProjectMilestone.update(
          { sort_order: item.sort_order },
          { where: { id: item.id, project_id }, transaction: t }
        );
      }
    });

    // Get updated milestones
    const updatedMilestones = await ProjectMilestone.findAll({
      where: { project_id },
      order: [["sort_order", "ASC"]],
    });

    res.json({
      success: true,
      message: "Milestones reordered successfully",
      data: updatedMilestones,
    });
  } catch (error) {
    console.error("Error reordering milestones:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reorder milestones",
      error: error.message,
    });
  }
};

// Get milestones for timeline/roadmap view
exports.getProjectRoadmap = async (req, res) => {
  try {
    const { project_id } = req.params;
    const { start_date, end_date } = req.query;

    // Validate project exists
    const project = await Project.findByPk(project_id);
    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
      });
    }

    // Build where clause
    const whereClause = {
      project_id,
      status: { [Op.ne]: "cancelled" },
    };

    // Filter by date range if provided
    if (start_date && end_date) {
      whereClause.target_date = {
        [Op.between]: [new Date(start_date), new Date(end_date)],
      };
    }

    const milestones = await ProjectMilestone.findAll({
      where: whereClause,
      order: [["target_date", "ASC"]],
    });

    // Group milestones by month
    const roadmap = {};
    milestones.forEach((milestone) => {
      const date = new Date(milestone.target_date);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!roadmap[monthKey]) {
        roadmap[monthKey] = {
          month: monthKey,
          label: date.toLocaleDateString("en-US", {
            month: "long",
            year: "numeric",
          }),
          milestones: [],
        };
      }

      roadmap[monthKey].milestones.push(milestone);
    });

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          name: project.name,
          key: project.key,
        },
        roadmap: Object.values(roadmap),
        totalMilestones: milestones.length,
        completed: milestones.filter((m) => m.status === "completed").length,
        pending: milestones.filter((m) => m.status === "pending").length,
        overdue: milestones.filter((m) => m.status === "overdue").length,
      },
    });
  } catch (error) {
    console.error("Error fetching project roadmap:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch project roadmap",
      error: error.message,
    });
  }
};
