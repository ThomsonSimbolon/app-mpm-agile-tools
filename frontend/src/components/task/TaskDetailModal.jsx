import { useState, useEffect } from "react";
import { taskService } from "../../services/taskService";
import { commentService } from "../../services/commentService";
import Modal from "../common/Modal";
import Button from "../common/Button";
import Input from "../common/Input";
import {
  UserCircle,
  Calendar,
  Clock,
  MessageSquare,
  Paperclip,
  Tag,
  Send,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";
import { AiButton, AiChatPanelStream, AiSuggestionPanel } from "../ai";
import TaskAttachments from "./TaskAttachments";
import TaskLabels from "./TaskLabels";
import TaskTimeLogs from "./TaskTimeLogs";
import TaskActivityFeed from "./TaskActivityFeed";

export default function TaskDetailModal({ taskId, isOpen, onClose, onUpdate }) {
  const [task, setTask] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showAiChat, setShowAiChat] = useState(false);
  const [showAiSuggestions, setShowAiSuggestions] = useState(false);

  useEffect(() => {
    if (isOpen && taskId) {
      loadTaskDetails();
    }
  }, [isOpen, taskId]);

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskResult, commentsResult] = await Promise.all([
        taskService.getById(taskId),
        commentService.getByTask(taskId),
      ]);

      if (taskResult.success) {
        setTask(taskResult.data.task);
      }
      if (commentsResult.success) {
        setComments(commentsResult.data.comments || []);
      }
    } catch (error) {
      toast.error("Failed to load task details");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      setSubmitting(true);
      const result = await commentService.create(taskId, newComment);
      if (result.success) {
        setComments([...comments, result.data.comment]);
        setNewComment("");
        toast.success("Comment added");
      }
    } catch (error) {
      toast.error("Failed to add comment");
    } finally {
      setSubmitting(false);
    }
  };

  const priorityColors = {
    low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    medium: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    critical: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  };

  const statusColors = {
    backlog: "bg-gray-100 text-gray-800",
    todo: "bg-blue-100 text-blue-800",
    in_progress: "bg-yellow-100 text-yellow-800",
    in_review: "bg-purple-100 text-purple-800",
    done: "bg-green-100 text-green-800",
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Loading..." size="lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </Modal>
    );
  }

  if (!task) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={task.task_key} size="lg">
      <div className="space-y-6">
        {/* Task Header */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {task.title}
            </h3>
            {/* AI Buttons */}
            <div className="flex gap-2 flex-shrink-0">
              <AiButton
                onClick={() => setShowAiChat(!showAiChat)}
                variant={showAiChat ? "primary" : "secondary"}
                size="sm"
                title="Chat dengan AI"
              >
                Chat
              </AiButton>
              <AiButton
                onClick={() => setShowAiSuggestions(!showAiSuggestions)}
                variant={showAiSuggestions ? "primary" : "secondary"}
                size="sm"
                title="Dapatkan saran AI"
              >
                Saran
              </AiButton>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                statusColors[task.status]
              }`}
            >
              {task.status.replace("_", " ")}
            </span>
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                priorityColors[task.priority]
              }`}
            >
              {task.priority} priority
            </span>
            {task.story_points && (
              <span className="px-3 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full">
                {task.story_points} points
              </span>
            )}
          </div>
        </div>

        {/* Task Details */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UserCircle size={16} />
            <span>Assignee:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {task.assignee?.full_name || "Unassigned"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <UserCircle size={16} />
            <span>Reporter:</span>
            <span className="font-medium text-gray-900 dark:text-white">
              {task.creator?.full_name}
            </span>
          </div>
          {task.due_date && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar size={16} />
              <span>Due:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {new Date(task.due_date).toLocaleDateString()}
              </span>
            </div>
          )}
          {task.sprint && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Clock size={16} />
              <span>Sprint:</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {task.sprint.name}
              </span>
            </div>
          )}
        </div>

        {/* Description */}
        {task.description && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Description
            </h4>
            <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
              {task.description}
            </p>
          </div>
        )}

        {/* Labels */}
        {task.project && (
          <div>
            <TaskLabels
              taskId={taskId}
              projectId={task.project.id}
              currentLabels={task.labels || []}
              onUpdate={(labels) => setTask({ ...task, labels })}
            />
          </div>
        )}

        {/* Attachments Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <TaskAttachments taskId={taskId} />
        </div>

        {/* Time Tracking Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <TaskTimeLogs taskId={taskId} onUpdate={loadTaskDetails} />
        </div>

        {/* Activity Feed Section */}
        {task.project && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <TaskActivityFeed taskId={taskId} projectId={task.project.id} />
          </div>
        )}

        {/* Comments Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <MessageSquare size={18} />
            Comments ({comments.length})
          </h4>

          {/* Comments List */}
          <div className="space-y-4 mb-4 max-h-64 overflow-y-auto scrollbar-custom">
            {comments.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                No comments yet. Be the first to comment!
              </p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <UserCircle
                        size={16}
                        className="text-gray-600 dark:text-gray-400"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {comment.user?.full_name}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDistanceToNow(new Date(comment.created_at), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm">
                    {comment.content}
                  </p>
                </div>
              ))
            )}
          </div>

          {/* Add Comment Form */}
          <form onSubmit={handleAddComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Button
              type="submit"
              variant="primary"
              disabled={!newComment.trim() || submitting}
              loading={submitting}
              className="flex items-center gap-2"
            >
              <Send size={16} />
              <span>Send</span>
            </Button>
          </form>
        </div>

        {/* AI Chat Panel - Streaming */}
        {showAiChat && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="h-96">
              <AiChatPanelStream
                taskId={taskId}
                taskTitle={task.title}
                taskDescription={task.description}
                onClose={() => setShowAiChat(false)}
              />
            </div>
          </div>
        )}

        {/* AI Suggestions Panel */}
        {showAiSuggestions && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <AiSuggestionPanel
              taskTitle={task.title}
              taskDescription={task.description}
              projectContext={task.project?.description}
              onApplyDescription={(description) => {
                // TODO: Update task description via API
                toast.success("Deskripsi akan diaplikasikan");
              }}
              onApplyStoryPoints={(points) => {
                // TODO: Update story points via API
                toast.success(`Story points ${points} akan diaplikasikan`);
              }}
              onClose={() => setShowAiSuggestions(false)}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
