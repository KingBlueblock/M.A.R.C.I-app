import React, { useState } from 'react';
import { AvatarState } from '../types';
import { generateImage } from '../services/geminiService';

interface Model3DTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
}

const Model3DTab: React.FC<Model3DTabProps> = ({ setAvatarState }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a description for the model.');
      return;
    }
    
    setIsLoading(true);
    setImageUrl(null);
    setError('');
    setAvatarState(AvatarState.Thinking, 15000); // Image generation can take time

    // Prompt engineering to get a concept sheet
    const engineeredPrompt = `Generate a 3D model concept sheet for: "${prompt}". 
    The image should show the object from multiple orthographic angles: front, side, and top view. 
    Also include a 3/4 perspective view. 
    The style should be a clean, untextured, clay render on a neutral grey background. This is for a 3D artist reference.`;

    try {
      const result = await generateImage(engineeredPrompt);
      if (result) {
        setImageUrl(result);
        setAvatarState(AvatarState.Happy);
      } else {
        setError("Sorry, I couldn't generate a concept sheet for that. Please try a different prompt.");
        setAvatarState(AvatarState.Idle);
      }
    } catch (e) {
      setError("An unexpected error occurred. Please try again later.");
      setAvatarState(AvatarState.Idle);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g., A cute, small robot helper with a single eye"
          disabled={isLoading}
          className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="bg-[--accent-500] text-white px-6 py-2 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap"
          style={{ boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)' }}
        >
          {isLoading ? 'Visualizing...' : 'Generate Concept'}
        </button>
      </div>

      <div className={`flex-grow overflow-y-auto pr-2 bg-black/5 dark:bg-black/20 rounded-lg p-4 flex items-center justify-center min-h-[300px] ${isLoading ? 'animate-pulsate-glow' : ''}`}>
        {isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Entering the 3D dimension...</p>
            <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[--accent-400] mx-auto mt-4"></div>
          </div>
        )}
        {error && !isLoading && (
            <p className="text-center text-red-400">{error}</p>
        )}
        {!isLoading && !error && imageUrl && (
            <img 
                src={imageUrl} 
                alt={prompt} 
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl shadow-black/50 animate-fade-in"
            />
        )}
         {!isLoading && !error && !imageUrl && (
            <p className="text-center text-gray-500">Your model concept sheet will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default Model3DTab;