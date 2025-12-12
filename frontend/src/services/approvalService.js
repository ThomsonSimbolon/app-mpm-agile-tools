/**
 * =============================================================================
 * APPROVAL SERVICE
 * =============================================================================
 * Frontend service untuk Approval Workflow API
 * =============================================================================
 */

import api from "./api";

/**
 * Get pending approvals for current user (as approver)
 */
export const getMyPendingApprovals = async () => {
  const response = await api.get("/approvals/my-pending");
  return response.data;
};

/**
 * Get all pending approvals
 */
export const getPendingApprovals = async () => {
  const response = await api.get("/approvals/pending");
  return response.data;
};

/**
 * Get approvals for a specific task
 * @param {string|number} taskId
 */
export const getTaskApprovals = async (taskId) => {
  const response = await api.get(`/approvals/task/${taskId}`);
  return response.data;
};

/**
 * Get approval history for current user
 * @param {Object} params - Query parameters (status, type, page, limit)
 */
export const getApprovalHistory = async (params = {}) => {
  const response = await api.get("/approvals/history", { params });
  return response.data;
};

/**
 * Get approval stats for current user
 */
export const getApprovalStats = async () => {
  const response = await api.get("/approvals/stats");
  return response.data;
};

/**
 * Request approval for a task
 * @param {Object} data - Approval request data
 * @param {string|number} data.task_id - Task ID
 * @param {string} [data.approval_type] - Type of approval
 * @param {string|number} [data.approver_id] - Specific approver ID
 * @param {string} [data.message] - Request message
 * @param {string} [data.priority] - Priority (low, normal, high, urgent)
 * @param {string} [data.due_date] - Due date for approval
 */
export const requestApproval = async (data) => {
  const response = await api.post("/approvals/request", data);
  return response.data;
};

/**
 * Approve a request
 * @param {string|number} id - Approval ID
 * @param {Object} data - Approval data (comments)
 */
export const approveRequest = async (id, data = {}) => {
  const response = await api.put(`/approvals/${id}/approve`, data);
  return response.data;
};

/**
 * Reject a request
 * @param {string|number} id - Approval ID
 * @param {Object} data - Rejection data (reason required)
 */
export const rejectRequest = async (id, data) => {
  const response = await api.put(`/approvals/${id}/reject`, data);
  return response.data;
};

/**
 * Cancel a pending approval request
 * @param {string|number} id - Approval ID
 */
export const cancelRequest = async (id) => {
  const response = await api.put(`/approvals/${id}/cancel`);
  return response.data;
};

export default {
  getMyPendingApprovals,
  getPendingApprovals,
  getTaskApprovals,
  getApprovalHistory,
  getApprovalStats,
  requestApproval,
  approveRequest,
  rejectRequest,
  cancelRequest,
};
