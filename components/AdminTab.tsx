import React, { useState, useMemo } from 'react';
import { ChatSession, SocialLink, SocialIcon, TermsContent } from '../types';
import { IconBlockUser, IconDataWipe, IconBroadcast } from './Icons';

interface AdminTabProps {
  allSessions: Record<string, ChatSession>;
  blockedUsers: string[];
  onBlockUser: (userId: string) => void;
  onUnblockUser: (userId: string) => void;
  onLogout: () => void;
  onWipeUser: (userId: string) => void;
  onBroadcast: (text: string) => void;
  socialLinks: SocialLink[];
  setSocialLinks: React.Dispatch<React.SetStateAction<SocialLink[]>>;
  termsContent: TermsContent;
  setTermsContent: React.Dispatch<React.SetStateAction<TermsContent>>;
}

interface ConfirmationModalProps {
  title: string;
  message: React.ReactNode;
  pin: string;
  pinPrompt: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function ConfirmationModal({ title, message, pin: correctPin, pinPrompt, confirmText, onConfirm, onCancel }: ConfirmationModalProps) {
    const [pinInput, setPinInput] = useState('');
    const [error, setError] = useState('');

    const handleConfirm = () => {
        if (pinInput === correctPin) {
            onConfirm();
        } else {
            setError('Incorrect security PIN.');
        }
    };
    
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
            <div className="bg-slate-800 border border-red-500/50 rounded-lg p-8 max-w-sm w-full text-center">
                <h2 className="text-xl font-orbitron text-red-400 mb-2">{title}</h2>
                <div className="text-gray-400 mb-4">{message}</div>
                <p className="text-gray-400 text-sm mb-4">{pinPrompt}</p>
                <input
                  type="password"
                  value={pinInput}
                  onChange={(e) => setPinInput(e.target.value)}
                  maxLength={4}
                  className="w-40 bg-gray-900/50 border border-white/20 rounded-lg px-4 py-2 text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-red-400"
                />
                {error && <p className="text-red-400 text-sm mt-2">{error}</p>}
                <div className="flex gap-2 justify-center mt-6">
                    <button onClick={onCancel} className="bg-white/10 text-gray-300 px-4 py-2 rounded-lg hover:bg-white/20">Cancel</button>
                    <button onClick={handleConfirm} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500">{confirmText}</button>
                </div>
            </div>
        </div>
    );
};

const SOCIAL_ICONS: SocialIcon[] = ['twitter', 'github', 'discord', 'website', 'youtube', 'instagram'];

