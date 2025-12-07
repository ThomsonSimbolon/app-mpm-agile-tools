/**
 * Generate unique project key
 * @param {string} projectName - Project name
 * @returns {string} - Unique key (e.g., "PROJ-ABC")
 */
const generateProjectKey = (projectName) => {
  const prefix = projectName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 4);
  
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${random}`;
};

/**
 * Generate unique task key
 * @param {string} projectKey - Project key
 * @param {number} taskNumber - Task number in project
 * @returns {string} - Task key (e.g., "PROJ-123")
 */
const generateTaskKey = (projectKey, taskNumber) => {
  return `${projectKey}-${taskNumber}`;
};

/**
 * Format response
 * @param {boolean} success - Success status
 * @param {string} message - Response message
 * @param {any} data - Response data
 * @returns {object} - Formatted response
 */
const formatResponse = (success, message, data = null) => {
  return {
    success,
    message,
    ...(data && { data })
  };
};

/**
 * Calculate pagination
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} - Offset and limit
 */
const getPagination = (page = 1, limit = 10) => {
  const offset = (page - 1) * limit;
  return { offset, limit: parseInt(limit) };
};

/**
 * Format pagination response
 * @param {object} data - Data with count and rows
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} - Paginated response
 */
const formatPaginatedResponse = (data, page, limit) => {
  const { count: total, rows: items } = data;
  const currentPage = parseInt(page);
  const totalPages = Math.ceil(total / limit);

  return {
    items,
    pagination: {
      total,
      currentPage,
      totalPages,
      perPage: limit,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    }
  };
};

module.exports = {
  generateProjectKey,
  generateTaskKey,
  formatResponse,
  getPagination,
  formatPaginatedResponse
};
