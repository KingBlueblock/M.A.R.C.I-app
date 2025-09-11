

import React, { useState } from 'react';
import { SocialLink, SocialIcon, TermsContent, AvatarState } from '../types';
import MarciAvatar from './MarciAvatar';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  socialLinks: SocialLink[];
  termsContent: TermsContent;
}

const SocialIconComponent: React.FC<{ icon: SocialIcon }> = ({ icon }) => {
    // In a real app, you'd have different SVG icons here
    const getIcon = () => {
        switch (icon) {
            case 'github': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>;
            case 'twitter': return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 16 16"><path d="M5.026 15c6.038 0 9.341-5.003 9.341-9.334 0-.14 0-.282-.006-.422A6.685 6.685 0 0 0 16 3.542a6.658 6.658 0 0 1-1.889.518 3.301 3.301 0 0 0 1.447-1.817 6.533 6.533 0 0 1-2.087.793A3.286 3.286 0 0 0 7.875 6.03a9.325 9.325 0 0 1-6.767-3.429 3.289 3.289 0 0 0 1.018 4.382A3.323 3.323 0 0 1 .64 6.575v.045a3.288 3.288 0 0 0 2.632 3.218 3.203 3.203 0 0 1-.865.115 3.23 3.23 0 0 1-.614-.057 3.283 3.283 0 0 0 3.067 2.277A6.588 6.588 0 0 1 .78 13.58a6.32 6.32 0 0 1-.78-.045A9.344 9.344 0 0 0 5.026 15z"/></svg>;
            default: return <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>;
        }
    }
    return getIcon();
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, socialLinks, termsContent }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/\S+@\S+\.\S+/.test(email)) {
        setError("Please enter a valid email address.");
        return;
    }
    setError('');
    if (agreedToTerms) {
        // In a real app, you'd perform actual authentication here.
        // For this mock, we just proceed.
        onLoginSuccess();
    }
  };

  return (
    <div className="h-screen w-full bg-gradient-to-br from-gray-900 via-slate-900 to-black text-gray-100 flex flex-col items-center justify-center p-4">
        {showTerms && (
             <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={() => setShowTerms(false)}>
                <div className="bg-slate-800 border border-white/10 rounded-lg p-8 max-w-2xl w-full text-left" onClick={e => e.stopPropagation()}>
                    <h2 className="text-2xl font-orbitron text-[--accent-300] mb-4">{termsContent.title}</h2>
                    <div className="text-gray-400 mb-6 prose prose-invert max-h-[60vh] overflow-y-auto pr-4">
                        <p className="whitespace-pre-wrap">{termsContent.content}</p>
                    </div>
                    <button onClick={() => setShowTerms(false)} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400]">Close</button>
                </div>
            </div>
        )}
        <main className="w-full max-w-md bg-slate-800/50 backdrop-blur-xl rounded-2xl shadow-2xl shadow-[--accent-500]/20 border border-white/10 p-8 animate-fade-in">
            <div className="text-center mb-8">
                 <div className="w-40 h-40 mx-auto -mb-4">
                    <MarciAvatar state={AvatarState.Idle} />
                </div>
                <h1 className="font-orbitron text-5xl font-bold text-white tracking-widest" style={{textShadow: '0 0 10px var(--accent-400)'}}>
                    M.A.R.C.I
                </h1>
                <p className="text-gray-400">Your Personal AI Companion</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-4">
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email Address"
                    required
                    className="w-full bg-gray-900/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                />
                 <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    required
                    className="w-full bg-gray-900/50 border border-white/20 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
                />
                {error && <p className="text-sm text-red-400">{error}</p>}
                <div className="flex items-center">
                    <input
                        id="terms"
                        type="checkbox"
                        checked={agreedToTerms}
                        onChange={(e) => setAgreedToTerms(e.target.checked)}
                        className="h-4 w-4 rounded bg-gray-700 border-gray-600 text-[--accent-500] focus:ring-[--accent-400]"
                    />
                    <label htmlFor="terms" className="ml-2 text-sm text-gray-400">
                        I agree to the <button type="button" onClick={() => setShowTerms(true)} className="underline hover:text-[--accent-300]">Terms and Conditions</button>
                    </label>
                </div>
                <button 
                    type="submit" 
                    disabled={!agreedToTerms}
                    className="w-full bg-[--accent-500] text-white py-3 rounded-lg font-bold hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    Sign In
                </button>
            </form>
            {socialLinks.length > 0 && (
                <div className="mt-8 text-center">
                    <p className="text-sm text-gray-500 mb-3">Follow for updates:</p>
                    <div className="flex justify-center items-center gap-4">
                        {socialLinks.map(link => (
                            <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-[--accent-300] transition-colors">
                                <span className="sr-only">{link.icon}</span>
                                <SocialIconComponent icon={link.icon} />
                            </a>
                        ))}
                    </div>
                </div>
            )}
        </main>
        <footer className="mt-8 text-center text-gray-600 text-sm">
            <p>Aura enhanced by a world-class senior frontend engineer.</p>
        </footer>
    </div>
  );
};

export default LoginScreen;