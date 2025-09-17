import React, { useState, useEffect, useRef } from 'react';
import { Tab } from '../types';
import { IconMicrophone } from './Icons';

const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

interface VoiceCommanderProps {
    onNavigate: (tab: Tab) => void;
    onNewChat: () => void;
}

const COMMAND_MAP: { [key: string]: { action: (props: VoiceCommanderProps) => void, feedback: string } } = {
    'go to home': { action: (props) => props.onNavigate(Tab.Home), feedback: "Navigating to Home" },
    'open home': { action: (props) => props.onNavigate(Tab.Home), feedback: "Navigating to Home" },
    'go to productivity': { action: (props) => props.onNavigate(Tab.Productivity), feedback: "Opening Productivity" },
    'open productivity': { action: (props) => props.onNavigate(Tab.Productivity), feedback: "Opening Productivity" },
    'show my tasks': { action: (props) => props.onNavigate(Tab.Productivity), feedback: "Opening Productivity" },
    'go to creative': { action: (props) => props.onNavigate(Tab.Creative), feedback: "Entering Creative Studio" },
    'open creative': { action: (props) => props.onNavigate(Tab.Creative), feedback: "Entering Creative Studio" },
    'go to study': { action: (props) => props.onNavigate(Tab.Study), feedback: "Let's get studying!" },
    'open study': { action: (props) => props.onNavigate(Tab.Study), feedback: "Let's get studying!" },
    'go to games': { action: (props) => props.onNavigate(Tab.Games), feedback: "Entering the Game Center" },
    'open games': { action: (props) => props.onNavigate(Tab.Games), feedback: "Entering the Game Center" },
    'play a game': { action: (props) => props.onNavigate(Tab.Games), feedback: "Entering the Game Center" },
    'go to tools': { action: (props) => props.onNavigate(Tab.Tools), feedback: "Opening Tools" },
    'open tools': { action: (props) => props.onNavigate(Tab.Tools), feedback: "Opening Tools" },
    'go to history': { action: (props) => props.onNavigate(Tab.History), feedback: "Showing Chat History" },
    'open history': { action: (props) => props.onNavigate(Tab.History), feedback: "Showing Chat History" },
    'show my history': { action: (props) => props.onNavigate(Tab.History), feedback: "Showing Chat History" },
    'go to settings': { action: (props) => props.onNavigate(Tab.Settings), feedback: "Opening Settings" },
    'open settings': { action: (props) => props.onNavigate(Tab.Settings), feedback: "Opening Settings" },
    'new chat': { action: (props) => props.onNewChat(), feedback: "Starting a new chat" },
    'start a new chat': { action: (props) => props.onNewChat(), feedback: "Starting a new chat" },
};


const VoiceCommander: React.FC<VoiceCommanderProps> = (props) => {
    const [isListening, setIsListening] = useState(false);
    const [feedback, setFeedback] = useState<string | null>(null);
    const recognitionRef = useRef<any | null>(null);
    const feedbackTimeoutRef = useRef<number | null>(null);

    useEffect(() => {
        if (!SpeechRecognition) {
            console.warn("Voice commands not supported by this browser.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.trim().toLowerCase();
            showFeedback(`Heard: "${transcript}"`);

            const commandKey = Object.keys(COMMAND_MAP).find(key => transcript.includes(key));
            if (commandKey) {
                const command = COMMAND_MAP[commandKey];
                setTimeout(() => { 
                    showFeedback(command.feedback);
                    command.action(props);
                    setIsListening(false); 
                }, 800);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'not-allowed') {
                 showFeedback('Microphone access denied.', 5000);
            } else {
                 showFeedback('Voice error. Please try again.', 3000);
            }
            setIsListening(false);
        };
        
        recognition.onstart = () => {
             showFeedback('Listening for commands...', 3000);
        };

        recognition.onend = () => {
            if (isListening) {
                recognition.start();
            }
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.onend = null; // Prevent restart on unmount
                recognitionRef.current.stop();
            }
            if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        };
    }, [isListening]); // Rerun setup if isListening changes to properly handle onend closure

    const showFeedback = (message: string, duration = 3000) => {
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        setFeedback(message);
        feedbackTimeoutRef.current = window.setTimeout(() => {
            setFeedback(null);
        }, duration);
    };

    const toggleListening = () => {
        if (!recognitionRef.current) {
             showFeedback("Voice commands not supported.", 3000);
             return;
        }
        
        const newIsListening = !isListening;
        setIsListening(newIsListening);

        if (newIsListening) {
             try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Could not start recognition:", e);
                showFeedback("Couldn't start listening.", 3000);
                setIsListening(false);
            }
        } else {
            recognitionRef.current.stop();
            showFeedback('Voice commands off.', 2000);
        }
    };
    
    if (!SpeechRecognition) {
        return null;
    }

    return (
        <>
            {feedback && (
                <div className="fixed bottom-24 right-4 bg-slate-900/80 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
                    {feedback}
                </div>
            )}
            <button
                onClick={toggleListening}
                title="Toggle Voice Commands"
                aria-pressed={isListening}
                className={`fixed bottom-6 right-6 w-16 h-16 rounded-full flex items-center justify-center text-white z-50 transition-all duration-300 shadow-lg ${isListening ? 'bg-[--accent-500] animate-pulsate-mic' : 'bg-slate-700 hover:bg-slate-600'}`}
                style={{'--shadow-color': 'var(--accent-500-rgb, 0, 255, 255)'} as React.CSSProperties}
            >
                <IconMicrophone />
            </button>
        </>
    );
};

export default VoiceCommander;