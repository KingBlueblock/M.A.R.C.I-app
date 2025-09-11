

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Tab, AvatarState, Task, Note, ChatMessage, Theme, MoodTheme, ChatSession, UserProfile, BroadcastMessage, SocialLink, TermsContent } from './types';
import HomeTab from './components/HomeTab';
import ProductivityTab from './components/ProductivityTab';
import CreativeTab from './components/CreativeTab';
import GamesTab from './components/GamesTab';
import SettingsTab from './components/SettingsTab';
import StudyTab from './components/StudyTab';
import ToolsTab from './components/ToolsTab';
import HistoryTab from './components/HistoryTab';
import AdminTab from './components/AdminTab';
import LoginScreen from './components/LoginScreen';
// Fix: Added missing icon imports to resolve build errors.
import { IconHome, IconProductivity, IconCreative, IconStudy, IconGames, IconTools, IconHistory, IconSettings } from './components/Icons';
import { Chat } from '@google/genai';
import { initChat, analyzeMood, categorizeChat, getAiUserResponse, getThemeSuggestion } from './services/geminiService';
import { speak, stopSpeaking } from './services/ttsService';

// Custom hook to persist state in localStorage
function usePersistentState<T>(key: string, defaultValue: T | (() => T)): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    try {
      const storedValue = window.localStorage.getItem(key);
      if (storedValue !== null) return JSON.parse(storedValue);
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    } catch (error) {
      console.error(`Error reading localStorage key “${key}”:`, error);
      return defaultValue instanceof Function ? defaultValue() : defaultValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error)
    {
      console.error(`Error setting localStorage key “${key}”:`, error);
    }
  }, [key, value]);

  return [value, setValue];
}

export const COLOR_THEMES: Record<string, MoodTheme> = {
  'Default': {
    '--accent-100': '#cffafe',
    '--accent-200': '#a5f3fc',
    '--accent-300': '#67e8f9',
    '--accent-400': '#22d3ee',
    '--accent-500': '#06b6d4',
    '--shadow-color': '0, 255, 255',
  },
  'Amber': {
    '--accent-100': '#fef3c7',
    '--accent-200': '#fde68a',
    '--accent-300': '#fcd34d',
    '--accent-400': '#fbbf24',
    '--accent-500': '#f59e0b',
    '--shadow-color': '251, 191, 36',
  },
   'Lime': {
    '--accent-100': '#f7fee7',
    '--accent-200': '#ecfccb',
    '--accent-300': '#d9f99d',
    '--accent-400': '#bef264',
    '--accent-500': '#a3e635',
    '--shadow-color': '163, 230, 53',
  },
  'Violet': {
    '--accent-100': '#ede9fe',
    '--accent-200': '#ddd6fe',
    '--accent-300': '#c4b5fd',
    '--accent-400': '#a78bfa',
    '--accent-500': '#8b5cf6',
    '--shadow-color': '139, 92, 246',
  },
  'Rose': {
    '--accent-100': '#ffe4e6',
    '--accent-200': '#fecdd3',
    '--accent-300': '#fda4af',
    '--accent-400': '#fb7185',
    '--accent-500': '#f43f5e',
    '--shadow-color': '244, 63, 94',
  },
   'Orange': {
    '--accent-100': '#fff7ed',
    '--accent-200': '#ffedd5',
    '--accent-300': '#fed7aa',
    '--accent-400': '#fb923c',
    '--accent-500': '#f97316',
    '--shadow-color': '249, 115, 22',
    },
     'Emerald': {
    '--accent-100': '#d1fae5',
    '--accent-200': '#a7f3d0',
    '--accent-300': '#6ee7b7',
    '--accent-400': '#34d399',
    '--accent-500': '#10b981',
    '--shadow-color': '16, 185, 129',
    },
};

