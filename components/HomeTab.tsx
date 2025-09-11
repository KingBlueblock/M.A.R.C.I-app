
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ChatMessage, AvatarState, Tab, ChatSession, UserProfile } from '../types';
import type { Chat } from '@google/genai';
import WaveformAvatar from './WaveformAvatar';
import { IconMicrophone, IconPaperclip, IconCameraOn, IconSend, IconRemoveImage, IconWeather, IconBattery, IconLocation, IconClock, IconDevice, IconAnime } from './Icons';
import { speak, stopSpeaking } from '../services/ttsService';
import { getSongRecommendation, getWeather, getProactiveSuggestion } from '../services/geminiService';

// Fix: Add types for Web Speech API
interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}
interface SpeechRecognitionResult {
    isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
    readonly resultIndex: number;
    readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

// Check for browser support for SpeechRecognition
// Fix: Cast window to any to access non-standard properties.
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
const recognition = SpeechRecognition ? new SpeechRecognition() : null;
if (recognition) {
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'en-US';
}

interface HomeTabProps {
  chatSession: ChatSession;
  // Fix: Allow functional updates to prevent stale state issues with chat history.
  setChatHistory: (updater: React.SetStateAction<ChatMessage[]>) => void;
  avatarState: AvatarState;
  setAvatarState: React.Dispatch<React.SetStateAction<AvatarState>>;
  chat: Chat | null;
  isCompanionMode: boolean;
  setIsCompanionMode: React.Dispatch<React.SetStateAction<boolean>>;
  onAnalyzeMood: (text: string) => void;
  onSaveSummary: (chatId: string, history: ChatMessage[]) => void;
  isTtsEnabled: boolean;
  userProfile: UserProfile;
  onSuccessfulGeneration: (context: string) => void;
  onUserChatRequest: (username: string) => void;
  onAiUserReply: (message: ChatMessage, session: ChatSession) => void;
  chatPersona: 'marci' | 'ani-marci';
  setChatPersona: React.Dispatch<React.SetStateAction<'marci' | 'ani-marci'>>;
}

interface WeatherData {
    city: string;
    temperature: string;
    condition: string;
}

interface BatteryData {
    level: number;
    charging: boolean;
}

const parseUserAgent = () => {
    const ua = navigator.userAgent;
    let browser = 'Unknown Browser';
    let os = 'Unknown OS';

    // OS Detection
    if (ua.indexOf("Win") != -1) os = "Windows";
    if (ua.indexOf("Mac") != -1) os = "MacOS";
    if (ua.indexOf("Linux") != -1) os = "Linux";
    if (ua.indexOf("Android") != -1) os = "Android";
    if (ua.indexOf("like Mac") != -1) os = "iOS"; // for iOS

    // Browser Detection
    if (ua.indexOf("Firefox") > -1) browser = "Firefox";
    else if (ua.indexOf("Opera") > -1 || ua.indexOf("OPR") > -1) browser = "Opera";
    else if (ua.indexOf("Trident") > -1) browser = "Internet Explorer";
    else if (ua.indexOf("Edge") > -1) browser = "Edge";
    else if (ua.indexOf("Chrome") > -1) browser = "Chrome";
    else if (ua.indexOf("Safari") > -1) browser = "Safari";

    return `${browser} on ${os}`;
};

const Widget: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; className?: string }> = ({ icon, title, children, className }) => (
    <div className={`bg-black/5 dark:bg-white/5 p-3 rounded-lg flex items-center gap-3 transition-colors hover:bg-black/10 dark:hover:bg-white/10 ${className}`}>
        <div className="w-8 h-8 flex-shrink-0 bg-black/10 dark:bg-white/10 rounded-full flex items-center justify-center text-[--accent-400]">
            {icon}
        </div>
        <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">{title}</p>
            <p className="text-sm font-semibold text-slate-800 dark:text-white">{children}</p>
        </div>
    </div>
);

