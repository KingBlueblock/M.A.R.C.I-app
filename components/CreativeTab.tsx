import React, { useState } from 'react';
import { AvatarState, HistoryItem } from '../types';
import ImageTab from './ImageTab';
import Model3DTab from './Model3DTab';
import MusicTab from './MusicTab';
import { IconImage, IconModel3D, IconMusic } from './Icons';

interface CreativeTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
  onSaveHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
}

const CreativeTab: React.FC<CreativeTabProps> = ({ setAvatarState, onSaveHistory }) => {
    const [activeTool, setActiveTool] = useState<'image' | '3d' | 'music'>('image');

    const renderContent = () => {
        switch(activeTool) {
            case 'image':
                return <ImageTab setAvatarState={setAvatarState} onSaveHistory={onSaveHistory} />;
            case '3d':
                return <Model3DTab setAvatarState={setAvatarState} />;
            case 'music':
                return <MusicTab setAvatarState={setAvatarState} onSaveHistory={onSaveHistory} />;
            default:
                return null;
        }
    }

    const getToolInfo = () => {
        switch(activeTool) {
            case 'image':
                return { title: "Image Generator", description: "Describe the image you want me to create. The more detailed your description, the better the result!" };
            case '3d':
                return { title: "AI 3D Model Concepts", description: "Describe an object or character. I will generate a concept sheet from multiple angles, perfect for 3D modeling inspiration." };
            case 'music':
                return { title: "Music Studio", description: "Generate lyrics, get instrumental ideas, and use AI-powered tools to help create your next song." };
            default:
                return { title: "", description: "" };
        }
    }

    const { title, description } = getToolInfo();
    
    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 mb-4">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-orbitron text-[--accent-300]">{title}</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1 max-w-2xl">{description}</p>
                    </div>
                    <div className="flex border border-gray-300 dark:border-white/20 rounded-lg p-0.5">
                        <button onClick={() => setActiveTool('image')} title="Image" className={`p-2 text-sm font-semibold rounded-md ${activeTool === 'image' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconImage /></button>
                        <button onClick={() => setActiveTool('3d')} title="3D Models" className={`p-2 text-sm font-semibold rounded-md ${activeTool === '3d' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconModel3D /></button>
                        <button onClick={() => setActiveTool('music')} title="Music" className={`p-2 text-sm font-semibold rounded-md ${activeTool === 'music' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconMusic /></button>
                    </div>
                 </div>
            </div>

            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};

export default CreativeTab;