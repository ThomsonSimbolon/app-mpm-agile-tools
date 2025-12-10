const { Department, User, Team } = require("../models");
const {
  formatResponse,
  getPagination,
  formatPaginatedResponse,
} = require("../utils/helpers");
const { Op } = require("sequelize");

/**
 * Create new department
 * POST /api/departments
 */
exports.create = async (req, res, next) => {
  try {
    const { name, code, description, parent_id, head_user_id } = req.body;

    // Calculate level based on parent
    let level = 0;
    if (parent_id) {
      const parent = await Department.findByPk(parent_id);
      if (!parent) {
        return res
          .status(404)
          .json(formatResponse(false, "Parent department not found"));
      }
      level = parent.level + 1;
    }

    const department = await Department.create({
      name,
      code: code.toUpperCase(),
      description,
      parent_id,
      head_user_id,
      level,
    });

    const fullDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: User,
          as: "head",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        { model: Department, as: "parent", attributes: ["id", "name", "code"] },
      ],
    });

    res
      .status(201)
      .json(
        formatResponse(true, "Department created successfully", {
          department: fullDepartment,
        })
      );
  } catch (error) {
    next(error);
  }
};

/**
 * Get all departments with hierarchy
 * GET /api/departments
 */
exports.list = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, search, parent_id, flat } = req.query;

    // If flat=true, return flat list with pagination
    if (flat === "true") {
      const { offset, limit: queryLimit } = getPagination(page, limit);
      const where = { is_active: true };

      if (search) {
        where[Op.or] = [
          { name: { [Op.like]: `%${search}%` } },
          { code: { [Op.like]: `%${search}%` } },
        ];
      }

      if (parent_id !== undefined) {
        where.parent_id = parent_id || null;
      }

      const departments = await Department.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "head",
            attributes: ["id", "username", "full_name", "avatar_url"],
          },
          {
            model: Department,
            as: "parent",
            attributes: ["id", "name", "code"],
          },
        ],
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
        limit: queryLimit,
        offset,
      });

      return res.json(
        formatResponse(
          true,
          "Departments retrieved successfully",
          formatPaginatedResponse(departments, page, queryLimit)
        )
      );
    }

    // Return hierarchical structure
    const buildHierarchy = async (parentId = null) => {
      const departments = await Department.findAll({
        where: { parent_id: parentId, is_active: true },
        include: [
          {
            model: User,
            as: "head",
            attributes: ["id", "username", "full_name", "avatar_url"],
          },
        ],
        order: [
          ["order", "ASC"],
          ["name", "ASC"],
        ],
      });

      const result = [];
      for (const dept of departments) {
        const children = await buildHierarchy(dept.id);
        const teamCount = await Team.count({
          where: { department_id: dept.id, is_active: true },
        });

        result.push({
          ...dept.toJSON(),
          children,
          teamCount,
        });
      }
      return result;
    };

    const hierarchy = await buildHierarchy();

    res.json(
      formatResponse(true, "Departments retrieved successfully", {
        departments: hierarchy,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Get department by ID
 * GET /api/departments/:id
 */
exports.getById = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "head",
          attributes: ["id", "username", "full_name", "avatar_url", "email"],
        },
        { model: Department, as: "parent", attributes: ["id", "name", "code"] },
        {
          model: Department,
          as: "children",
          where: { is_active: true },
          required: false,
          attributes: ["id", "name", "code"],
        },
        {
          model: Team,
          as: "teams",
          where: { is_active: true },
          required: false,
          include: [
            {
              model: User,
              as: "lead",
              attributes: ["id", "username", "full_name", "avatar_url"],
            },
          ],
        },
      ],
    });

    if (!department) {
      return res
        .status(404)
        .json(formatResponse(false, "Department not found"));
    }

    res.json(
      formatResponse(true, "Department retrieved successfully", { department })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Update department
 * PUT /api/departments/:id
 */
exports.update = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res
        .status(404)
        .json(formatResponse(false, "Department not found"));
    }

    const {
      name,
      code,
      description,
      parent_id,
      head_user_id,
      order,
      is_active,
    } = req.body;

    // Prevent circular reference
    if (parent_id && parent_id === department.id) {
      return res
        .status(400)
        .json(formatResponse(false, "Department cannot be its own parent"));
    }

    // Check if setting as child of its own descendant
    if (parent_id) {
      const isDescendant = async (parentId, targetId) => {
        const children = await Department.findAll({
          where: { parent_id: parentId },
        });
        for (const child of children) {
          if (child.id === targetId) return true;
          if (await isDescendant(child.id, targetId)) return true;
        }
        return false;
      };

      if (await isDescendant(department.id, parent_id)) {
        return res
          .status(400)
          .json(
            formatResponse(
              false,
              "Cannot set parent to a descendant department"
            )
          );
      }
    }

    // Calculate new level
    let level = 0;
    if (parent_id) {
      const parent = await Department.findByPk(parent_id);
      if (parent) {
        level = parent.level + 1;
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (parent_id !== undefined) {
      updateData.parent_id = parent_id;
      updateData.level = level;
    }
    if (head_user_id !== undefined) updateData.head_user_id = head_user_id;
    if (order !== undefined) updateData.order = order;
    if (is_active !== undefined) updateData.is_active = is_active;

    await department.update(updateData);

    const updatedDepartment = await Department.findByPk(department.id, {
      include: [
        {
          model: User,
          as: "head",
          attributes: ["id", "username", "full_name", "avatar_url"],
        },
        { model: Department, as: "parent", attributes: ["id", "name", "code"] },
      ],
    });

    res.json(
      formatResponse(true, "Department updated successfully", {
        department: updatedDepartment,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Delete department
 * DELETE /api/departments/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res
        .status(404)
        .json(formatResponse(false, "Department not found"));
    }

    // Check if has children
    const childCount = await Department.count({
      where: { parent_id: department.id },
    });
    if (childCount > 0) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Cannot delete department with sub-departments. Please delete or move sub-departments first."
          )
        );
    }

    // Check if has teams
    const teamCount = await Team.count({
      where: { department_id: department.id },
    });
    if (teamCount > 0) {
      return res
        .status(400)
        .json(
          formatResponse(
            false,
            "Cannot delete department with teams. Please delete or move teams first."
          )
        );
    }

    // Soft delete
    await department.update({ is_active: false });

    res.json(formatResponse(true, "Department deleted successfully"));
  } catch (error) {
    next(error);
  }
};

