import React from 'react';
import { AvatarState } from '../types';

interface MarciAvatarProps {
  state: AvatarState;
}

const MarciAvatar: React.FC<MarciAvatarProps> = ({ state }) => {
  const isIdle = state === AvatarState.Idle;
  const isSpeaking = state === AvatarState.Speaking;
  const isThinking = state === AvatarState.Thinking;
  const isHappy = state === AvatarState.Happy;
  const isListening = state === AvatarState.Listening;


  return (
    <div className={`relative w-full h-full ${isIdle ? 'animate-float' : ''} ${isHappy ? 'animate-happy-bounce' : ''}`}>
      <svg viewBox="0 0 100 100" className="w-full h-full text-[--accent-400]">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" style={{ stopColor: 'var(--accent-400)', stopOpacity: 0.4 }} />
            <stop offset="70%" style={{ stopColor: 'var(--accent-400)', stopOpacity: 0.1 }} />
            <stop offset="100%" style={{ stopColor: 'var(--accent-400)', stopOpacity: 0 }} />
          </radialGradient>
           <filter id="glow-filter">
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Aura & Thinking Rings */}
        <circle cx="50" cy="50" r="48" fill="url(#glow)" opacity={isListening ? 0.7 : 0.5} className="transition-opacity" />
        {isThinking && (
            <g style={{ transformOrigin: '50% 50%' }} className="animate-thinking-spin">
              <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="5 10" opacity="0.8"/>
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="1 8" opacity="0.6" style={{ animationDirection: 'reverse' }}/>
            </g>
        )}
        
        {/* Main Head */}
        <g>
            <circle cx="50" cy="50" r="32" fill="#2d3748" />
            <circle cx="50" cy="50" r="32" fill="url(#head-gradient)" stroke="#1a202c" strokeWidth="1.5" />
        </g>
        
        {/* Eye */}
        <g filter="url(#glow-filter)">
            <circle cx="50" cy="48" r="10" fill="var(--accent-500)" className={`${(isSpeaking || isListening) ? 'animate-pulse' : ''}`} />
            <circle cx="50" cy="48" r="6" fill="var(--accent-200)" />
            {/* Pupil */}
            <circle cx="50" cy="48" r="2.5" fill="#1a202c" />
            {/* Eyelid for blinking */}
            <path d="M 35 48 A 15 15 0 0 1 65 48" fill="#2d3748" className={`transition-transform duration-100 ease-in-out ${isIdle ? 'animate-blink' : ''}`} style={{ transformOrigin: '50px 48px', transform: 'scaleY(1)' }}/>
        </g>
        
        {/* Antenna */}
        <g>
            <path d="M 50 18 C 55 10, 60 10, 65 18" stroke="#4a5568" strokeWidth="1.5" fill="none" strokeLinecap='round' />
            <circle cx="65" cy="18" r="2.5" fill="currentColor" className={`${(isSpeaking || isListening) ? 'animate-pulse' : ''}`}/>
        </g>
      </svg>
    </div>
  );
};

export default MarciAvatar;