import React, { useState } from 'react';
import JSZip from 'jszip';
import { AvatarState, HistoryItem } from '../types';
import MinecraftTab from './MinecraftTab';
import SpikePrimeTab from './SpikePrimeTab';
import LocationTab from './LocationTab';
import { IconMinecraft, IconSpike, IconLocation, IconFiles } from './Icons';

interface ToolsTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
  onSaveHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
}

const FileUtils: React.FC<Pick<ToolsTabProps, 'setAvatarState'>> = ({ setAvatarState }) => {
    const [zipFile, setZipFile] = useState<File | null>(null);
    const [isLoadingZip, setIsLoadingZip] = useState(false);
    const [status, setStatus] = useState('');

    // This is a simplified version of the ZIP functionality from the old FilesTab.
    // It's a placeholder for more complex file operations.
    const handleInspectZip = async () => {
        if (!zipFile) {
            setStatus('Please select a .zip file.');
            return;
        }
        setIsLoadingZip(true);
        setStatus(`Reading "${zipFile.name}"...`);
        setAvatarState(AvatarState.Thinking, 2000);
        
        try {
            const zip = await JSZip.loadAsync(zipFile);
            const fileList = Object.keys(zip.files).join(', ');
            setStatus(`Files found in zip: ${fileList}`);
        } catch (error) {
            console.error(error);
            setStatus('An error occurred while reading the .zip file.');
        } finally {
            setIsLoadingZip(false);
            setAvatarState(AvatarState.Happy);
        }
    };

    return (
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-[--accent-400] mb-2">ZIP File Inspector</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Upload a .zip archive to see its contents.</p>
            <div className="space-y-4 max-w-md">
                <input
                    type="file"
                    accept=".zip"
                    onChange={(e) => setZipFile(e.target.files ? e.target.files[0] : null)}
                    disabled={isLoadingZip}
                    className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[--accent-500]/20 file:text-[--accent-200] hover:file:bg-[--accent-500]/40"
                />
                <button onClick={handleInspectZip} disabled={isLoadingZip || !zipFile} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
                    {isLoadingZip ? 'Processing...' : 'Inspect ZIP'}
                </button>
            </div>
            {status && (
                <div className="mt-4 text-center text-sm text-[--accent-300]">
                    <p>{status}</p>
                </div>
            )}
        </div>
    );
};


const ToolsTab: React.FC<ToolsTabProps> = ({ setAvatarState, onSaveHistory }) => {
    const [activeTool, setActiveTool] = useState<'minecraft' | 'spike' | 'location' | 'files'>('minecraft');

    const renderContent = () => {
        switch(activeTool) {
            case 'minecraft': return <MinecraftTab setAvatarState={setAvatarState} onSaveHistory={onSaveHistory} />;
            case 'spike': return <SpikePrimeTab />;
            case 'location': return <LocationTab />;
            case 'files': return <FileUtils setAvatarState={setAvatarState} />;
            default: return null;
        }
    };
    
    const getToolInfo = () => {
        switch(activeTool) {
            case 'minecraft': return { title: "Minecraft Addon Studio" };
            case 'spike': return { title: "Spike Prime Controller" };
            case 'location': return { title: "Navigation" };
            case 'files': return { title: "File Utilities" };
            default: return { title: "" };
        }
    };

    return (
        <div className="flex flex-col h-full">
             <div className="flex-shrink-0 flex justify-between items-center mb-4">
                <h2 className="text-2xl font-orbitron text-[--accent-300]">{getToolInfo().title}</h2>
                <div className="flex border border-gray-300 dark:border-white/20 rounded-lg p-0.5">
                    <button onClick={() => setActiveTool('minecraft')} title="Minecraft" className={`p-2 text-sm font-semibold rounded-md ${activeTool === 'minecraft' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconMinecraft /></button>
                    <button onClick={() => setActiveTool('spike')} title="Spike Prime" className={`p-2 text-sm font-semibold rounded-md ${activeTool === 'spike' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconSpike /></button>
                    <button onClick={() => setActiveTool('location')} title="Location" className={`p-2 text-sm font-semibold rounded-md ${activeTool === 'location' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconLocation /></button>
                    <button onClick={() => setActiveTool('files')} title="File Utilities" className={`p-2 text-sm font-semibold rounded-md ${activeTool === 'files' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}><IconFiles /></button>
                </div>
            </div>

            <div className="flex-grow">
                {renderContent()}
            </div>
        </div>
    );
};

export default ToolsTab;