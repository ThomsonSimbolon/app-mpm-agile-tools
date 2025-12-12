/**
 * Task Attachments Component
 * Handles file upload and display for task attachments
 */

import { useState, useEffect, useRef } from "react";
import {
  Paperclip,
  Upload,
  Download,
  Trash2,
  File,
  FileText,
  Image,
  FileSpreadsheet,
  Loader2,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import * as attachmentService from "../../services/attachmentService";
import { formatDistanceToNow } from "date-fns";

export default function TaskAttachments({ taskId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadAttachments();
  }, [taskId]);

  const loadAttachments = async () => {
    try {
      setLoading(true);
      const result = await attachmentService.getTaskAttachments(taskId);
      setAttachments(result.data || []);
    } catch (error) {
      console.error("Failed to load attachments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Max 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    try {
      setUploading(true);
      const result = await attachmentService.uploadAttachment(taskId, file);
      if (result.success) {
        setAttachments([...attachments, result.data]);
        toast.success("File uploaded successfully");
      }
    } catch (error) {
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDownload = async (attachment) => {
    try {
      const blob = await attachmentService.downloadAttachment(attachment.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = attachment.original_name || attachment.filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      toast.error("Failed to download file");
    }
  };

  const handleDelete = async (attachmentId) => {
    if (!confirm("Delete this attachment?")) return;

    try {
      await attachmentService.deleteAttachment(attachmentId);
      setAttachments(attachments.filter((a) => a.id !== attachmentId));
      toast.success("Attachment deleted");
    } catch (error) {
      toast.error("Failed to delete attachment");
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename?.split(".").pop()?.toLowerCase();
    if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) {
      return <Image size={16} className="text-green-500" />;
    }
    if (["pdf", "doc", "docx", "txt", "md"].includes(ext)) {
      return <FileText size={16} className="text-blue-500" />;
    }
    if (["xls", "xlsx", "csv"].includes(ext)) {
      return <FileSpreadsheet size={16} className="text-emerald-500" />;
    }
    return <File size={16} className="text-gray-500" />;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Paperclip size={16} />
          Attachments ({attachments.length})
        </h4>
        <label className="cursor-pointer">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            disabled={uploading}
          />
          <span className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors">
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={14} />
                Upload
              </>
            )}
          </span>
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : attachments.length === 0 ? (
        <p className="text-sm text-gray-500 text-center py-4">
          No attachments yet
        </p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {attachments.map((attachment) => (
            <div
              key={attachment.id}
              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg group"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {getFileIcon(attachment.original_name || attachment.filename)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {attachment.original_name || attachment.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(attachment.file_size)} •{" "}
                    {formatDistanceToNow(new Date(attachment.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleDownload(attachment)}
                  className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  title="Download"
                >
                  <Download size={14} />
                </button>
                <button
                  onClick={() => handleDelete(attachment.id)}
                  className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
