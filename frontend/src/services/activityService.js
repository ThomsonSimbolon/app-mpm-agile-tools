/**
 * Activity Service
 * Handles API calls for activity logs/feeds
 */

import api from "./api";

/**
 * Get activities for a project
 */
export const getProjectActivities = async (projectId, params = {}) => {
  const response = await api.get(
    `/activities/projects/${projectId}/activities`,
    { params }
  );
  return response.data;
};

/**
 * Get activities for a user
 */
export const getUserActivities = async (userId, params = {}) => {
  const response = await api.get(`/activities/users/${userId}/activities`, {
    params,
  });
  return response.data;
};

export default {
  getProjectActivities,
  getUserActivities,
};
