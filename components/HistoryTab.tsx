import React, { useState, useMemo } from 'react';
import JSZip from 'jszip';
import { HistoryItem, HistoryItemType, ChatSession, ChatHistoryItem } from '../types';
import { IconHome, IconImage, IconMusic, IconStudy, IconMinecraft, IconHistory, IconStar } from './Icons';

interface HistoryTabProps {
  items: HistoryItem[];
  chatSessions: Record<string, ChatSession>;
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onToggleFavorite: (id: string) => void;
}

const HistoryIcon: React.FC<{ type: HistoryItemType }> = ({ type }) => {
  switch (type) {
    case HistoryItemType.Chat:
      return <IconHome />;
    case HistoryItemType.Image:
      return <IconImage />;
    case HistoryItemType.MusicLyrics:
      return <IconMusic />;
    case HistoryItemType.StudyNotes:
      return <IconStudy />;
    case HistoryItemType.MinecraftAddon:
      return <IconMinecraft />;
    default:
      return <IconHistory />;
  }
};

const HistoryDetailModal: React.FC<{ item: HistoryItem, onClose: () => void }> = ({ item, onClose }) => {

    const handleDownload = (files: Record<string, string>, name: string) => {
        const zip = new JSZip();
        for (const path in files) {
            zip.file(path, files[path]);
        }
        zip.generateAsync({ type: 'blob' }).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${name.trim().toLowerCase().replace(/\s+/g, '_')}.mcaddon`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };

    const renderContent = () => {
        switch (item.type) {
            case HistoryItemType.Image:
                return <img src={item.content.imageUrl} alt={item.prompt} className="max-w-full max-h-[70vh] object-contain rounded-lg" />;
            case HistoryItemType.MusicLyrics:
                return <pre className="whitespace-pre-wrap font-sans text-gray-300">{item.content.lyrics}</pre>;
            case HistoryItemType.StudyNotes:
                return <div className="prose prose-invert" dangerouslySetInnerHTML={{ __html: item.content.notes.replace(/\n/g, '<br/>') }} />;
            case HistoryItemType.MinecraftAddon:
                return (
                    <div>
                        <p className="mb-2 text-gray-400">Addon based on prompt: "{item.prompt}"</p>
                        <ul className="list-disc list-inside text-sm font-mono mb-4">
                            {Object.keys(item.content.files).map(path => <li key={path}>{path}</li>)}
                        </ul>
                        <button onClick={() => handleDownload(item.content.files, item.title)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-500">
                            Download .mcaddon
                        </button>
                    </div>
                );
            default:
                return <p>Cannot display this item type.</p>;
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="bg-slate-800 border border-white/10 rounded-lg p-6 max-w-2xl w-full text-left" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-xl font-orbitron text-[--accent-300]">{item.title}</h2>
                        <p className="text-xs text-gray-500">{new Date(item.createdAt).toLocaleString()}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                <div className="max-h-[75vh] overflow-y-auto pr-4">
                    {renderContent()}
                </div>
            </div>
        </div>
    );
};


const HistoryTab: React.FC<HistoryTabProps> = ({ items, chatSessions, currentChatId, onSelectChat, onDelete, onNew, onToggleFavorite }) => {
  const [viewingItem, setViewingItem] = useState<HistoryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  };

  const filteredAndSortedItems = useMemo(() => {
    return items
      .filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => {
        const favA = a.type === HistoryItemType.Chat && (a as ChatHistoryItem).isFavorited ? 1 : 0;
        const favB = b.type === HistoryItemType.Chat && (b as ChatHistoryItem).isFavorited ? 1 : 0;
        if (favB !== favA) {
          return favB - favA;
        }
        return b.createdAt - a.createdAt;
      });
  }, [items, searchQuery]);
  
  const handleSelect = (item: HistoryItem) => {
    if (item.type === HistoryItemType.Chat) {
        onSelectChat(item.sessionId);
    } else {
        setViewingItem(item);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {viewingItem && <HistoryDetailModal item={viewingItem} onClose={() => setViewingItem(null)} />}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-orbitron text-[--accent-300]">Project History</h2>
        <button onClick={onNew} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>
          + New Chat
        </button>
      </div>
      <div className="mb-4">
        <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search history by title..."
            className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
        />
      </div>
      <div className="flex-grow overflow-y-auto pr-2 space-y-3">
        {filteredAndSortedItems.length > 0 ? (
          filteredAndSortedItems.map((item, index) => {
            const isChat = item.type === HistoryItemType.Chat;
            const chatItem = isChat ? (item as ChatHistoryItem) : null;
            const isActiveChat = isChat && currentChatId === chatItem?.sessionId;

            return (
              <div 
                key={item.id} 
                onClick={() => handleSelect(item)}
                className={`flex items-center justify-between bg-black/5 dark:bg-white/5 p-3 rounded-lg transition-all duration-200 group cursor-pointer animate-list-item-in ${isActiveChat ? 'border-l-4 border-[--accent-400] bg-black/10 dark:bg-white/10' : 'hover:bg-black/10 dark:hover:bg-white/10'}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex items-center gap-3 flex-grow overflow-hidden">
                   <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-[--accent-500]/10 text-[--accent-300] rounded-lg">
                        <HistoryIcon type={item.type} />
                   </div>
                  <div className="flex-grow overflow-hidden">
                    <h3 className="font-semibold truncate text-slate-800 dark:text-white">{item.title}</h3>
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1 gap-4">
                        <span>{formatDate(item.createdAt)}</span>
                        {isChat && <span className="px-2 py-0.5 bg-[--accent-500]/20 text-[--accent-300] rounded">{chatItem?.category}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center flex-shrink-0">
                    {isChat && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onToggleFavorite(item.id); }}
                            className="text-yellow-400 hover:text-yellow-300 transition-colors p-1"
                            aria-label={`Favorite ${item.title}`}
                        >
                            <IconStar filled={!!chatItem?.isFavorited} />
                        </button>
                    )}
                    <button
                        onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
                        className="text-red-500 opacity-0 group-hover:opacity-100 transition-opacity ml-2"
                        aria-label={`Delete ${item.title}`}
                    >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="text-center text-gray-500 py-8">
            <p>{searchQuery ? 'No history found matching your search.' : 'No history yet. Start a conversation or create something new!'}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryTab;