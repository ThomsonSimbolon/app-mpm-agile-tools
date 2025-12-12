/**
 * Calendar Service
 * Handles API calls for calendar, milestones, and Gantt chart
 */

import api from "./api";

// ============================================================================
// CALENDAR EVENTS
// ============================================================================

/**
 * Get calendar events with filters
 */
export const getCalendarEvents = async (params = {}) => {
  const response = await api.get("/calendar/events", { params });
  return response.data;
};

/**
 * Get single calendar event
 */
export const getCalendarEvent = async (id) => {
  const response = await api.get(`/calendar/events/${id}`);
  return response.data;
};

/**
 * Create calendar event
 */
export const createCalendarEvent = async (eventData) => {
  const response = await api.post("/calendar/events", eventData);
  return response.data;
};

/**
 * Update calendar event
 */
export const updateCalendarEvent = async (id, eventData) => {
  const response = await api.put(`/calendar/events/${id}`, eventData);
  return response.data;
};

/**
 * Delete calendar event
 */
export const deleteCalendarEvent = async (id) => {
  const response = await api.delete(`/calendar/events/${id}`);
  return response.data;
};

/**
 * Get upcoming events for dashboard
 */
export const getUpcomingEvents = async (limit = 5) => {
  const response = await api.get("/calendar/events/upcoming", {
    params: { limit },
  });
  return response.data;
};

// ============================================================================
// PROJECT MILESTONES
// ============================================================================

/**
 * Get milestones for a project
 */
export const getProjectMilestones = async (projectId) => {
  const response = await api.get(`/milestones/project/${projectId}`);
  return response.data;
};

/**
 * Get single milestone
 */
export const getMilestone = async (id) => {
  const response = await api.get(`/milestones/${id}`);
  return response.data;
};

/**
 * Create milestone
 */
export const createMilestone = async (milestoneData) => {
  const { project_id, ...data } = milestoneData;
  const response = await api.post(`/milestones/project/${project_id}`, data);
  return response.data;
};

/**
 * Update milestone
 */
export const updateMilestone = async (id, milestoneData) => {
  const response = await api.put(`/milestones/${id}`, milestoneData);
  return response.data;
};

/**
 * Delete milestone
 */
export const deleteMilestone = async (id) => {
  const response = await api.delete(`/milestones/${id}`);
  return response.data;
};

/**
 * Complete milestone
 */
export const completeMilestone = async (id) => {
  const response = await api.patch(`/milestones/${id}/complete`);
  return response.data;
};

// ============================================================================
// GANTT CHART / TASK DEPENDENCIES
// ============================================================================

/**
 * Get Gantt chart data for a project
 */
export const getGanttData = async (projectId) => {
  const response = await api.get(`/gantt/project/${projectId}`);
  return response.data;
};

/**
 * Get task dependencies for a project
 */
export const getTaskDependencies = async (projectId) => {
  const response = await api.get(`/gantt/project/${projectId}/dependencies`);
  return response.data;
};

/**
 * Create task dependency
 */
export const createTaskDependency = async (dependencyData) => {
  const response = await api.post("/gantt/dependencies", dependencyData);
  return response.data;
};

/**
 * Delete task dependency
 */
export const deleteTaskDependency = async (id) => {
  const response = await api.delete(`/gantt/dependencies/${id}`);
  return response.data;
};

/**
 * Update task dates (for drag and drop in Gantt)
 */
export const updateTaskDates = async (taskId, dates) => {
  const response = await api.patch(`/gantt/tasks/${taskId}/dates`, dates);
  return response.data;
};

/**
 * Update task progress
 */
export const updateTaskProgress = async (taskId, progress) => {
  const response = await api.patch(`/gantt/tasks/${taskId}/progress`, {
    progress_percentage: progress,
  });
  return response.data;
};

/**
 * Get critical path for a project
 */
export const getCriticalPath = async (projectId) => {
  const response = await api.get(`/gantt/project/${projectId}/critical-path`);
  return response.data;
};

export default {
  // Calendar Events
  getCalendarEvents,
  getCalendarEvent,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
  getUpcomingEvents,
  // Milestones
  getProjectMilestones,
  getMilestone,
  createMilestone,
  updateMilestone,
  deleteMilestone,
  completeMilestone,
  // Gantt
  getGanttData,
  getTaskDependencies,
  createTaskDependency,
  deleteTaskDependency,
  updateTaskDates,
  updateTaskProgress,
  getCriticalPath,
};
