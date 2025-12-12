/**
 * Label Service
 * Handles API calls for project/task labels
 */

import api from "./api";

/**
 * Get labels for a project
 */
export const getProjectLabels = async (projectId) => {
  const response = await api.get(`/labels/projects/${projectId}/labels`);
  return response.data;
};

/**
 * Create label for a project
 */
export const createLabel = async (projectId, labelData) => {
  const response = await api.post(
    `/labels/projects/${projectId}/labels`,
    labelData
  );
  return response.data;
};

/**
 * Update label
 */
export const updateLabel = async (labelId, labelData) => {
  const response = await api.put(`/labels/${labelId}`, labelData);
  return response.data;
};

/**
 * Delete label
 */
export const deleteLabel = async (labelId) => {
  const response = await api.delete(`/labels/${labelId}`);
  return response.data;
};

/**
 * Add label to task
 */
export const addLabelToTask = async (taskId, labelId) => {
  const response = await api.post(`/labels/tasks/${taskId}/labels/${labelId}`);
  return response.data;
};

/**
 * Remove label from task
 */
export const removeLabelFromTask = async (taskId, labelId) => {
  const response = await api.delete(
    `/labels/tasks/${taskId}/labels/${labelId}`
  );
  return response.data;
};

export default {
  getProjectLabels,
  createLabel,
  updateLabel,
  deleteLabel,
  addLabelToTask,
  removeLabelFromTask,
};
