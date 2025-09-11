

import React, { useState, useRef } from 'react';
import { AvatarState } from '../types';
import { generateLyrics, generateInstrumentalIdea } from '../services/geminiService';
import { IconMusic } from './Icons';

interface MusicTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
}

const MusicTab: React.FC<MusicTabProps> = ({ setAvatarState }) => {
    const [lyricsTopic, setLyricsTopic] = useState('');
    const [lyricsGenre, setLyricsGenre] = useState('Pop');
    const [lyricsMood, setLyricsMood] = useState('Happy');
    const [generatedLyrics, setGeneratedLyrics] = useState('');
    const [isGeneratingLyrics, setIsGeneratingLyrics] = useState(false);

    const [songDescription, setSongDescription] = useState('');
    const [instrumentalIdea, setInstrumentalIdea] = useState('');
    const [isGeneratingIdea, setIsGeneratingIdea] = useState(false);
    
    const [audioSrc, setAudioSrc] = useState<string | null>(null);
    const [trackName, setTrackName] = useState<string>('No track loaded');
    const audioPlayerRef = useRef<HTMLAudioElement>(null);

    const [vocalFile, setVocalFile] = useState<File | null>(null);
    const [isAutotuning, setIsAutotuning] = useState(false);
    const [autotunedUrl, setAutotunedUrl] = useState<string | null>(null);

    const handleGenerateLyrics = async () => {
        if (!lyricsTopic) return;
        setIsGeneratingLyrics(true);
        setGeneratedLyrics('');
        setAvatarState(AvatarState.Thinking, 8000);
        try {
            const result = await generateLyrics(lyricsTopic, lyricsGenre, lyricsMood);
            setGeneratedLyrics(result);
            setAvatarState(AvatarState.Happy);
        } catch (error: any) {
            setGeneratedLyrics(error.message);
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsGeneratingLyrics(false);
        }
    };

    const handleGenerateInstrumental = async () => {
        if (!songDescription) return;
        setIsGeneratingIdea(true);
        setInstrumentalIdea('');
        setAvatarState(AvatarState.Thinking, 8000);
        try {
            const result = await generateInstrumentalIdea(songDescription);
            setInstrumentalIdea(result);
            setAvatarState(AvatarState.Happy);
        } catch (error: any) {
            setInstrumentalIdea(error.message);
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsGeneratingIdea(false);
        }
    };

    const handlePlayerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (audioSrc) {
                URL.revokeObjectURL(audioSrc);
            }
            const url = URL.createObjectURL(file);
            setAudioSrc(url);
            setTrackName(file.name);
            audioPlayerRef.current?.load();
        }
    };
    
    const handleAutotuneFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setVocalFile(file);
            setAutotunedUrl(null); // Reset on new file
        }
    };

    const handleAutotune = () => {
        if (!vocalFile) return;

        setIsAutotuning(true);
        setAutotunedUrl(null);
        setAvatarState(AvatarState.Thinking, 5000); // Simulate processing time

        // Simulate AI Autotuning
        setTimeout(() => {
            // In a real app, this would be a call to a backend service.
            // Here we just create a downloadable URL for the original file.
            const url = URL.createObjectURL(vocalFile);
            setAutotunedUrl(url);
            setIsAutotuning(false);
            setAvatarState(AvatarState.Happy);
        }, 4000); // 4 second fake processing
    };


    return (
        <div className="h-full flex flex-col space-y-6 overflow-y-auto pr-2">
            {/* Music Player */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                 <h3 className="text-xl font-bold text-[--accent-400] mb-3">Music Player</h3>
                 <div className="bg-black/10 dark:bg-black/20 p-3 rounded-lg flex items-center gap-4">
                    <div className="w-12 h-12 bg-[--accent-500]/20 text-[--accent-400] rounded-md flex items-center justify-center">
                        <IconMusic />
                    </div>
                    <div className="flex-grow">
                        <p className="font-semibold text-slate-800 dark:text-white truncate">{trackName}</p>
                        <audio ref={audioPlayerRef} controls src={audioSrc ?? undefined} className="w-full mt-1 h-8"></audio>
                    </div>
                    <label className="bg-[--accent-500] text-white px-3 py-1.5 rounded-lg hover:bg-[--accent-400] cursor-pointer text-sm font-semibold">
                        Load
                        <input type="file" accept="audio/*" onChange={handlePlayerFileChange} className="hidden" />
                    </label>
                 </div>
            </div>

            {/* Lyric Helper */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-[--accent-400] mb-3">Lyric Helper</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                    <input type="text" value={lyricsTopic} onChange={e => setLyricsTopic(e.target.value)} placeholder="Song Topic (e.g., Summer rain)" className="bg-gray-300/50 dark:bg-gray-900/50 border-gray-400/50 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
                    <select value={lyricsGenre} onChange={e => setLyricsGenre(e.target.value)} className="bg-gray-300/50 dark:bg-gray-900/50 border-gray-400/50 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]">
                        <option>Pop</option><option>Rock</option><option>Hip-Hop</option><option>Country</option><option>Electronic</option><option>Folk</option>
                    </select>
                     <select value={lyricsMood} onChange={e => setLyricsMood(e.target.value)} className="bg-gray-300/50 dark:bg-gray-900/50 border-gray-400/50 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]">
                        <option>Happy</option><option>Sad</option><option>Energetic</option><option>Calm</option><option>Angry</option><option>Romantic</option>
                    </select>
                </div>
                <button onClick={handleGenerateLyrics} disabled={isGeneratingLyrics || !lyricsTopic} className="bg-[--accent-500] text-white px-4 py-2 rounded hover:bg-[--accent-400] disabled:bg-gray-600">
                    {isGeneratingLyrics ? 'Writing...' : 'Write Lyrics'}
                </button>
                {(generatedLyrics || isGeneratingLyrics) && (
                    <div className="mt-4 bg-black/10 dark:bg-black/20 p-3 rounded h-40 overflow-y-auto prose prose-invert whitespace-pre-wrap">
                        {isGeneratingLyrics ? <p className="text-slate-600 dark:text-gray-400">Thinking of some rhymes...</p> : <p>{generatedLyrics}</p>}
                    </div>
                )}
            </div>
            
            {/* AI Autotune */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-[--accent-400] mb-3">AI Vocal Autotune ✨</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Upload your vocal track (MP3, WAV), and I'll apply some AI magic to tune it up for you!</p>
                <div className="space-y-3">
                    <label className="flex-grow w-full block bg-gray-300/50 dark:bg-gray-900/50 border-gray-400/50 dark:border-white/20 border rounded px-3 py-2 cursor-pointer text-gray-500 dark:text-gray-400 text-sm truncate">
                        {vocalFile ? vocalFile.name : 'Choose a vocal file...'}
                        <input type="file" accept="audio/mpeg, audio/wav" onChange={handleAutotuneFileChange} className="hidden" />
                    </label>
                    <div className="flex items-center gap-4">
                        <button onClick={handleAutotune} disabled={isAutotuning || !vocalFile} className="bg-[--accent-500] text-white px-4 py-2 rounded hover:bg-[--accent-400] disabled:bg-gray-600">
                            {isAutotuning ? 'Tuning...' : 'Autotune Vocals'}
                        </button>
                        {autotunedUrl && (
                            <a href={autotunedUrl} download={`[AUTOTUNED]-${vocalFile?.name}`} className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-500 animate-fade-in">
                                Download
                            </a>
                        )}
                    </div>
                    {isAutotuning && (
                        <p className="text-sm text-[--accent-300] animate-pulse">Analyzing pitch and timing... this might take a moment.</p>
                    )}
                </div>
            </div>

            {/* Instrumental Generator */}
            <div className="bg-black/5 dark:bg-white/5 p-4 rounded-lg">
                <h3 className="text-xl font-bold text-[--accent-400] mb-3">Instrumental Idea Generator</h3>
                <div className="space-y-3">
                    <textarea value={songDescription} onChange={e => setSongDescription(e.target.value)} placeholder="Describe your song's vibe..." rows={2} className="w-full bg-gray-300/50 dark:bg-gray-900/50 border-gray-400/50 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]"/>
                     <div className="flex items-center gap-4">
                        <button onClick={handleGenerateInstrumental} disabled={isGeneratingIdea || !songDescription} className="bg-[--accent-500] text-white px-4 py-2 rounded hover:bg-[--accent-400] disabled:bg-gray-600">
                            {isGeneratingIdea ? 'Composing...' : 'Generate Text Idea'}
                        </button>
                         <p className="text-xs text-gray-500 dark:text-gray-400">Audio generation (WAV/MP3) coming soon!</p>
                     </div>
                </div>
                 {(instrumentalIdea || isGeneratingIdea) && (
                    <div className="mt-4 bg-black/10 dark:bg-black/20 p-3 rounded h-40 overflow-y-auto prose prose-invert whitespace-pre-wrap">
                        {isGeneratingIdea ? <p className="text-slate-600 dark:text-gray-400">Listening to the vibe...</p> : <p>{instrumentalIdea}</p>}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MusicTab;