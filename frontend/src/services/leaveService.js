/**
 * =============================================================================
 * LEAVE SERVICE
 * =============================================================================
 * Frontend service untuk Leave Management dan Task Delegation API
 * =============================================================================
 */

import api from "./api";

// =============================================================================
// LEAVE MANAGEMENT
// =============================================================================

/**
 * Get current user's leave requests
 * @param {Object} params - Query parameters (status, year)
 */
export const getMyLeaves = async (params = {}) => {
  const response = await api.get("/leaves/my", { params });
  return response.data;
};

/**
 * Get all leave requests (admin view)
 * @param {Object} params - Query parameters (status, user_id, page, limit)
 */
export const getAllLeaves = async (params = {}) => {
  const response = await api.get("/leaves", { params });
  return response.data;
};

/**
 * Get pending leave requests for approval
 */
export const getPendingLeaves = async () => {
  const response = await api.get("/leaves/pending");
  return response.data;
};

/**
 * Create a new leave request
 * @param {Object} data - Leave request data
 * @param {string} data.leave_type - Type of leave (annual, sick, personal, wfh, training, other)
 * @param {string} data.start_date - Start date (YYYY-MM-DD)
 * @param {string} data.end_date - End date (YYYY-MM-DD)
 * @param {string|number} [data.delegate_id] - Delegate user ID
 * @param {string} [data.reason] - Reason for leave
 * @param {boolean} [data.auto_delegate_tasks] - Auto delegate tasks
 * @param {boolean} [data.return_tasks_after] - Return tasks after leave
 */
export const createLeave = async (data) => {
  const response = await api.post("/leaves", data);
  return response.data;
};

/**
 * Update a pending leave request
 * @param {string|number} id - Leave ID
 * @param {Object} data - Updated leave data
 */
export const updateLeave = async (id, data) => {
  const response = await api.put(`/leaves/${id}`, data);
  return response.data;
};

/**
 * Cancel a leave request
 * @param {string|number} id - Leave ID
 */
export const cancelLeave = async (id) => {
  const response = await api.delete(`/leaves/${id}`);
  return response.data;
};

/**
 * Approve a leave request
 * @param {string|number} id - Leave ID
 * @param {Object} [data] - Approval data (notes)
 */
export const approveLeave = async (id, data = {}) => {
  const response = await api.post(`/leaves/${id}/approve`, data);
  return response.data;
};

/**
 * Reject a leave request
 * @param {string|number} id - Leave ID
 * @param {Object} data - Rejection data (reason required)
 */
export const rejectLeave = async (id, data) => {
  const response = await api.post(`/leaves/${id}/reject`, data);
  return response.data;
};

/**
 * Activate a leave (start delegation) - Admin only
 * @param {string|number} id - Leave ID
 */
export const activateLeave = async (id) => {
  const response = await api.post(`/leaves/${id}/activate`);
  return response.data;
};

/**
 * Complete a leave (end delegation) - Admin only
 * @param {string|number} id - Leave ID
 */
export const completeLeave = async (id) => {
  const response = await api.post(`/leaves/${id}/complete`);
  return response.data;
};

// =============================================================================
// DELEGATION MANAGEMENT
// =============================================================================

/**
 * Get current user's task delegations
 * @param {string} [type] - 'received' | 'given' | null (all)
 */
export const getMyDelegations = async (type = null) => {
  const params = type ? { type } : {};
  const response = await api.get("/leaves/delegations/my", { params });
  return response.data;
};

/**
 * Check if a user is currently on leave
 * @param {string|number} userId - User ID
 */
export const getUserLeaveStatus = async (userId) => {
  const response = await api.get(`/leaves/users/${userId}/leave-status`);
  return response.data;
};

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Get leave type display name
 * @param {string} type - Leave type
 */
export const getLeaveTypeLabel = (type) => {
  const types = {
    annual: "Annual Leave",
    sick: "Sick Leave",
    personal: "Personal Leave",
    wfh: "Work From Home",
    training: "Training",
    other: "Other",
  };
  return types[type] || type;
};

/**
 * Get leave status display info
 * @param {string} status - Leave status
 */
export const getLeaveStatusInfo = (status) => {
  const statuses = {
    pending: { label: "Pending", color: "yellow" },
    approved: { label: "Approved", color: "green" },
    rejected: { label: "Rejected", color: "red" },
    cancelled: { label: "Cancelled", color: "gray" },
    active: { label: "Active", color: "blue" },
    completed: { label: "Completed", color: "gray" },
  };
  return statuses[status] || { label: status, color: "gray" };
};

export default {
  // Leave
  getMyLeaves,
  getAllLeaves,
  getPendingLeaves,
  createLeave,
  updateLeave,
  cancelLeave,
  approveLeave,
  rejectLeave,
  activateLeave,
  completeLeave,
  // Delegation
  getMyDelegations,
  getUserLeaveStatus,
  // Helpers
  getLeaveTypeLabel,
  getLeaveStatusInfo,
};
