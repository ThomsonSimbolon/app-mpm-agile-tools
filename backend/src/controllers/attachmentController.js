const { Attachment, Task, User } = require('../models');
const { formatResponse } = require('../utils/helpers');
const fs = require('fs');
const path = require('path');

/**
 * Upload attachment to task
 * POST /api/tasks/:taskId/attachments
 */
exports.upload = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json(formatResponse(false, 'No file uploaded'));
    }

    const attachment = await Attachment.create({
      task_id: req.params.taskId,
      filename: req.file.filename,
      original_name: req.file.originalname,
      file_path: req.file.path,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      uploaded_by: req.user.id
    });

    res.status(201).json(formatResponse(true, 'File uploaded successfully', { attachment }));
  } catch (error) {
    // Delete file if database insert fails
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    next(error);
  }
};

/**
 * Get attachments for task
 * GET /api/tasks/:taskId/attachments
 */
exports.listByTask = async (req, res, next) => {
  try {
    const attachments = await Attachment.findAll({
      where: { task_id: req.params.taskId },
      include: [
        { model: User, as: 'uploader', attributes: ['id', 'username', 'full_name'] }
      ],
      order: [['uploaded_at', 'DESC']]
    });

    res.json(formatResponse(true, 'Attachments retrieved successfully', { attachments }));
  } catch (error) {
    next(error);
  }
};

/**
 * Download attachment
 * GET /api/attachments/:id/download
 */
exports.download = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    
    if (!attachment) {
      return res.status(404).json(formatResponse(false, 'Attachment not found'));
    }

    const filePath = path.resolve(attachment.file_path);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json(formatResponse(false, 'File not found on server'));
    }

    res.download(filePath, attachment.original_name);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete attachment
 * DELETE /api/attachments/:id
 */
exports.delete = async (req, res, next) => {
  try {
    const attachment = await Attachment.findByPk(req.params.id);
    
    if (!attachment) {
      return res.status(404).json(formatResponse(false, 'Attachment not found'));
    }

    // Delete file from filesystem
    const filePath = path.resolve(attachment.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    await attachment.destroy();
    
    res.json(formatResponse(true, 'Attachment deleted successfully'));
  } catch (error) {
    next(error);
  }
};