const Dashboard: React.FC = () => {
    const [time, setTime] = useState(new Date());
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [battery, setBattery] = useState<BatteryData | null>(null);
    const [deviceInfo] = useState(parseUserAgent());
    const [error, setError] = useState<string>('');

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date()), 1000 * 30); // update every 30 seconds

        // --- Weather & Location ---
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const weatherData = await getWeather(position.coords.latitude, position.coords.longitude);
                    setWeather(weatherData);
                } catch (e) {
                    console.error('Failed to get weather:', e);
                    setError('Weather N/A');
                }
            },
            () => {
                setError('Location N/A');
            },
            { timeout: 10000 }
        );

        // --- Battery Status ---
        if ('getBattery' in navigator) {
            (navigator as any).getBattery().then((batteryManager: any) => {
                const update = () => setBattery({
                    level: Math.round(batteryManager.level * 100),
                    charging: batteryManager.charging,
                });
                update();
                batteryManager.onlevelchange = update;
                batteryManager.onchargingchange = update;
            });
        }
        
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 mb-4 animate-fade-in">
            <Widget icon={<IconClock />} title="Time">
                {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </Widget>
            <Widget icon={<IconLocation />} title="Location">
                {weather?.city ?? error ?? 'Loading...'}
            </Widget>
            <Widget icon={<IconWeather />} title="Weather">
                {weather ? `${weather.temperature}, ${weather.condition}` : 'Loading...'}
            </Widget>
            <Widget icon={<IconBattery />} title="Battery">
                {battery ? `${battery.level}% ${battery.charging ? '⚡' : ''}` : 'N/A'}
            </Widget>
             <Widget icon={<IconDevice />} title="Device" className="col-span-2 md:col-span-3 lg:col-auto">
                {deviceInfo}
            </Widget>
        </div>
    );
};


