import React, { useState } from 'react';
import JSZip from 'jszip';
import { AvatarState } from '../types';
import { generateFullMinecraftAddon, editMinecraftFile } from '../services/geminiService';

interface MinecraftTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
}

const MinecraftTab: React.FC<MinecraftTabProps> = ({ setAvatarState }) => {
    const [activeTool, setActiveTool] = useState<'generator' | 'editor'>('generator');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    
    // Generator State
    const [generatorPrompt, setGeneratorPrompt] = useState('');
    const [generatedFiles, setGeneratedFiles] = useState<Record<string, string> | null>(null);

    // Editor State
    const [addonFile, setAddonFile] = useState<File | null>(null);
    const [addonContents, setAddonContents] = useState<Record<string, string>>({});
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [editInstruction, setEditInstruction] = useState('');
    const [isEditing, setIsEditing] = useState(false);

    const handleGenerate = async () => {
        if (!generatorPrompt.trim()) {
            setError('Please describe the addon you want to create.');
            return;
        }
        setIsLoading(true);
        setGeneratedFiles(null);
        setError('');
        setAvatarState(AvatarState.Thinking, 15000);

        try {
            const result = await generateFullMinecraftAddon(generatorPrompt);
            setGeneratedFiles(result);
            setAvatarState(AvatarState.Happy);
        } catch (e: any) {
            setError(e.message);
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownload = (files: Record<string, string>, name: string) => {
        const zip = new JSZip();
        for (const path in files) {
            zip.file(path, files[path]);
        }
        zip.generateAsync({ type: 'blob' }).then(blob => {
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${name.trim().toLowerCase().replace(/\s+/g, '_')}.mcaddon`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    };
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setAddonFile(file);
        setIsLoading(true);
        setError('');
        setAddonContents({});
        setSelectedFile(null);
        try {
            const zip = await JSZip.loadAsync(file);
            const contents: Record<string, string> = {};
            for (const path in zip.files) {
                if (!zip.files[path].dir) {
                    contents[path] = await zip.files[path].async('string');
                }
            }
            setAddonContents(contents);
        } catch (e) {
            setError('Failed to read the uploaded file. Please ensure it is a valid .zip or .mcaddon.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyEdit = async () => {
        if (!selectedFile || !editInstruction.trim()) return;
        setIsEditing(true);
        setError('');
        setAvatarState(AvatarState.Thinking, 8000);
        try {
            const originalContent = addonContents[selectedFile];
            const modifiedContent = await editMinecraftFile(originalContent, editInstruction);
            setAddonContents(prev => ({ ...prev, [selectedFile!]: modifiedContent }));
            setEditInstruction('');
            setAvatarState(AvatarState.Happy);
        } catch (e: any) {
            setError(e.message);
        } finally {
            setIsEditing(false);
        }
    };

    const renderGenerator = () => (
        <>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Describe a new mob, item, or block. I'll generate a complete addon pack for you.</p>
            <textarea
                rows={5}
                value={generatorPrompt}
                onChange={(e) => setGeneratorPrompt(e.target.value)}
                placeholder="e.g., Create a small, passive golem made of mossy cobblestone that plants flowers. It should be called a 'Garden Golem' and drop seeds when killed."
                disabled={isLoading}
                className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400]"
            />
            <button
                onClick={handleGenerate}
                disabled={isLoading || !generatorPrompt.trim()}
                className="w-full mt-2 bg-[--accent-500] text-white px-6 py-2 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600"
            >
                {isLoading ? 'Generating Addon...' : 'Generate Addon'}
            </button>
            {generatedFiles && (
                 <div className="mt-4">
                    <h3 className="text-lg font-semibold mb-2">Generated Files:</h3>
                    <div className="bg-black/20 p-2 rounded max-h-40 overflow-y-auto">
                        {Object.keys(generatedFiles).map(path => <p key={path} className="font-mono text-xs">{path}</p>)}
                    </div>
                    <button onClick={() => handleDownload(generatedFiles, generatorPrompt.split(' ')[0] || 'addon')} className="w-full mt-2 bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-500">Download .mcaddon</button>
                </div>
            )}
        </>
    );
    
    const renderEditor = () => (
        <>
             <p className="text-gray-500 dark:text-gray-400 mb-4">Upload an addon to view, edit, or troubleshoot its files with AI assistance.</p>
             <input type="file" onChange={handleFileChange} accept=".zip,.mcaddon" className="w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[--accent-500]/20 file:text-[--accent-200] hover:file:bg-[--accent-500]/40" />
            {Object.keys(addonContents).length > 0 && (
                <div className="mt-4 flex gap-4 h-[400px]">
                    <div className="w-1/3 bg-black/20 p-2 rounded overflow-y-auto">
                        <h4 className="font-bold mb-1">Files</h4>
                        {Object.keys(addonContents).map(path => (
                             <button key={path} onClick={() => setSelectedFile(path)} className={`w-full text-left text-xs font-mono p-1 rounded ${selectedFile === path ? 'bg-[--accent-500]/50' : 'hover:bg-white/10'}`}>
                                {path}
                            </button>
                        ))}
                    </div>
                    <div className="w-2/3 flex flex-col gap-2">
                        {selectedFile ? (
                            <>
                                <textarea value={addonContents[selectedFile]} readOnly className="w-full h-1/2 bg-gray-900 text-xs font-mono p-2 rounded border border-white/10" />
                                <textarea value={editInstruction} onChange={e => setEditInstruction(e.target.value)} placeholder={`Tell me what to change in ${selectedFile}, or ask me to find problems.`} rows={3} className="w-full bg-gray-900/50 p-2 rounded border border-white/20 focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
                                <div className="flex gap-2">
                                <button onClick={handleApplyEdit} disabled={isEditing || !editInstruction} className="flex-grow bg-[--accent-500] text-white py-1 rounded hover:bg-[--accent-400] disabled:bg-gray-600">{isEditing ? 'Working...' : 'Apply AI Edit'}</button>
                                <button onClick={() => handleDownload(addonContents, addonFile?.name || 'edited_addon')} className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-500">Download</button>
                                </div>
                            </>
                        ) : <p className="m-auto text-gray-500">Select a file to view and edit.</p>}
                    </div>
                </div>
            )}
        </>
    );

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex border-b border-white/10 mb-4">
                <button onClick={() => setActiveTool('generator')} className={`px-4 py-2 text-sm font-semibold ${activeTool === 'generator' ? 'border-b-2 border-[--accent-400] text-[--accent-300]' : 'text-gray-400'}`}>Advanced Generator</button>
                <button onClick={() => setActiveTool('editor')} className={`px-4 py-2 text-sm font-semibold ${activeTool === 'editor' ? 'border-b-2 border-[--accent-400] text-[--accent-300]' : 'text-gray-400'}`}>Addon Editor</button>
            </div>
            
            <div className="flex-grow overflow-y-auto pr-2">
                {error && <p className="bg-red-900/50 text-red-300 p-2 rounded mb-4">{error}</p>}
                {activeTool === 'generator' ? renderGenerator() : renderEditor()}
            </div>
        </div>
    );
};

export default MinecraftTab;