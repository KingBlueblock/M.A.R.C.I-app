import React, { useState, useEffect, useRef } from 'react';
import { Theme, MoodTheme, UserProfile } from '../types';
import { IconNotification } from './Icons';
import { setTtsSettings } from '../services/ttsService';

interface SettingsTabProps {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
  onClearMemory: () => void;
  isTtsEnabled: boolean;
  setIsTtsEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  systemInstruction: string;
  setSystemInstruction: React.Dispatch<React.SetStateAction<string>>;
  pin: string | null;
  setPin: React.Dispatch<React.SetStateAction<string | null>>;
  isUnlocked: boolean;
  setIsUnlocked: React.Dispatch<React.SetStateAction<boolean>>;
  colorThemes: Record<string, MoodTheme>;
  colorThemeName: string;
  setColorThemeName: React.Dispatch<React.SetStateAction<string>>;
  suggestedTheme: { themeName: string; reason: string } | null;
  setSuggestedTheme: React.Dispatch<React.SetStateAction<{ themeName: string; reason: string } | null>>;
  onAccessAdminPanel: () => void;
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  backgroundImage: string | null;
  setBackgroundImage: React.Dispatch<React.SetStateAction<string | null>>;
}

const SettingsTab: React.FC<SettingsTabProps> = ({ 
  theme, setTheme, onClearMemory, isTtsEnabled, setIsTtsEnabled,
  systemInstruction, setSystemInstruction, pin, setPin, isUnlocked, setIsUnlocked,
  colorThemes, colorThemeName, setColorThemeName, suggestedTheme, setSuggestedTheme, onAccessAdminPanel,
  userProfile, setUserProfile, backgroundImage, setBackgroundImage
}) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [localSystemInstruction, setLocalSystemInstruction] = useState(systemInstruction);
  const [saved, setSaved] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(Notification.permission);
  
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [localProfile, setLocalProfile] = useState(userProfile);
  const [profileSaved, setProfileSaved] = useState(false);
  
  const [ttsSettings, setTtsSettingsState] = useState(() => {
    try {
        const stored = localStorage.getItem('marci-tts-settings');
        return stored ? JSON.parse(stored) : { pitch: 1.2, rate: 1.0 };
    } catch {
        return { pitch: 1.2, rate: 1.0 };
    }
  });

  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState('');
  const [adminPinError, setAdminPinError] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setLocalSystemInstruction(systemInstruction);
  }, [systemInstruction]);

  useEffect(() => {
    setLocalProfile(userProfile);
  }, [userProfile]);
  
  const handleTtsSettingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    const newSettings = { ...ttsSettings, [id]: parseFloat(value) };
    setTtsSettingsState(newSettings);
    setTtsSettings(newSettings); // Persist to localStorage via service
  };

  const handleClearClick = () => {
    if (showConfirm) {
      onClearMemory();
      setShowConfirm(false);
    } else {
      setShowConfirm(true);
    }
  };

  const handleApplyBrainChanges = () => {
      setSystemInstruction(localSystemInstruction);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
  }

  const handleSaveProfile = () => {
    setUserProfile(localProfile);
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2000);
  };

  const handleRequestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications.');
      return;
    }
    const permission = await Notification.requestPermission();
    setNotificationPermission(permission);
    if (permission === 'granted') {
      new Notification("Marci says hi!", { body: "Notifications are now enabled." });
    }
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin) { // Unlocking
      if (pinInput === pin) {
        setIsUnlocked(true);
        setPinInput('');
        setPinError('');
      } else {
        setPinError('Incorrect PIN. Please try again.');
      }
    } else { // Setting PIN
      if (pinInput.length === 4 && /^\d+$/.test(pinInput)) {
        setPin(pinInput);
        setIsUnlocked(true);
        setPinInput('');
        setPinError('');
      } else {
        setPinError('PIN must be exactly 4 digits.');
      }
    }
  };

  const handleAccessAdmin = () => {
    if (adminPinInput === '1403') {
        onAccessAdminPanel();
        setShowAdminPinModal(false);
        setAdminPinInput('');
        setAdminPinError('');
    } else {
        setAdminPinError('Incorrect PIN.');
    }
  }

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBackgroundImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  
  const PinLockScreen = () => (
    <div className="max-w-md mx-auto mt-10 p-8 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 text-center">
        <h2 className="text-2xl font-orbitron text-[--accent-300] mb-4">
          {pin ? 'Enter PIN' : 'Set a PIN'}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          {pin ? 'Enter your 4-digit PIN to access sensitive settings.' : 'Create a 4-digit PIN to protect your settings.'}
        </p>
        <form onSubmit={handlePinSubmit} className="flex flex-col items-center gap-4">
            <input
              type="password"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              placeholder="••••"
              className="w-40 bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-3 text-2xl text-center tracking-[1em] focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
              style={{textIndent: '0.5em'}}
            />
            {pinError && <p className="text-red-400 text-sm">{pinError}</p>}
            <button type="submit" className="w-40 bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>
              {pin ? 'Unlock' : 'Set PIN'}
            </button>
        </form>
    </div>
  );
  
  const AdminPinModal = () => (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-slate-800 border border-red-500/50 rounded-lg p-8 max-w-sm w-full text-center">
        <h2 className="text-xl font-orbitron text-red-400 mb-2">Admin Access Required</h2>
        <p className="text-gray-400 mb-4">Enter the administrator PIN to continue.</p>
        <input
          type="password"
          value={adminPinInput}
          onChange={(e) => setAdminPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
          maxLength={4}
          autoFocus
          className="w-40 bg-gray-900/50 border border-white/20 rounded-lg px-4 py-3 text-2xl text-center tracking-[1em] focus:outline-none focus:ring-2 focus:ring-red-400"
          style={{textIndent: '0.5em'}}
        />
        {adminPinError && <p className="text-red-400 text-sm mt-2">{adminPinError}</p>}
        <div className="flex gap-2 justify-center mt-6">
          <button onClick={() => setShowAdminPinModal(false)} className="bg-white/10 text-gray-300 px-4 py-2 rounded-lg hover:bg-white/20">Cancel</button>
          <button onClick={handleAccessAdmin} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500">Enter</button>
        </div>
      </div>
    </div>
  );


  if (!isUnlocked) {
    return <PinLockScreen />;
  }

  return (
    <div>
      {showAdminPinModal && <AdminPinModal />}
      <h2 className="text-2xl font-orbitron text-[--accent-300] mb-6">Settings</h2>
      
      <div className="space-y-10">
        {/* User Profile */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <h3 className="text-lg font-bold text-[--accent-400] mb-4">User Profile</h3>
          <div className='space-y-4'>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                  <label htmlFor="username" className="block mb-1 text-sm">Username</label>
                  <input id="username" type="text" value={localProfile.username} onChange={e => setLocalProfile(p => ({...p, username: e.target.value}))} className="w-full bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
              </div>
              <div>
                  <label htmlFor="avatar" className="block mb-1 text-sm">Avatar (Emoji)</label>
                  <input id="avatar" type="text" value={localProfile.avatar} onChange={e => setLocalProfile(p => ({...p, avatar: e.target.value}))} maxLength={2} className="w-full bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
              </div>
            </div>
             <div>
                <label htmlFor="artists" className="block mb-1 text-sm">Favorite Artists (comma-separated)</label>
                <input id="artists" type="text" value={localProfile.favoriteArtists.join(', ')} onChange={e => setLocalProfile(p => ({...p, favoriteArtists: e.target.value.split(',').map(s => s.trim())}))} className="w-full bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
              </div>
            <div className="text-right">
              <button onClick={handleSaveProfile} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors text-sm font-semibold">
                  {profileSaved ? 'Saved!' : 'Save Profile'}
              </button>
            </div>
          </div>
        </div>
      
        {/* Appearance */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <h3 className="text-lg font-bold text-[--accent-400] mb-4">Appearance</h3>
           {suggestedTheme && (
            <div className="bg-[--accent-500]/10 border border-[--accent-500]/30 p-4 rounded-lg mb-6 animate-fade-in">
               <h4 className="font-semibold text-[--accent-300] flex items-center gap-2">
                   <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                   Theme Suggestion
               </h4>
               <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{suggestedTheme.reason}</p>
               <div className="flex gap-2 mt-3">
                   <button 
                       onClick={() => { setColorThemeName(suggestedTheme.themeName); setSuggestedTheme(null); }}
                       className="bg-[--accent-500] text-white px-3 py-1 text-sm rounded-md hover:bg-[--accent-400]"
                   >
                       Apply '{suggestedTheme.themeName}'
                   </button>
                   <button 
                        onClick={() => setSuggestedTheme(null)}
                        className="bg-black/10 dark:bg-white/10 px-3 py-1 text-sm rounded-md hover:bg-black/20 dark:hover:bg-white/20"
                   >
                        Dismiss
                   </button>
               </div>
            </div>
         )}
          <div className='space-y-6'>
            <div>
                <label className="block mb-2 text-sm">Theme</label>
                <div className="flex items-center space-x-4">
                  <span>Light</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer"
                      checked={theme === Theme.Dark}
                      onChange={() => setTheme(theme === Theme.Dark ? Theme.Light : Theme.Dark)}
                    />
                    <div className="w-11 h-6 bg-gray-400 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[--accent-500]"></div>
                  </label>
                  <span>Dark</span>
                </div>
            </div>
            <div>
              <label className="block mb-2 text-sm">Accent Color</label>
              <div className="flex flex-wrap gap-3">
                  {Object.entries(colorThemes).map(([name, theme]) => (
                      <button
                          key={name}
                          onClick={() => setColorThemeName(name)}
                          className={`w-10 h-10 rounded-full border-2 transition-transform transform hover:scale-110 ${colorThemeName === name ? 'border-slate-800 dark:border-white' : 'border-transparent'}`}
                          style={{ backgroundColor: theme['--accent-400'] }}
                          aria-label={`Select ${name} theme`}
                      />
                  ))}
              </div>
            </div>
            <div>
              <label className="block mb-2 text-sm">Custom Background</label>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleBackgroundChange} accept="image/*" className="hidden" />
                <button onClick={() => fileInputRef.current?.click()} className="bg-gray-300/50 dark:bg-gray-900/50 border-gray-400/50 dark:border-white/20 border rounded px-3 py-2 text-sm hover:bg-gray-300 dark:hover:bg-gray-800">
                  Upload Image
                </button>
                {backgroundImage && (
                  <button onClick={() => setBackgroundImage(null)} className="bg-red-600/20 border-red-500/30 border text-red-300 rounded px-3 py-2 text-sm hover:bg-red-600/40">
                    Remove
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Notifications */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <h3 className="text-lg font-bold text-[--accent-400] mb-3">Notifications</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <p>Allow Marci to send you notifications.</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current status: <span className="font-semibold text-slate-800 dark:text-white">{notificationPermission}</span></p>
            </div>
            <div className="mt-3 sm:mt-0">
              {notificationPermission !== 'granted' && (
                 <button onClick={handleRequestNotificationPermission} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors flex items-center gap-2">
                    <IconNotification />
                    {notificationPermission === 'denied' ? 'Permission Denied' : 'Enable Notifications'}
                 </button>
              )}
            </div>
          </div>
        </div>

        {/* Voice Settings */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <h3 className="text-lg font-bold text-[--accent-400] mb-3">Voice &amp; Speech</h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <label htmlFor="tts-toggle" className="cursor-pointer pr-4">
                <p>Enable Text-to-Speech</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Marci will read her responses aloud.</p>
              </label>
              <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                <input 
                  id="tts-toggle"
                  type="checkbox" 
                  className="sr-only peer"
                  checked={isTtsEnabled}
                  onChange={() => setIsTtsEnabled(!isTtsEnabled)}
                />
                <div className="w-11 h-6 bg-gray-400 dark:bg-gray-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[--accent-500]"></div>
              </label>
            </div>

            <div>
              <h4 className="text-md font-semibold text-gray-600 dark:text-gray-300 mb-2">Voice Customization</h4>
              <div className="space-y-4">
                <div>
                  <label htmlFor="pitch" className="block mb-1 text-sm">Pitch</label>
                  <input id="pitch" type="range" min="0.5" max="1.5" step="0.1" value={ttsSettings.pitch} onChange={handleTtsSettingChange} className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[--accent-500]" />
                </div>
                <div>
                  <label htmlFor="rate" className="block mb-1 text-sm">Speed</label>
                  <input id="rate" type="range" min="0.5" max="1.5" step="0.1" value={ttsSettings.rate} onChange={handleTtsSettingChange} className="w-full h-2 bg-gray-300 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[--accent-500]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brain */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <h3 className="text-lg font-bold text-[--accent-400] mb-3">Brain</h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="system-instruction" className="block mb-1 text-sm">Marci's Personality (System Instruction)</label>
              <textarea 
                id="system-instruction"
                rows={4}
                value={localSystemInstruction}
                onChange={(e) => setLocalSystemInstruction(e.target.value)}
                className="w-full bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-white/20 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
              />
              <div className="flex items-center justify-between mt-2">
                 <p className="text-xs text-gray-500 dark:text-gray-400">Changing Marci's personality will start a new conversation.</p>
                 <button onClick={handleApplyBrainChanges} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors text-sm font-semibold">
                    {saved ? 'Applied!' : 'Apply Changes'}
                 </button>
              </div>
            </div>
          </div>
        </div>

        {/* Memory Management */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
          <h3 className="text-lg font-bold text-[--accent-400] mb-3">Memory</h3>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
            <div>
              <p>Clear all conversations, tasks, and notes.</p>
              <p className="text-sm text-red-400">This action cannot be undone.</p>
            </div>
            <div className="mt-3 sm:mt-0">
              {showConfirm ? (
                  <div className="flex gap-2">
                      <button onClick={handleClearClick} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-500 transition-colors">Confirm</button>
                      <button onClick={() => setShowConfirm(false)} className="bg-black/20 dark:bg-white/20 text-slate-800 dark:text-white px-4 py-2 rounded-lg hover:bg-black/30 dark:hover:bg-white/30 transition-colors">Cancel</button>
                  </div>
              ) : (
                  <button onClick={handleClearClick} className="bg-red-600/50 text-white px-4 py-2 rounded-lg hover:bg-red-600/80 transition-colors">
                      Clear Marci's Memory
                  </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Security */}
        <div className="p-6 bg-black/5 dark:bg-white/5 rounded-lg border border-gray-200 dark:border-white/10 transition-all duration-300 hover:scale-[1.02] hover:border-white/20">
            <h3 className="text-lg font-bold text-[--accent-400] mb-3">Security</h3>
            <button onClick={() => setIsUnlocked(false)} className="bg-black/10 dark:bg-white/10 text-gray-600 dark:text-gray-300 px-4 py-2 rounded-lg hover:bg-black/20 dark:hover:bg-white/20 transition-colors">
                Lock Settings
            </button>
        </div>
        
        {/* Administration */}
        <div className="p-6 bg-red-900/20 rounded-lg border border-red-500/30 transition-all duration-300 hover:scale-[1.02] hover:border-red-500/50">
            <h3 className="text-lg font-bold text-red-400 mb-3">Administration</h3>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
                <p className="text-sm text-gray-500 dark:text-gray-400">Access user management and monitoring tools.</p>
                <button onClick={() => setShowAdminPinModal(true)} className="mt-3 sm:mt-0 bg-red-600/50 text-white px-4 py-2 rounded-lg hover:bg-red-600/80 transition-colors">
                    Access Admin Panel
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsTab;