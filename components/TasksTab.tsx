import React, { useState } from 'react';
import { Task } from '../types';

interface TasksTabProps {
  tasks: Task[];
  onToggle: (id: number) => void;
  onAdd: (text: string) => void;
  onDelete: (id: number) => void;
}

const TasksTab: React.FC<TasksTabProps> = ({ tasks, onToggle, onAdd, onDelete }) => {
  const [newTaskText, setNewTaskText] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim()) {
      onAdd(newTaskText.trim());
      setNewTaskText('');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <form onSubmit={handleAddTask} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTaskText}
          onChange={(e) => setNewTaskText(e.target.value)}
          placeholder="Add a new task..."
          className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
        />
        <button type="submit" className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>
          Add
        </button>
      </form>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3">
        {tasks.length > 0 ? (
          tasks.map((task, index) => (
            <div 
              key={task.id} 
              className="flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors group animate-list-item-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={task.completed}
                  onChange={() => onToggle(task.id)}
                  className="form-checkbox h-5 w-5 bg-transparent border-gray-400 dark:border-[--accent-400] text-[--accent-500] rounded focus:ring-[--accent-500]"
                />
                <span className={`${task.completed ? 'line-through text-gray-500' : ''}`}>
                  {task.text}
                </span>
              </div>
              <button
                onClick={() => onDelete(task.id)}
                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No tasks yet. Add one to get started!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TasksTab;