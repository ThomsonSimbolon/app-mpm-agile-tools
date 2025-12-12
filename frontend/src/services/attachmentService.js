/**
 * Attachment Service
 * Handles API calls for file attachments
 */

import api from "./api";

/**
 * Upload attachment to a task
 */
export const uploadAttachment = async (taskId, file) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/attachments/tasks/${taskId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return response.data;
};

/**
 * Get attachments for a task
 */
export const getTaskAttachments = async (taskId) => {
  const response = await api.get(`/attachments/tasks/${taskId}/attachments`);
  return response.data;
};

/**
 * Download attachment
 */
export const downloadAttachment = async (attachmentId) => {
  const response = await api.get(`/attachments/${attachmentId}/download`, {
    responseType: "blob",
  });
  return response.data;
};

/**
 * Delete attachment
 */
export const deleteAttachment = async (attachmentId) => {
  const response = await api.delete(`/attachments/${attachmentId}`);
  return response.data;
};

export default {
  uploadAttachment,
  getTaskAttachments,
  downloadAttachment,
  deleteAttachment,
};
