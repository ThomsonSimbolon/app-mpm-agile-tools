const { Comment, Task, User } = require('../models');
const { formatResponse } = require('../utils/helpers');

/**
 * Add comment to task
 * POST /api/tasks/:taskId/comments
 */
exports.create = async (req, res, next) => {
  try {
    const { content } = req.body;

    const comment = await Comment.create({
      task_id: req.params.taskId,
      user_id: req.user.id,
      content
    });

    const fullComment = await Comment.findByPk(comment.id, {
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
      ]
    });

    res.status(201).json(formatResponse(true, 'Comment added successfully', { comment: fullComment }));
  } catch (error) {
    next(error);
  }
};

/**
 * Get comments for task
 * GET /api/tasks/:taskId/comments
 */
exports.listByTask = async (req, res, next) => {
  try {
    const comments = await Comment.findAll({
      where: { task_id: req.params.taskId },
      include: [
        { model: User, as: 'user', attributes: ['id', 'username', 'full_name', 'avatar_url'] }
      ],
      order: [['created_at', 'ASC']]
    });

    res.json(formatResponse(true, 'Comments retrieved successfully', { comments }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update comment
 * PUT /api/comments/:id
 */
exports.update = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json(formatResponse(false, 'Comment not found'));
    }

    // Check if user owns the comment
    if (comment.user_id !== req.user.id) {
      return res.status(403).json(formatResponse(false, 'You can only edit your own comments'));
    }

    const { content } = req.body;
    await comment.update({ content });
    
    res.json(formatResponse(true, 'Comment updated successfully', { comment }));
  } catch (error) {
    next(error);
  }
};

/**
 * Delete comment
 * DELETE /api/comments/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      return res.status(404).json(formatResponse(false, 'Comment not found'));
    }

    // Check if user owns the comment
    if (comment.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json(formatResponse(false, 'You can only delete your own comments'));
    }

    await comment.destroy();
    
    res.json(formatResponse(true, 'Comment deleted successfully'));
  } catch (error) {
    next(error);
  }
};