export default function AdminTab({ 
    allSessions, blockedUsers, onBlockUser, onUnblockUser, onLogout, onWipeUser, onBroadcast,
    socialLinks, setSocialLinks, termsContent, setTermsContent 
}: AdminTabProps) {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userToBlock, setUserToBlock] = useState<string | null>(null);
  const [userToWipe, setUserToWipe] = useState<string | null>(null);
  const [broadcastInput, setBroadcastInput] = useState('');
  const [localTerms, setLocalTerms] = useState(termsContent);
  const securityPin = '1403';

  const users = useMemo(() => {
    const userMap: Record<string, { sessions: ChatSession[], lastActivity: number }> = {};
    (Object.values(allSessions) as ChatSession[]).forEach(session => {
        if (!userMap[session.userId]) {
            userMap[session.userId] = { sessions: [], lastActivity: 0 };
        }
        userMap[session.userId].sessions.push(session);
        if (session.createdAt > userMap[session.userId].lastActivity) {
            userMap[session.userId].lastActivity = session.createdAt;
        }
    });
    return Object.entries(userMap)
        .sort(([, a], [, b]) => b.lastActivity - a.lastActivity)
        .map(([userId, data]) => ({ userId, ...data }));
  }, [allSessions]);
  
  const selectedUserSessions = useMemo(() => {
    return selectedUserId ? users.find(u => u.userId === selectedUserId)?.sessions.sort((a,b) => b.createdAt - a.createdAt) : [];
  }, [selectedUserId, users]);

  const stats = useMemo(() => {
    const sessions = Object.values(allSessions) as ChatSession[];
    const userIds = new Set(sessions.map(s => s.userId));
    const totalMessages = sessions.reduce((acc, session) => acc + session.history.length, 0);
    return {
        totalUsers: userIds.size,
        totalSessions: Object.keys(allSessions).length,
        totalMessages,
    }
  }, [allSessions]);

  const handleSendBroadcast = () => {
    if (broadcastInput.trim()) {
        onBroadcast(broadcastInput.trim());
        setBroadcastInput('');
    }
  }

  const handleAddSocialLink = () => {
    setSocialLinks(prev => [...prev, { id: Date.now(), icon: 'website', url: '' }]);
  };

  const handleUpdateSocialLink = (id: number, field: 'icon' | 'url', value: string) => {
    setSocialLinks(prev => prev.map(link => link.id === id ? { ...link, [field]: value } : link));
  };
  
  const handleRemoveSocialLink = (id: number) => {
    setSocialLinks(prev => prev.filter(link => link.id !== id));
  };

  return (
    <div className="h-full flex flex-col">
        {userToWipe && <ConfirmationModal 
            title="Confirm Data Wipe"
            message={<p>Permanently delete all data for user <span className="font-mono text-white bg-black/20 px-1 rounded">{userToWipe}</span>? This cannot be undone.</p>}
            pin={securityPin}
            pinPrompt="Enter the 4-digit security PIN to confirm."
            confirmText="Wipe Data"
            onCancel={() => setUserToWipe(null)} 
            onConfirm={() => { onWipeUser(userToWipe); setUserToWipe(null); setSelectedUserId(null); }} 
        />}
        {userToBlock && <ConfirmationModal 
            title="Confirm Block"
            message={<p>Block user <span className="font-mono text-white bg-black/20 px-1 rounded">{userToBlock}</span>?</p>}
            pin={securityPin}
            pinPrompt="Enter the 4-digit security PIN to confirm."
            confirmText="Block User"
            onCancel={() => setUserToBlock(null)} 
            onConfirm={() => { onBlockUser(userToBlock); setUserToBlock(null); setSelectedUserId(null); }} 
        />}
      
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
            <h2 className="text-2xl font-orbitron text-red-400">Admin Panel</h2>
            <button onClick={onLogout} className="bg-white/10 text-gray-300 px-4 py-2 rounded-lg hover:bg-white/20 transition-colors">
                Exit Admin Mode
            </button>
        </div>

        <div className="flex-grow flex gap-4 overflow-hidden">
            {/* Left Column */}
            <div className="w-1/2 flex flex-col gap-4 overflow-y-auto pr-2">
                {/* Stats & Broadcast */}
                <div className="bg-black/20 p-3 rounded-lg">
                    <div className="grid grid-cols-3 gap-4 text-center mb-3">
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <p className="text-2xl font-orbitron text-[--accent-300]">{stats.totalUsers}</p>
                            <p className="text-xs text-gray-400">Total Users</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <p className="text-2xl font-orbitron text-[--accent-300]">{stats.totalSessions}</p>
                            <p className="text-xs text-gray-400">Total Sessions</p>
                        </div>
                        <div className="bg-slate-900/50 p-3 rounded-lg">
                            <p className="text-2xl font-orbitron text-[--accent-300]">{stats.totalMessages}</p>
                            <p className="text-xs text-gray-400">Total Messages</p>
                        </div>
                    </div>
                    <div>
                        <h4 className="font-semibold text-white mb-2">System Broadcast</h4>
                        <div className="flex gap-2">
                            <input type="text" value={broadcastInput} onChange={e => setBroadcastInput(e.target.value)} placeholder="Send a message to all users..." className="w-full bg-gray-900/50 border-white/20 rounded px-3 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
                            <button onClick={handleSendBroadcast} className="bg-[--accent-500] text-white px-3 py-1 rounded text-sm hover:bg-[--accent-400] flex items-center gap-1"><IconBroadcast /> Send</button>
                        </div>
                    </div>
                </div>
                
                {/* Social Links Manager */}
                <div className="bg-black/20 p-3 rounded-lg">
                    <h4 className="font-semibold text-white mb-2">Social Links Manager</h4>
                    <div className="space-y-2">
                        {socialLinks.map(link => (
                            <div key={link.id} className="flex gap-2 items-center">
                                <select value={link.icon} onChange={e => handleUpdateSocialLink(link.id, 'icon', e.target.value)} className="bg-gray-900/50 border-white/20 rounded px-2 py-1 text-sm capitalize">
                                    {SOCIAL_ICONS.map(icon => <option key={icon} value={icon}>{icon}</option>)}
                                </select>
                                <input type="url" value={link.url} onChange={e => handleUpdateSocialLink(link.id, 'url', e.target.value)} placeholder="https://example.com" className="w-full bg-gray-900/50 border-white/20 rounded px-3 py-1 text-sm" />
                                <button onClick={() => handleRemoveSocialLink(link.id)} className="text-red-500 hover:text-red-400 p-1">✕</button>
                            </div>
                        ))}
                    </div>
                    <button onClick={handleAddSocialLink} className="mt-2 text-sm text-[--accent-300] hover:underline">+ Add Link</button>
                </div>
                
                {/* Terms & Conditions Editor */}
                <div className="bg-black/20 p-3 rounded-lg flex flex-col">
                    <h4 className="font-semibold text-white mb-2">Terms & Conditions</h4>
                    <input type="text" value={localTerms.title} onChange={e => setLocalTerms(t => ({...t, title: e.target.value}))} className="w-full bg-gray-900/50 border-white/20 rounded px-3 py-1 text-sm mb-2" />
                    <textarea value={localTerms.content} onChange={e => setLocalTerms(t => ({...t, content: e.target.value}))} rows={6} className="w-full bg-gray-900/50 border-white/20 rounded px-3 py-1 text-sm flex-grow" />
                    <button onClick={() => setTermsContent(localTerms)} className="mt-2 text-sm bg-[--accent-500] text-white px-3 py-1 rounded hover:bg-[--accent-400] self-end">Save Terms</button>
                </div>
            </div>

            {/* Right Column (User Management) */}
            <div className="w-1/2 flex flex-col gap-4">
                {/* User List */}
                <div className="h-1/3 flex-shrink-0 bg-black/20 rounded-lg p-2 flex flex-col">
                    <h3 className="font-bold text-gray-400 px-2 mb-1 flex-shrink-0">Users</h3>
                    <div className="space-y-1 overflow-y-auto">
                        {users.map(({ userId }) => (
                            <div 
                                key={userId}
                                onClick={() => setSelectedUserId(userId)}
                                className={`p-2 rounded-md cursor-pointer ${selectedUserId === userId ? 'bg-[--accent-500]/20' : 'hover:bg-white/10'}`}
                            >
                                <p className="font-mono text-sm truncate">{userId}</p>
                                {blockedUsers.includes(userId) && <span className="text-xs text-red-400 font-bold">BLOCKED</span>}
                            </div>
                        ))}
                    </div>
                </div>

                {/* User Details */}
                <div className="h-2/3 flex-shrink-0 bg-black/20 rounded-lg p-4 flex flex-col">
                    {selectedUserId ? (
                        <>
                            <div className="flex-shrink-0 flex justify-between items-center mb-3 pb-2 border-b border-white/10 flex-wrap gap-2">
                                <h3 className="font-mono text-lg truncate text-[--accent-300]">{selectedUserId}</h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setUserToWipe(selectedUserId)} className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-500 flex items-center gap-1"><IconDataWipe /> Wipe</button>
                                    {blockedUsers.includes(selectedUserId) ? (
                                        <button onClick={() => onUnblockUser(selectedUserId)} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-500">Unblock</button>
                                    ) : (
                                        <button onClick={() => setUserToBlock(selectedUserId)} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-500 flex items-center gap-1"><IconBlockUser /> Block</button>
                                    )}
                                </div>
                            </div>
                            <div className="overflow-y-auto flex-grow pr-2">
                            {selectedUserSessions && selectedUserSessions.length > 0 ? (
                                    selectedUserSessions.map(session => (
                                        <div key={session.id} className="mb-4 p-3 bg-slate-900/50 rounded">
                                            <p className="font-bold text-white">{session.title}</p>
                                            <p className="text-xs text-gray-400">{new Date(session.createdAt).toLocaleString()}</p>
                                            <div className="mt-2 text-sm text-gray-300 space-y-1 max-h-40 overflow-y-auto border-t border-white/10 pt-2">
                                                {session.history.map((msg, i) => (
                                                    <p key={i} className={`${msg.sender === 'user' ? 'text-indigo-300' : 'text-cyan-300'}`}>
                                                        <span className="font-semibold">{msg.sender === 'user' ? 'User: ' : 'Marci: '}</span>
                                                        {msg.text}
                                                    </p>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                            ) : (
                                <p className="text-gray-500 text-center mt-8">No chat sessions found for this user.</p>
                            )}
                            </div>
                        </>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select a user to view their activity.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
}