/**
 * Get department statistics
 * GET /api/departments/:id/stats
 */
exports.getStats = async (req, res, next) => {
  try {
    const department = await Department.findByPk(req.params.id);

    if (!department) {
      return res
        .status(404)
        .json(formatResponse(false, "Department not found"));
    }

    // Count sub-departments recursively
    const countSubDepartments = async (parentId) => {
      const children = await Department.findAll({
        where: { parent_id: parentId, is_active: true },
      });
      let count = children.length;
      for (const child of children) {
        count += await countSubDepartments(child.id);
      }
      return count;
    };

    // Count teams in department and sub-departments
    const countTeams = async (deptId) => {
      let count = await Team.count({
        where: { department_id: deptId, is_active: true },
      });
      const children = await Department.findAll({
        where: { parent_id: deptId, is_active: true },
      });
      for (const child of children) {
        count += await countTeams(child.id);
      }
      return count;
    };

    const stats = {
      subDepartmentCount: await countSubDepartments(department.id),
      directTeamCount: await Team.count({
        where: { department_id: department.id, is_active: true },
      }),
      totalTeamCount: await countTeams(department.id),
    };

    res.json(
      formatResponse(true, "Department statistics retrieved successfully", {
        stats,
      })
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Reorder departments
 * PUT /api/departments/reorder
 */
exports.reorder = async (req, res, next) => {
  try {
    const { orders } = req.body; // Array of { id, order }

    if (!Array.isArray(orders)) {
      return res
        .status(400)
        .json(formatResponse(false, "Orders must be an array"));
    }

    for (const item of orders) {
      await Department.update(
        { order: item.order },
        { where: { id: item.id } }
      );
    }

    res.json(formatResponse(true, "Departments reordered successfully"));
  } catch (error) {
    next(error);
  }
};
