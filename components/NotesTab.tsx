import React, { useState } from 'react';
import { Note } from '../types';

interface NotesTabProps {
    notes: Note[];
    onAdd: (title: string, content: string) => void;
    onDelete: (id: number) => void;
}

const NotesTab: React.FC<NotesTabProps> = ({ notes, onAdd, onDelete }) => {
    const [isCreating, setIsCreating] = useState(false);
    const [newNoteTitle, setNewNoteTitle] = useState('');
    const [newNoteContent, setNewNoteContent] = useState('');
    const [selectedNote, setSelectedNote] = useState<Note | null>(null);

    const handleSaveNote = () => {
        if (newNoteTitle.trim() && newNoteContent.trim()) {
            onAdd(newNoteTitle.trim(), newNoteContent.trim());
            setNewNoteTitle('');
            setNewNoteContent('');
            setIsCreating(false);
        }
    };

    if (selectedNote) {
        return (
            <div>
                <button onClick={() => setSelectedNote(null)} className="mb-4 text-[--accent-400] hover:text-[--accent-300]">&larr; Back to notes</button>
                <h2 className="text-2xl font-orbitron text-[--accent-300] mb-2">{selectedNote.title}</h2>
                <p className="whitespace-pre-wrap text-gray-600 dark:text-gray-300">{selectedNote.content}</p>
            </div>
        )
    }

    if (isCreating) {
        return (
            <div className="animate-fade-in">
                 <h2 className="text-2xl font-orbitron text-[--accent-300] mb-4">New Note</h2>
                 <input
                    type="text"
                    value={newNoteTitle}
                    onChange={(e) => setNewNoteTitle(e.target.value)}
                    placeholder="Note title..."
                    className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 mb-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                 />
                 <textarea
                    value={newNoteContent}
                    onChange={(e) => setNewNoteContent(e.target.value)}
                    placeholder="Your thoughts..."
                    rows={8}
                    className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                 />
                 <div className="flex gap-2">
                    <button onClick={handleSaveNote} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>Save</button>
                    <button onClick={() => setIsCreating(false)} className="bg-black/10 dark:bg-white/10 text-slate-800 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">Cancel</button>
                 </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center mb-4">
                 <h3 className="text-xl font-bold text-slate-800 dark:text-white">Your Notes</h3>
                <button onClick={() => setIsCreating(true)} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>+ New</button>
            </div>
            <div className="flex-grow overflow-y-auto pr-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {notes.length > 0 ? (
                    notes.map((note, index) => (
                        <div 
                            key={note.id} 
                            className="bg-black/5 dark:bg-white/5 p-4 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 transition-colors group cursor-pointer relative animate-list-item-in" 
                            onClick={() => setSelectedNote(note)}
                            style={{ animationDelay: `${index * 75}ms` }}
                        >
                            <h3 className="font-bold text-lg text-[--accent-400] truncate">{note.title}</h3>
                            <p className="text-gray-500 dark:text-gray-400 mt-1 h-20 overflow-hidden text-ellipsis">{note.content}</p>
                            <button onClick={(e) => { e.stopPropagation(); onDelete(note.id); }} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                            </button>
                        </div>
                    ))
                ) : (
                    <div className="text-center text-gray-500 py-8 col-span-full">
                        <p>Your journal is empty. Create a new note!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default NotesTab;