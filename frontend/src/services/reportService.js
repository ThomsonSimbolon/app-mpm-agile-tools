/**
 * Report Service
 *
 * Service untuk berkomunikasi dengan Report API endpoints
 */

import api from "./api";

const REPORT_BASE_URL = "/reports";

/**
 * Get project summary statistics
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Project summary data
 */
export const getProjectSummary = async (projectId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/summary`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting project summary:", error);
    throw error;
  }
};

/**
 * Get burndown chart data
 * @param {Object} params - Parameters
 * @param {number} [params.projectId] - Project ID (for active sprint)
 * @param {number} [params.sprintId] - Sprint ID (for specific sprint)
 * @returns {Promise<Object>} Burndown chart data
 */
export const getBurndownData = async ({ projectId, sprintId }) => {
  try {
    let url;
    if (sprintId) {
      url = `${REPORT_BASE_URL}/sprints/${sprintId}/burndown`;
    } else if (projectId) {
      url = `${REPORT_BASE_URL}/projects/${projectId}/burndown`;
    } else {
      throw new Error("Either projectId or sprintId is required");
    }

    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error("Error getting burndown data:", error);
    throw error;
  }
};

/**
 * Get velocity chart data
 * @param {number} projectId - Project ID
 * @param {number} [limit=10] - Number of sprints to include
 * @returns {Promise<Object>} Velocity chart data
 */
export const getVelocityData = async (projectId, limit = 10) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/velocity`,
      { params: { limit } }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting velocity data:", error);
    throw error;
  }
};

/**
 * Get workload distribution
 * @param {number} projectId - Project ID
 * @returns {Promise<Object>} Workload distribution data
 */
export const getWorkloadDistribution = async (projectId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/workload`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting workload distribution:", error);
    throw error;
  }
};

/**
 * Get activity timeline
 * @param {number} projectId - Project ID
 * @param {Object} [options] - Options
 * @param {string} [options.startDate] - Start date filter
 * @param {string} [options.endDate] - End date filter
 * @param {number} [options.limit=50] - Limit results
 * @returns {Promise<Object>} Activity timeline data
 */
export const getActivityTimeline = async (projectId, options = {}) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/activity`,
      { params: options }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting activity timeline:", error);
    throw error;
  }
};

/**
 * Get time tracking report
 * @param {number} projectId - Project ID
 * @param {Object} [options] - Options
 * @param {string} [options.startDate] - Start date filter
 * @param {string} [options.endDate] - End date filter
 * @returns {Promise<Object>} Time tracking report data
 */
export const getTimeTrackingReport = async (projectId, options = {}) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/time-tracking`,
      { params: options }
    );
    return response.data;
  } catch (error) {
    console.error("Error getting time tracking report:", error);
    throw error;
  }
};

/**
 * Get sprint report
 * @param {number} sprintId - Sprint ID
 * @returns {Promise<Object>} Sprint report data
 */
export const getSprintReport = async (sprintId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/sprints/${sprintId}/report`
    );
    return response.data;
  } catch (error) {
    console.error("Error getting sprint report:", error);
    throw error;
  }
};

/**
 * Export project report to PDF
 * @param {number} projectId - Project ID
 */
export const exportProjectPDF = async (projectId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/export/pdf`,
      { responseType: "blob" }
    );

    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Project_Report_${projectId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting project PDF:", error);
    throw error;
  }
};

/**
 * Export project report to Excel
 * @param {number} projectId - Project ID
 */
export const exportProjectExcel = async (projectId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/projects/${projectId}/export/excel`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Project_Report_${projectId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting project Excel:", error);
    throw error;
  }
};

/**
 * Export sprint report to PDF
 * @param {number} sprintId - Sprint ID
 */
export const exportSprintPDF = async (sprintId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/sprints/${sprintId}/export/pdf`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sprint_Report_${sprintId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting sprint PDF:", error);
    throw error;
  }
};

/**
 * Export sprint report to Excel
 * @param {number} sprintId - Sprint ID
 */
export const exportSprintExcel = async (sprintId) => {
  try {
    const response = await api.get(
      `${REPORT_BASE_URL}/sprints/${sprintId}/export/excel`,
      { responseType: "blob" }
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `Sprint_Report_${sprintId}.xlsx`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error exporting sprint Excel:", error);
    throw error;
  }
};

export default {
  getProjectSummary,
  getBurndownData,
  getVelocityData,
  getWorkloadDistribution,
  getActivityTimeline,
  getTimeTrackingReport,
  getSprintReport,
  exportProjectPDF,
  exportProjectExcel,
  exportSprintPDF,
  exportSprintExcel,
};
