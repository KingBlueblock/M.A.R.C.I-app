import React from 'react';
import { ChatSession } from '../types';

interface HistoryTabProps {
  sessions: ChatSession[];
  currentChatId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ sessions, currentChatId, onSelect, onDelete, onNew }) => {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };
  
  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-orbitron text-[--accent-300]">Chat History</h2>
        <button onClick={onNew} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>
          + New Chat
        </button>
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3">
        {sessions.length > 0 ? (
          sessions.map((session, index) => (
            <div 
              key={session.id} 
              onClick={() => onSelect(session.id)}
              className={`flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-lg transition-all duration-200 group cursor-pointer animate-list-item-in ${currentChatId === session.id ? 'border-l-4 border-[--accent-400] bg-black/10 dark:bg-white/10' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex-grow overflow-hidden">
                <h3 className="font-semibold truncate text-slate-800 dark:text-white">{session.title}</h3>
                <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 gap-4">
                    <span>{formatDate(session.createdAt)}</span>
                    <span className="px-2 py-0.5 bg-[--accent-500]/20 text-[--accent-300] rounded">{session.category}</span>
                </div>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(session.id); }}
                className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-4 flex-shrink-0"
                aria-label="Delete chat"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>No chat history yet. Start a new conversation!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;
