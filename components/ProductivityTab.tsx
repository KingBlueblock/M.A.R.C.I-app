import React, { useState } from 'react';
import { Task, Note } from '../types';
import TasksTab from './TasksTab';
import NotesTab from './NotesTab';
import { IconTasks, IconNotes } from './Icons';

interface ProductivityTabProps {
    tasks: Task[];
    onAddTask: (text: string) => void;
    onToggleTask: (id: number) => void;
    onDeleteTask: (id: number) => void;
    notes: Note[];
    onAddNote: (title: string, content: string) => void;
    onDeleteNote: (id: number) => void;
}

const ProductivityTab: React.FC<ProductivityTabProps> = (props) => {
    const [activeTool, setActiveTool] = useState<'tasks' | 'notes'>('tasks');
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h2 className="text-2xl font-orbitron text-[--accent-300]">Productivity Suite</h2>
                <div className="flex border border-gray-300 dark:border-white/20 rounded-lg p-0.5">
                    <button 
                        onClick={() => setActiveTool('tasks')} 
                        className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeTool === 'tasks' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <IconTasks /> Tasks
                    </button>
                    <button 
                        onClick={() => setActiveTool('notes')} 
                        className={`flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-md transition-colors ${activeTool === 'notes' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                       <IconNotes /> Notes
                    </button>
                </div>
            </div>

            <div className="flex-grow">
                {activeTool === 'tasks' ? (
                    <TasksTab 
                        tasks={props.tasks} 
                        onAdd={props.onAddTask} 
                        onToggle={props.onToggleTask} 
                        onDelete={props.onDeleteTask} 
                    />
                ) : (
                    <NotesTab 
                        notes={props.notes}
                        onAdd={props.onAddNote}
                        onDelete={props.onDeleteNote}
                    />
                )}
            </div>
        </div>
    );
};

export default ProductivityTab;