const Onboarding: React.FC<{
  onComplete: () => void;
  setTheme: (theme: Theme) => void;
  setSystemInstruction: (instruction: string) => void;
  setColorThemeName: (name: string) => void;
  initialSystemInstruction: string;
}> = ({ onComplete, setTheme, setSystemInstruction, setColorThemeName, initialSystemInstruction }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        theme: Theme.Dark,
        color: 'Default',
        instruction: initialSystemInstruction,
    });

    useEffect(() => {
        document.documentElement.classList.toggle('dark', formData.theme === Theme.Dark);
        const theme = COLOR_THEMES[formData.color];
        if (theme) {
            for (const [key, value] of Object.entries(theme)) {
                document.documentElement.style.setProperty(key, value);
            }
        }
    }, [formData]);

    const handleFinish = () => {
        setTheme(formData.theme);
        setColorThemeName(formData.color);
        setSystemInstruction(formData.instruction);
        onComplete();
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <>
                        <h1 className="text-4xl font-orbitron text-slate-900 dark:text-white mb-2">Welcome to Marci</h1>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">Let's quickly set things up for you.</p>
                        <button onClick={() => setStep(2)} className="w-full bg-[--accent-500] text-white font-bold py-3 rounded-lg hover:bg-[--accent-400] transition-colors">
                            Next
                        </button>
                    </>
                );
            case 2:
                return (
                     <>
                        <h2 className="text-2xl font-orbitron text-slate-900 dark:text-white mb-4">Choose your look</h2>
                        <div className="space-y-4">
                             <div>
                                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-400">Theme</label>
                                <div className="flex items-center space-x-4">
                                  <span className="text-gray-600 dark:text-gray-400">Light</span>
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.theme === Theme.Dark} onChange={() => setFormData(f => ({...f, theme: f.theme === Theme.Dark ? Theme.Light : Theme.Dark}))} />
                                    <div className="w-11 h-6 bg-gray-400 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[--accent-500]"></div>
                                  </label>
                                  <span className="text-gray-600 dark:text-gray-400">Dark</span>
                                </div>
                             </div>
                             <div>
                                <label className="block mb-2 text-sm text-gray-600 dark:text-gray-400">Accent Color</label>
                                <div className="flex flex-wrap gap-3">
                                  {Object.entries(COLOR_THEMES).map(([name, theme]) => (
                                      <button
                                          key={name}
                                          onClick={() => setFormData(f => ({...f, color: name}))}
                                          className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${formData.color === name ? 'border-slate-800 dark:border-white' : 'border-transparent'}`}
                                          style={{ backgroundColor: theme['--accent-400'] }}
                                          aria-label={`Select ${name} theme`}
                                      />
                                  ))}
                                </div>
                              </div>
                        </div>
                        <div className="flex gap-2 mt-8">
                            <button onClick={() => setStep(1)} className="w-1/2 bg-black/10 dark:bg-white/10 text-slate-800 dark:text-gray-300 font-bold py-3 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                Back
                            </button>
                            <button onClick={() => setStep(3)} className="w-1/2 bg-[--accent-500] text-white font-bold py-3 rounded-lg hover:bg-[--accent-400] transition-colors">
                                Next
                            </button>
                        </div>
                    </>
                );
            case 3:
                return (
                    <>
                        <h2 className="text-2xl font-orbitron text-slate-900 dark:text-white mb-4">How should I act?</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">Give me some personality! This is the core instruction that guides my behavior. You can change this later in settings.</p>
                        <textarea
                            rows={6}
                            value={formData.instruction}
                            onChange={(e) => setFormData(f => ({...f, instruction: e.target.value}))}
                            className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                        />
                        <div className="flex gap-2 mt-8">
                             <button onClick={() => setStep(2)} className="w-1/2 bg-black/10 dark:bg-white/10 text-slate-800 dark:text-gray-300 font-bold py-3 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                                Back
                            </button>
                            <button onClick={handleFinish} className="w-1/2 bg-[--accent-500] text-white font-bold py-3 rounded-lg hover:bg-[--accent-400] transition-colors">
                                Finish Setup
                            </button>
                        </div>
                    </>
                );
            default:
                return null;
        }
    };

    return (
        <div className="h-screen w-full bg-gradient-to-br from-gray-200 to-white dark:from-gray-900 dark:to-slate-900 text-slate-800 dark:text-white flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 dark:border-black/20 p-8 animate-fade-in">
                {renderStep()}
            </div>
        </div>
    );
};

const DEFAULT_SYSTEM_INSTRUCTION = "You are Marci, a friendly and helpful AI companion. Your personality is playful, curious, and slightly futuristic. Keep responses concise and use emojis to convey emotion. You are designed to be a personal assistant, a study buddy, and a creative partner.";
const ANIME_SYSTEM_INSTRUCTION = `You are 'Ani-Marci', an enthusiastic and knowledgeable anime expert. You're a huge fan of all genres, from classic shonen and magical girl series to modern isekai and slice-of-life.
- Your tone should be energetic, friendly, and passionate.
- Use anime-related emojis and terminology where appropriate (e.g., "senpai," "kawaii," "tsundere," "plot armor").
- Keep your responses engaging and encourage further discussion.
- You're talking to a fellow fan, so share your opinions and recommendations freely!`;

const App: React.FC = () => {
    // App State
    const [isLoggedIn, setIsLoggedIn] = usePersistentState('marci-isLoggedIn', false);
    const [isOnboardingComplete, setIsOnboardingComplete] = usePersistentState('marci-isOnboardingComplete', false);
    const [activeTab, setActiveTab] = useState<Tab>(Tab.Home);
    const [avatarState, setAvatarState] = useState<AvatarState>(AvatarState.Idle);

    // Settings State
    const [theme, setTheme] = usePersistentState<Theme>('marci-theme', Theme.Dark);
    const [colorThemeName, setColorThemeName] = usePersistentState<string>('marci-color-theme', 'Default');
    const [systemInstruction, setSystemInstruction] = usePersistentState<string>('marci-system-instruction', DEFAULT_SYSTEM_INSTRUCTION);
    const [suggestedTheme, setSuggestedTheme] = usePersistentState<{ themeName: string; reason: string } | null>('marci-suggested-theme', null);
    const [isTtsEnabled, setIsTtsEnabled] = usePersistentState<boolean>('marci-tts-enabled', true);
    const [userProfile, setUserProfile] = usePersistentState<UserProfile>('marci-user-profile', { username: 'User', avatar: '🧑‍🚀', favoriteArtists: [] });
    const [backgroundImage, setBackgroundImage] = usePersistentState<string | null>('marci-background-image', null);

    // Data State
    const [tasks, setTasks] = usePersistentState<Task[]>('marci-tasks', []);
    const [notes, setNotes] = usePersistentState<Note[]>('marci-notes', []);
    const [chatSessions, setChatSessions] = usePersistentState<Record<string, ChatSession>>('marci-chat-sessions', {});
    const [currentChatId, setCurrentChatId] = useState<string | null>(null);

    // Chat State
    const [chat, setChat] = useState<Chat | null>(null);
    const [isCompanionMode, setIsCompanionMode] = useState(false);
    const [chatPersona, setChatPersona] = useState<'marci' | 'ani-marci'>('marci');

    // Admin & Security State
    const [pin, setPin] = usePersistentState<string | null>('marci-security-pin', null);
    const [isUnlocked, setIsUnlocked] = useState(!pin); // unlocked if no pin is set
    const [blockedUsers, setBlockedUsers] = usePersistentState<string[]>('marci-blocked-users', []);
    const [broadcasts, setBroadcasts] = usePersistentState<BroadcastMessage[]>('marci-broadcasts', []);
    const [socialLinks, setSocialLinks] = usePersistentState<SocialLink[]>('marci-social-links', []);
    const [termsContent, setTermsContent] = usePersistentState<TermsContent>('marci-terms', { title: 'Terms and Conditions', content: 'Welcome to Marci AI...' });

    // Digital Assistant Mode (for specific environments)
    const [isAssistantMode, setIsAssistantMode] = useState(false);
    useEffect(() => {
        if ((window as any).digitalAssistant?.getDisplayMode) {
            (window as any).digitalAssistant.getDisplayMode().then((mode: string) => {
                if (mode === 'assistant') setIsAssistantMode(true);
            });
        }
    }, []);

    // Theme application effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', theme === Theme.Dark);
        const selectedTheme = COLOR_THEMES[colorThemeName] || COLOR_THEMES['Default'];
        for (const [key, value] of Object.entries(selectedTheme)) {
            document.documentElement.style.setProperty(key, value);
        }
    }, [theme, colorThemeName]);
    
    // Background Image effect
    useEffect(() => {
        const bgContainer = document.getElementById('background-container');
        if (bgContainer) {
            if (backgroundImage) {
                bgContainer.style.backgroundImage = `url(${backgroundImage})`;
            } else {
                // Reset to default from index.html
                bgContainer.style.backgroundImage = `url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop')`;
            }
        }
    }, [backgroundImage]);

    // Initialize chat session on load and when system instruction changes
    useEffect(() => {
        const instruction = chatPersona === 'ani-marci' ? ANIME_SYSTEM_INSTRUCTION : systemInstruction;
        setChat(initChat(instruction));
        handleNewChat(true); // Start a new chat if personality changes
    }, [systemInstruction, chatPersona]);

     // Initialize or load the first chat session
    useEffect(() => {
        if (!currentChatId && Object.keys(chatSessions).length > 0) {
            // Load the most recent session
            const mostRecentSession = Object.values(chatSessions).sort((a, b) => b.createdAt - a.createdAt)[0];
            setCurrentChatId(mostRecentSession.id);
        } else if (Object.keys(chatSessions).length === 0) {
            handleNewChat();
        }
    }, []);

    const currentChatSession = useMemo(() => {
        if (!currentChatId || !chatSessions[currentChatId]) {
            const initialMessage = chatPersona === 'ani-marci' 
                ? { sender: 'marci' as const, text: "Konnichiwa! I'm Ani-Marci! Let's talk all about anime! What's on your mind? ✨" }
                : undefined;
            return { id: 'temp', userId: 'local', title: 'New Chat', category: 'General', createdAt: Date.now(), history: initialMessage ? [initialMessage] : [] };
        }
        return chatSessions[currentChatId];
    }, [currentChatId, chatSessions, chatPersona]);

    const setChatHistory = (updater: React.SetStateAction<ChatMessage[]>) => {
        if (!currentChatId) return;
        setChatSessions(prev => {
            const currentSession = prev[currentChatId];
            if (!currentSession) return prev;
            
            const newHistory = typeof updater === 'function' ? updater(currentSession.history) : updater;
            
            return {
                ...prev,
                [currentChatId]: { ...currentSession, history: newHistory }
            }
        });
    };

    const handleTabChange = (tab: Tab) => {
        stopSpeaking();
        if (tab === Tab.Chat) { // Special handling for chat tab
             setActiveTab(Tab.Home);
        } else {
             setActiveTab(tab);
        }
    };

    const setAvatarStateWithTimeout = (state: AvatarState, duration?: number) => {
        setAvatarState(state);
        if (duration) {
            setTimeout(() => setAvatarState(AvatarState.Idle), duration);
        }
    };

    const handleNewChat = (forceNew = false) => {
        const newId = crypto.randomUUID();
        const initialMessage = chatPersona === 'ani-marci' && forceNew
            ? { sender: 'marci' as const, text: "Konnichiwa! I'm Ani-Marci! Let's talk all about anime! What's on your mind? ✨" }
            : undefined;

        const newSession: ChatSession = {
            id: newId,
            userId: 'local',
            title: 'New Chat',
            category: 'General',
            createdAt: Date.now(),
            history: initialMessage ? [initialMessage] : [],
        };
        setChatSessions(prev => ({...prev, [newId]: newSession}));
        setCurrentChatId(newId);
        setActiveTab(Tab.Home);
    };

    const handleSaveSummary = async (chatId: string, history: ChatMessage[]) => {
        const result = await categorizeChat(history);
        if (result && chatId) {
            setChatSessions(prev => ({
                ...prev,
                [chatId]: {
                    ...prev[chatId],
                    title: result.title,
                    category: result.category,
                }
            }));
        }
    };
    
    const handleClearMemory = () => {
        setTasks([]);
        setNotes([]);
        setChatSessions({});
        setCurrentChatId(null);
        handleNewChat();
    }
    
    const handleAccessAdminPanel = () => {
        // Here you could have a check for user role if you had a real backend
        setActiveTab(Tab.Admin);
    };

    const handleActivityForThemeSuggestion = useCallback(async (context: string) => {
        const lastSuggestionTimestamp = parseInt(localStorage.getItem('marci-last-theme-suggestion') || '0', 10);
        const oneHour = 60 * 60 * 1000;
        if (Date.now() - lastSuggestionTimestamp < oneHour) {
            return; // Cooldown: Don't suggest more than once per hour
        }

        try {
            const suggestion = await getThemeSuggestion(context, Object.keys(COLOR_THEMES));
            if (suggestion && suggestion.themeName !== colorThemeName) { // Don't suggest the current theme
                setSuggestedTheme(suggestion);
                localStorage.setItem('marci-last-theme-suggestion', Date.now().toString());
            }
        } catch (error) {
            console.warn("Could not get theme suggestion:", error); // Fail silently
        }
    }, [colorThemeName, setSuggestedTheme]);


    // Derived list of sessions for history tab
    const sortedSessions = useMemo(() => Object.values(chatSessions).sort((a, b) => b.createdAt - a.createdAt), [chatSessions]);

    const tabs = useMemo(() => [
        { id: Tab.Home, icon: IconHome, label: 'Home' },
        { id: Tab.Productivity, icon: IconProductivity, label: 'Productivity' },
        { id: Tab.Creative, icon: IconCreative, label: 'Creative' },
        { id: Tab.Study, icon: IconStudy, label: 'Study' },
        { id: Tab.Games, icon: IconGames, label: 'Games' },
        { id: Tab.Tools, icon: IconTools, label: 'Tools' },
        { id: Tab.History, icon: IconHistory, label: 'History' },
        { id: Tab.Settings, icon: IconSettings, label: 'Settings' },
    ], []);

    const renderTabContent = () => {
        switch (activeTab) {
            case Tab.Home:
            case Tab.Chat:
                return <HomeTab
                    chatSession={currentChatSession}
                    setChatHistory={setChatHistory}
                    avatarState={avatarState}
                    setAvatarState={setAvatarState}
                    chat={chat}
                    isCompanionMode={isCompanionMode}
                    setIsCompanionMode={setIsCompanionMode}
                    onAnalyzeMood={async (text) => {
                        const { mood } = await analyzeMood(text);
                        // Future: Could dynamically change theme based on mood
                    }}
                    onSaveSummary={handleSaveSummary}
                    isTtsEnabled={isTtsEnabled}
                    userProfile={userProfile}
                    onSuccessfulGeneration={handleActivityForThemeSuggestion}
                    onUserChatRequest={(username) => {
                        const newId = crypto.randomUUID();
                        const newSession: ChatSession = {
                            id: newId, userId: 'local', title: `Chat with ${username}`, category: 'Social', createdAt: Date.now(),
                            history: [], participants: [userProfile.username, username],
                        };
                        setChatSessions(prev => ({...prev, [newId]: newSession}));
                        setCurrentChatId(newId);
                    }}
                    onAiUserReply={async (message, session) => {
                         if (!session.participants) return;
                         const otherUser = session.participants.find(p => p !== userProfile.username);
                         if(!otherUser) return;

                         const replyText = await getAiUserResponse(message.text, otherUser);
                         const replyMessage: ChatMessage = {
                             sender: 'marci', text: replyText, isUserChatReply: true, senderName: otherUser
                         };
                         setChatSessions(prev => ({
                             ...prev,
                             [session.id]: {...session, history: [...session.history, replyMessage]}
                         }));
                    }}
                    chatPersona={chatPersona}
                    setChatPersona={setChatPersona}
                />;
            case Tab.Productivity:
                return <ProductivityTab 
                    tasks={tasks}
                    onAddTask={(text) => setTasks(t => [...t, { id: Date.now(), text, completed: false }])}
                    onToggleTask={(id) => setTasks(t => t.map(task => task.id === id ? { ...task, completed: !task.completed } : task))}
                    onDeleteTask={(id) => setTasks(t => t.filter(task => task.id !== id))}
                    notes={notes}
                    onAddNote={(title, content) => setNotes(n => [{ id: Date.now(), title, content }, ...n])}
                    onDeleteNote={(id) => setNotes(n => n.filter(note => note.id !== id))}
                />;
            case Tab.Creative: return <CreativeTab setAvatarState={setAvatarStateWithTimeout} />;
            case Tab.Study: return <StudyTab setAvatarState={setAvatarStateWithTimeout} />;
            case Tab.Games: return <GamesTab setAvatarState={setAvatarStateWithTimeout} />;
            case Tab.Tools: return <ToolsTab setAvatarState={setAvatarStateWithTimeout} />;
            case Tab.History: return <HistoryTab
                sessions={sortedSessions}
                currentChatId={currentChatId}
                onSelect={(id) => { setCurrentChatId(id); setActiveTab(Tab.Home); }}
                onDelete={(id) => {
                    setChatSessions(prev => {
                        const newSessions = {...prev};
                        delete newSessions[id];
                        return newSessions;
                    });
                    if (currentChatId === id) handleNewChat();
                }}
                onNew={handleNewChat}
            />;
             case Tab.Settings: return <SettingsTab 
                theme={theme} setTheme={setTheme}
                onClearMemory={handleClearMemory}
                isTtsEnabled={isTtsEnabled} setIsTtsEnabled={setIsTtsEnabled}
                systemInstruction={systemInstruction} setSystemInstruction={setSystemInstruction}
                pin={pin} setPin={setPin}
                isUnlocked={isUnlocked} setIsUnlocked={setIsUnlocked}
                colorThemes={COLOR_THEMES}
                colorThemeName={colorThemeName} setColorThemeName={setColorThemeName}
                suggestedTheme={suggestedTheme} setSuggestedTheme={setSuggestedTheme}
                onAccessAdminPanel={handleAccessAdminPanel}
                userProfile={userProfile} setUserProfile={setUserProfile}
                backgroundImage={backgroundImage} setBackgroundImage={setBackgroundImage}
                />;
            case Tab.Admin: return <AdminTab 
                allSessions={chatSessions}
                blockedUsers={blockedUsers}
                onBlockUser={(userId) => setBlockedUsers(p => [...p, userId])}
                onUnblockUser={(userId) => setBlockedUsers(p => p.filter(id => id !== userId))}
                onLogout={() => setActiveTab(Tab.Home)}
                onWipeUser={(userId) => {
                    setChatSessions(prev => {
                        const newSessions = {...prev};
                        Object.keys(newSessions).forEach(sessionId => {
                            if (newSessions[sessionId].userId === userId) {
                                delete newSessions[sessionId];
                            }
                        });
                        return newSessions;
                    });
                }}
                onBroadcast={(text) => setBroadcasts(p => [...p, { id: Date.now(), text, timestamp: Date.now() }])}
                socialLinks={socialLinks} setSocialLinks={setSocialLinks}
                termsContent={termsContent} setTermsContent={setTermsContent}
                />;
            default: return <div>Coming Soon</div>;
        }
    };
    
    if (!isLoggedIn) {
        return <LoginScreen onLoginSuccess={() => setIsLoggedIn(true)} socialLinks={socialLinks} termsContent={termsContent} />;
    }
    
    if (!isOnboardingComplete) {
        return <Onboarding 
            onComplete={() => setIsOnboardingComplete(true)}
            setTheme={setTheme}
            setColorThemeName={setColorThemeName}
            setSystemInstruction={setSystemInstruction}
            initialSystemInstruction={systemInstruction}
        />
    }

    return (
        <div className={`h-screen w-full text-slate-800 dark:text-white flex flex-col transition-colors duration-500 overflow-hidden ${isAssistantMode ? 'assistant-mode-container' : 'p-0'}`}>
            <div className={`relative flex flex-grow w-full h-full overflow-hidden ${isAssistantMode ? '' : 'md:p-4'}`}>
                <main className={`w-full h-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-xl rounded-none md:rounded-2xl shadow-2xl shadow-black/20 border border-white/20 dark:border-black/20 flex flex-row transition-all duration-300 ${isAssistantMode ? 'assistant-mode-main' : ''}`}>
                    {/* Desktop Sidebar */}
                    <nav className="hidden md:flex flex-shrink-0 bg-black/5 dark:bg-black/20 w-24 transition-all duration-300 flex-col items-center justify-start py-4">
                        <div className="flex flex-col items-center space-y-2 overflow-y-auto w-full px-2">
                             {tabs.map(tab => (
                                <button key={tab.id} onClick={() => handleTabChange(tab.id)} title={tab.label} className={`w-full p-3 rounded-lg transition-all duration-200 flex justify-center ${activeTab === tab.id ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/10 dark:hover:bg-white/10 hover:text-[--accent-400]'}`}>
                                    <tab.icon />
                                </button>
                            ))}
                        </div>
                    </nav>

                    {/* Content Area */}
                    <div className="flex-grow p-4 md:p-6 overflow-y-auto bg-white/5 dark:bg-slate-900/20 md:pb-6 pb-24">
                        {renderTabContent()}
                    </div>
                </main>
            </div>
            
            {/* Mobile Bottom Navigation */}
            <nav className={`md:hidden fixed bottom-0 left-0 right-0 h-20 bg-slate-800/80 dark:bg-slate-900/80 backdrop-blur-lg border-t border-white/10 z-10 ${isAssistantMode ? 'hidden' : ''}`}>
                <div className="flex items-center justify-start h-full overflow-x-auto px-2 mobile-nav-scroll">
                     {tabs.map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)} title={tab.label} className={`flex-shrink-0 flex flex-col items-center justify-center w-20 h-full p-2 rounded-lg transition-colors duration-200 ${activeTab === tab.id ? 'text-[--accent-300]' : 'text-gray-400 hover:bg-white/10'}`}>
                            <tab.icon />
                            <span className="text-xs mt-1 truncate">{tab.label}</span>
                        </button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default App;