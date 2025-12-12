/**
 * Time Log Service
 * Handles API calls for time tracking
 */

import api from "./api";

/**
 * Log time for a task
 */
export const createTimeLog = async (taskId, timeLogData) => {
  const response = await api.post(
    `/time-logs/tasks/${taskId}/time-logs`,
    timeLogData
  );
  return response.data;
};

/**
 * Get time logs for a task
 */
export const getTaskTimeLogs = async (taskId) => {
  const response = await api.get(`/time-logs/tasks/${taskId}/time-logs`);
  return response.data;
};

/**
 * Get time logs for a user
 */
export const getUserTimeLogs = async (userId) => {
  const response = await api.get(`/time-logs/users/${userId}/time-logs`);
  return response.data;
};

/**
 * Update time log
 */
export const updateTimeLog = async (timeLogId, timeLogData) => {
  const response = await api.put(`/time-logs/${timeLogId}`, timeLogData);
  return response.data;
};

/**
 * Delete time log
 */
export const deleteTimeLog = async (timeLogId) => {
  const response = await api.delete(`/time-logs/${timeLogId}`);
  return response.data;
};

export default {
  createTimeLog,
  getTaskTimeLogs,
  getUserTimeLogs,
  updateTimeLog,
  deleteTimeLog,
};