const HomeTab: React.FC<HomeTabProps> = ({ chatSession, setChatHistory, avatarState, setAvatarState, chat, isCompanionMode, setIsCompanionMode, onAnalyzeMood, onSaveSummary, isTtsEnabled, userProfile, onUserChatRequest, onAiUserReply, onSuccessfulGeneration, chatPersona, setChatPersona }) => {
  const [userInput, setUserInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [image, setImage] = useState<string | null>(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [suggestion, setSuggestion] = useState('');
  
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cameraStreamRef = useRef<MediaStream | null>(null);

  const [songOfTheDay, setSongOfTheDay] = useState<{ song: string; artist: string; spotifyTrackId: string; date: string } | null>(null);

  const { history: chatHistoryForDisplay, id: chatSessionId, title: chatSessionTitle, participants } = chatSession;
  const isUserChat = participants && participants.length > 0;

    useEffect(() => {
        const fetchSong = async () => {
            const today = new Date().toISOString().split('T')[0];
            const storedSongData = localStorage.getItem('marci-song-of-the-day');
            if (storedSongData) {
                const parsed = JSON.parse(storedSongData);
                if (parsed.date === today) {
                    setSongOfTheDay(parsed);
                    return;
                }
            }
            
            if (userProfile.favoriteArtists.length > 0) {
                try {
                    const recommendation = await getSongRecommendation(userProfile.favoriteArtists);
                    if (recommendation && recommendation.spotifyTrackId) {
                        const newSongData = { ...recommendation, date: today };
                        setSongOfTheDay(newSongData);
                        localStorage.setItem('marci-song-of-the-day', JSON.stringify(newSongData));
                    }
                } catch (e) {
                    console.error("Failed to get song of the day:", e);
                }
            }
        };
        fetchSong();
    }, [userProfile.favoriteArtists]);

    useEffect(() => {
        // AURA: Proactive suggestion on new chats
        const fetchSuggestion = async () => {
            const suggestionText = await getProactiveSuggestion();
            setSuggestion(suggestionText);
        }
        if (chatSession.history.length === 0 && chatPersona === 'marci') { // Only show on empty standard chats
            fetchSuggestion();
        } else {
            setSuggestion('');
        }
    }, [chatSession.id, chatSession.history.length, chatPersona]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistoryForDisplay]);

  useEffect(() => {
    return () => {
        // Cleanup camera stream on component unmount
        if (cameraStreamRef.current) {
            cameraStreamRef.current.getTracks().forEach(track => track.stop());
        }
    }
  }, []);

  useEffect(() => {
    if (!recognition) return;
    
    if (isListening) {
      setAvatarState(AvatarState.Listening);
      recognition.start();
    } else {
      setAvatarState(AvatarState.Idle);
      recognition.stop();
    }
    
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = '';
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setUserInput(finalTranscript + interimTranscript);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
    };

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [isListening, setAvatarState]);
  
  const handleSendMessage = useCallback(async (messageText: string, imageBase64: string | null) => {
    if ((!messageText.trim() && !imageBase64) || isLoading || !chat) return;

    stopSpeaking();
    
    // Check for user chat command
    if(messageText.trim().startsWith('@')) {
        const username = messageText.trim().substring(1);
        if(username) {
            onUserChatRequest(username);
            setUserInput('');
            return;
        }
    }
    
    if (messageText && !isUserChat) {
      try {
        onAnalyzeMood(messageText);
      } catch (e) { console.warn("Mood analysis failed:", e); }
    }

    const newUserMessage: ChatMessage = { 
      sender: 'user', 
      text: messageText,
      imageUrl: imageBase64 ?? undefined,
      isEphemeral: isCompanionMode,
      timestamp: isCompanionMode ? Date.now() : undefined,
    };

    const updatedHistory = [...chatHistoryForDisplay, newUserMessage];
    setChatHistory(updatedHistory);
    setUserInput('');
    setImage(null);
    setIsLoading(true);

    if (isUserChat) {
        // Simulate sending to another user and getting an AI-powered reply
        setTimeout(() => {
            onAiUserReply(newUserMessage, chatSession);
            setIsLoading(false);
        }, 500 + Math.random() * 1000); // Simulate network latency
        return;
    }

    // --- Regular AI Chat Logic ---
    setAvatarState(AvatarState.Thinking);
    try {
      const parts = [];
      if (imageBase64) {
          parts.push({ inlineData: { data: imageBase64.split(',')[1], mimeType: 'image/jpeg' } });
      }
      if (messageText.trim()) {
          parts.push({ text: messageText.trim() });
      }
      
      const stream = await chat.sendMessageStream({ message: parts });
      
      let marciResponse = '';
      const marciMessage: ChatMessage = { sender: 'marci', text: '', isEphemeral: isCompanionMode, timestamp: isCompanionMode ? Date.now() : undefined };
      setChatHistory([...updatedHistory, marciMessage]);
      setAvatarState(AvatarState.Speaking);
      setIsLoading(false); 

      for await (const chunk of stream) {
        marciResponse += chunk.text;
        setChatHistory(prevHistory => {
            const newHistory = [...prevHistory];
            const lastMessage = newHistory[newHistory.length - 1];
            if (lastMessage && lastMessage.sender === 'marci' && !lastMessage.isUserChatReply) {
              lastMessage.text = marciResponse;
            }
            return newHistory;
        });
      }
      
      const finalHistory = [...updatedHistory, { ...marciMessage, text: marciResponse }];
      setChatHistory(finalHistory);
      
      if (isTtsEnabled) {
        speak(marciResponse, () => setAvatarState(AvatarState.Idle));
      } else {
        setAvatarState(AvatarState.Idle);
      }
      
      if (chatSessionTitle === 'New Chat' && finalHistory.length >= 4) {
          onSaveSummary(chatSessionId, finalHistory);
      }

      // Suggest a theme based on the user's prompt
      onSuccessfulGeneration(messageText.trim());

    } catch (error: any) {
      console.error("Error sending message:", error);
      const friendlyError = error.message || "I'm having a little trouble connecting. Please check your internet connection and try again.";
      const errorMessage: ChatMessage = { sender: 'marci', text: friendlyError };
      setChatHistory(prev => [...prev.slice(0, -1), errorMessage]);
      setIsLoading(false);
      setAvatarState(AvatarState.Idle);
    }
  }, [chat, isLoading, setChatHistory, setAvatarState, isCompanionMode, onAnalyzeMood, chatHistoryForDisplay, onSaveSummary, chatSessionId, chatSessionTitle, isTtsEnabled, isUserChat, onUserChatRequest, onAiUserReply, chatSession, onSuccessfulGeneration]);

  const toggleListening = () => {
    if (!recognition) {
        alert("Sorry, your browser doesn't support voice recognition.");
        return;
    }
    stopSpeaking();
    setIsListening(prevState => !prevState);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleCamera = async () => {
    setCameraError('');
    if (isCameraOn) {
        cameraStreamRef.current?.getTracks().forEach(track => track.stop());
        cameraStreamRef.current = null;
        if(videoRef.current) videoRef.current.srcObject = null;
        setIsCameraOn(false);
    } else {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                setCameraError("Your browser does not support camera access.");
                return;
            }
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                cameraStreamRef.current = stream;
                setIsCameraOn(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            if (err instanceof DOMException) {
                if (err.name === 'NotFoundError') {
                    setCameraError("No camera found. Please connect a camera and try again.");
                } else if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                    setCameraError("Camera access denied. Please enable it in your browser settings.");
                } else {
                    setCameraError(`An error occurred: ${err.name}`);
                }
            } else {
                setCameraError("Could not access camera. Please check permissions.");
            }
        }
    }
  };

  const captureImage = () => {
    if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas.getContext('2d')?.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        setImage(canvas.toDataURL('image/jpeg'));
        toggleCamera(); // Turn off camera after capture
    }
  };

  const getSenderName = (msg: ChatMessage) => {
      if (msg.sender === 'user') return userProfile.username;
      if (msg.isUserChatReply) return msg.senderName;
      return chatPersona === 'ani-marci' ? 'Ani-Marci' : 'Marci';
  }

  const getSenderAvatar = (msg: ChatMessage) => {
      if (msg.sender === 'user') return <span className="text-xl">{userProfile.avatar}</span>;
      if (msg.isUserChatReply) return <div className="w-8 h-8 rounded-full bg-green-500/20 flex-shrink-0 border border-green-500/30"></div>;
      return <div className="w-8 h-8 rounded-full bg-[--accent-500]/20 flex-shrink-0 border border-[--accent-500]/30"></div>;
  }

  return (
    <div className="h-full w-full flex flex-col">
       <div className="w-full h-24 flex-shrink-0">
          <WaveformAvatar state={avatarState} />
       </div>
       
       <Dashboard />
       
       <div ref={chatContainerRef} className="flex-grow overflow-y-auto pr-2 pl-2 pt-4 space-y-4">
        {songOfTheDay && (
            <div className="mb-4 animate-fade-in">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2 text-center">SONG OF THE DAY FOR YOU</p>
                <iframe
                    title="Spotify Song of the Day"
                    style={{ borderRadius: '12px' }}
                    src={`https://open.spotify.com/embed/track/${songOfTheDay.spotifyTrackId}?utm_source=generator`}
                    width="100%"
                    height="80"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                ></iframe>
            </div>
        )}
        {suggestion && (
            <div className="text-center p-3 mb-4 bg-black/5 dark:bg-white/5 rounded-lg animate-fade-in">
                <p className="text-sm italic text-gray-500 dark:text-gray-400">"{suggestion}"</p>
            </div>
        )}
          {chatHistoryForDisplay.map((msg, index) => (
          <div key={index} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
              <span className={`text-xs text-gray-500 dark:text-gray-400 mb-1 ${msg.sender === 'user' ? 'mr-12' : 'ml-11'}`}>
                  {getSenderName(msg)}
              </span>
              <div className={`flex items-end gap-3 w-full ${msg.sender === 'user' ? 'justify-end animate-slide-in-right' : 'justify-start animate-slide-in-left'}`}>
                  {msg.sender === 'marci' && getSenderAvatar(msg)}
                  <div
                  className={`max-w-xs md:max-w-md lg:max-w-lg p-3 rounded-2xl break-words transition-all duration-300 ${
                      msg.sender === 'user' 
                        ? 'bg-indigo-500 text-white rounded-br-none' 
                        : msg.isUserChatReply
                          ? 'bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none'
                          : 'bg-gray-200 dark:bg-slate-700 text-slate-800 dark:text-white rounded-bl-none'
                  }`}
                  >
                  {msg.imageUrl && <img src={msg.imageUrl} alt="User upload" className="rounded-lg mb-2 max-h-48" />}
                  {msg.text}
                  </div>
                   {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex-shrink-0 border border-indigo-500/30 flex items-center justify-center">{getSenderAvatar(msg)}</div>}
              </div>
          </div>
          ))}
          {isLoading && avatarState === AvatarState.Thinking && (
              <div className="flex items-end gap-3 justify-start animate-slide-in-left">
                  <div className="w-8 h-8 rounded-full bg-[--accent-500]/20 flex-shrink-0 border border-[--accent-500]/30"></div>
                  <div className="p-3 bg-gray-200 dark:bg-slate-700 rounded-2xl rounded-bl-none">
                      <div className="flex gap-1.5">
                          <span className="w-2 h-2 bg-[--accent-300] rounded-full animate-bounce delay-0"></span>
                          <span className="w-2 h-2 bg-[--accent-300] rounded-full animate-bounce delay-150"></span>
                          <span className="w-2 h-2 bg-[--accent-300] rounded-full animate-bounce delay-300"></span>
                      </div>
                  </div>
              </div>
          )}
          <div ref={messagesEndRef} />
      </div>
    
      <div className="flex-shrink-0 pt-4">
          {(image || isCameraOn) && (
            <div className="mb-2 p-2 bg-black/10 dark:bg-black/20 rounded-lg relative">
              {image && (
                 <>
                    <img src={image} alt="Preview" className="max-h-32 rounded" />
                    <button onClick={() => setImage(null)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 hover:bg-black/80">
                      <IconRemoveImage />
                    </button>
                 </>
              )}
              {isCameraOn && (
                <div className="flex flex-col items-center">
                    <video ref={videoRef} autoPlay playsInline className="w-full max-w-xs rounded-md" />
                    <button onClick={captureImage} className="mt-2 bg-[--accent-500] text-white px-3 py-1 rounded-lg text-sm">Capture</button>
                </div>
              )}
            </div>
          )}

          {cameraError && <p className="text-red-400 text-xs text-center mb-2">{cameraError}</p>}

          {!isUserChat && 
            <div className="flex justify-between items-center mb-2 px-1">
                 <button 
                    onClick={() => setChatPersona(p => p === 'marci' ? 'ani-marci' : 'marci')}
                    title={chatPersona === 'marci' ? 'Switch to Ani-Marci' : 'Switch to Marci'}
                    className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm transition-colors ${chatPersona === 'ani-marci' ? 'bg-rose-500/20 text-rose-300' : 'bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10'}`}
                 >
                    <IconAnime />
                    <span>{chatPersona === 'ani-marci' ? 'Ani-Marci Mode' : 'Standard Mode'}</span>
                </button>
                <label htmlFor="companion-mode" className="flex items-center cursor-pointer">
                <span className="mr-2 text-sm text-gray-500 dark:text-gray-400">Temporary Chat</span>
                <div className="relative">
                    <input id="companion-mode" type="checkbox" className="sr-only" checked={isCompanionMode} onChange={() => setIsCompanionMode(!isCompanionMode)} />
                    <div className="block bg-gray-400 dark:bg-gray-600 w-10 h-6 rounded-full"></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${isCompanionMode ? 'transform translate-x-full bg-[--accent-400]' : ''}`}></div>
                </div>
                </label>
            </div>
          }
          <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(userInput, image); }} className="flex items-center gap-2">
            <button type="button" onClick={toggleListening} className={`p-2 rounded-lg transition-colors ${isListening ? 'bg-[--accent-500] text-white animate-pulsate-mic' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'}`}>
                <IconMicrophone />
            </button>
             <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
            <button type="button" onClick={() => fileInputRef.current?.click()} className="p-2 rounded-lg bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors">
                <IconPaperclip />
            </button>
             <button type="button" onClick={toggleCamera} className={`p-2 rounded-lg transition-colors ${isCameraOn ? 'bg-[--accent-500] text-white' : 'bg-gray-300 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-400 dark:hover:bg-gray-600'}`}>
                <IconCameraOn />
            </button>
            <input
                type="text"
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder={isUserChat ? "Send a message..." : chatPersona === 'ani-marci' ? 'Discuss your favorite anime...' : "Talk to Marci or type @username..."}
                disabled={isLoading}
                className="w-full bg-white/70 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
            />
            <button type="submit" disabled={isLoading || (!userInput.trim() && !image)} className="bg-[--accent-500] text-white p-2 rounded-lg hover:bg-[--accent-400] disabled:bg-gray-500 disabled:cursor-not-allowed transition-all" style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}>
                <IconSend />
            </button>
          </form>
      </div>
    </div>
  );
};

export default HomeTab;