import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import { taskService } from '../../services/taskService';
import KanbanColumn from './KanbanColumn';
import KanbanCard from './KanbanCard';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'backlog', title: 'Backlog', color: 'gray' },
  { id: 'todo', title: 'To Do', color: 'blue' },
  { id: 'in_progress', title: 'In Progress', color: 'yellow' },
  { id: 'in_review', title: 'In Review', color: 'purple' },
  { id: 'done', title: 'Done', color: 'green' }
];

export default function KanbanBoard({ projectId }) {
  const [tasks, setTasks] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [loading, setLoading] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8
      }
    })
  );

  useEffect(() => {
    loadTasks();
  }, [projectId]);

  const loadTasks = async () => {
    try {
      const result = await taskService.getByProject(projectId);
      if (result.success) {
        setTasks(result.data.items || []);
      }
    } catch (error) {
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      return;
    }

    const activeTask = tasks.find(t => t.id === parseInt(active.id));
    const overColumn = over.id;

    if (activeTask && activeTask.status !== overColumn) {
      // Optimistic update
      setTasks(prev =>
        prev.map(task =>
          task.id === parseInt(active.id) ? { ...task, status: overColumn } : task
        )
      );

      // API call
      try {
        await taskService.updateStatus(active.id, overColumn);
        toast.success('Task moved successfully');
      } catch (error) {
        toast.error('Failed to move task');
        // Revert on error
        loadTasks();
      }
    }

    setActiveId(null);
  };

  const getTasksByStatus = (status) => {
    return tasks.filter(task => task.status === status);
  };

  const activeTask = activeId ? tasks.find(t => t.id === parseInt(activeId)) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 min-h-[600px]">
        {COLUMNS.map(column => (
          <KanbanColumn
            key={column.id}
            column={column}
            tasks={getTasksByStatus(column.id)}
          />
        ))}
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="opacity-50">
            <KanbanCard task={activeTask} isDragging />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
