import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { UserCircle, Calendar, Clock } from 'lucide-react';
import TaskDetailModal from '../task/TaskDetailModal';

export default function KanbanCard({ task, isDragging = false }) {
  const [showDetail, setShowDetail] = useState(false);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging
  } = useSortable({ id: task.id.toString() });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging || isDragging ? 0.5 : 1
  };

  const priorityColors = {
    low: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    critical: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
  };

  const handleClick = (e) => {
    // Don't open modal if dragging
    if (!isSortableDragging) {
      setShowDetail(true);
    }
  };

  return (
    <>
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        onClick={handleClick}
        className="bg-white dark:bg-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer border border-gray-200 dark:border-gray-600 transition-shadow"
      >
        {/* Task Key */}
        <div className="flex items-start justify-between mb-2">
          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">
            {task.task_key}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[task.priority]}`}>
            {task.priority}
          </span>
        </div>

        {/* Task Title */}
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2 line-clamp-2">
          {task.title}
        </h4>

        {/* Task Description */}
        {task.description && (
          <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">
            {task.description}
          </p>
        )}

        {/* Task Meta Info */}
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center gap-1">
            <UserCircle size={14} />
            <span className="truncate max-w-[100px]">
              {task.assignee?.username || 'Unassigned'}
            </span>
          </div>
          
          {task.story_points && (
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{task.story_points} pts</span>
            </div>
          )}
          
          {task.due_date && (
            <div className="flex items-center gap-1">
              <Calendar size={14} />
              <span>{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Task Detail Modal */}
      <TaskDetailModal
        taskId={task.id}
        isOpen={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}
