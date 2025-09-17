import React, { useState } from 'react';
import { AvatarState, HistoryItem, HistoryItemType } from '../types';
import { generateImage } from '../services/geminiService';

interface ImageTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
  onSaveHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
}

const ImageTab: React.FC<ImageTabProps> = ({ setAvatarState, onSaveHistory }) => {
  const [prompt, setPrompt] = useState('');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleGenerateImage = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt to generate an image.');
      return;
    }
    
    setIsLoading(true);
    setImageUrl(null);
    setError('');
    setAvatarState(AvatarState.Thinking, 15000); // Image generation can take time

    try {
      const result = await generateImage(prompt);
      setImageUrl(result);
      setAvatarState(AvatarState.Happy);

      // Save to unified history
      onSaveHistory({
        type: HistoryItemType.Image,
        title: prompt.length > 50 ? `${prompt.substring(0, 47)}...` : prompt,
        prompt: prompt,
        content: { imageUrl: result },
      });

    } catch (e: any) {
      setError(e.message);
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
          placeholder="e.g., A futuristic city skyline at sunset, with flying cars"
          disabled={isLoading}
          className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
        />
        <button
          onClick={handleGenerateImage}
          disabled={isLoading || !prompt.trim()}
          className="bg-[--accent-500] text-white px-6 py-2 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap"
          style={{ boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)' }}
        >
          {isLoading ? 'Creating...' : 'Generate'}
        </button>
      </div>

      <div className={`flex-grow overflow-y-auto pr-2 bg-black/5 dark:bg-black/20 rounded-lg p-4 flex items-center justify-center min-h-[300px] ${isLoading ? 'animate-pulsate-glow' : ''}`}>
        {isLoading && (
          <div className="text-center text-gray-500 dark:text-gray-400">
            <p>Marci is powering up the art-engine...</p>
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
            <p className="text-center text-gray-500">Your generated image will appear here.</p>
        )}
      </div>
    </div>
  );
};

export default ImageTab;