const { ActivityLog } = require('../models');

/**
 * Middleware to automatically log activities
 * Use this after auth middleware to capture user actions
 */
const activityLogger = (action, entityType) => {
  return async (req, res, next) => {
    // Store original json method
    const originalJson = res.json;

    // Override json method to capture response
    res.json = function(data) {
      // Only log on successful operations
      if (data.success && req.user) {
        const logData = {
          user_id: req.user.id,
          action: action,
          entity_type: entityType,
          entity_id: data.data?.id || req.params.id || null,
          old_value: req.body._oldValue || null,
          new_value: req.body._newValue || null,
          project_id: req.params.projectId || data.data?.project_id || null,
          task_id: req.params.taskId || data.data?.task_id || null
        };

        // Log asynchronously without blocking response
        ActivityLog.create(logData).catch(err => {
          console.error('Activity log error:', err);
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

module.exports = activityLogger;
