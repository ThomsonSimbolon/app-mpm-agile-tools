import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({ column, tasks }) {
  const { setNodeRef } = useDroppable({ id: column.id });

  const colorClasses = {
    gray: 'bg-gray-100 dark:bg-gray-800 border-gray-300',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-300',
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-300',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-300',
    green: 'bg-green-50 dark:bg-green-900/20 border-green-300'
  };

  return (
    <div className="flex-shrink-0 w-80">
      <div className={`${colorClasses[column.color]} border-2 rounded-lg p-4 h-full`}>
        {/* Column Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {column.title}
          </h3>
          <span className="text-sm font-medium px-2 py-1 bg-white dark:bg-gray-700 rounded-full">
            {tasks.length}
          </span>
        </div>

        {/* Droppable Area */}
        <div ref={setNodeRef} className="space-y-3 min-h-[400px]">
          <SortableContext
            items={tasks.map(t => t.id.toString())}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map(task => (
              <KanbanCard key={task.id} task={task} />
            ))}
          </SortableContext>
          
          {tasks.length === 0 && (
            <div className="text-center py-8 text-gray-400 text-sm">
              Drop tasks here
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
