import React, { useState } from 'react';
import { AvatarState, HistoryItem, HistoryItemType } from '../types';
import { generateStudyNotes, generatePptxContent } from '../services/geminiService';
import PptxGenJS from 'pptxgenjs';

interface StudyTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
  onSaveHistory: (item: Omit<HistoryItem, 'id' | 'createdAt'>) => void;
}

const StudyNotes: React.FC<StudyTabProps> = ({ setAvatarState, onSaveHistory }) => {
    const [topic, setTopic] = useState('');
    const [notes, setNotes] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleGenerateNotes = async () => {
        if (!topic.trim()) return;
        setIsLoading(true);
        setNotes('');
        setAvatarState(AvatarState.Thinking, 10000); // Long thinking time
        
        try {
            const generatedNotes = await generateStudyNotes(topic);
            setNotes(generatedNotes);
            setAvatarState(AvatarState.Happy);

            // Save to unified history
            onSaveHistory({
                type: HistoryItemType.StudyNotes,
                title: `Notes: ${topic}`,
                prompt: { topic },
                content: { notes: generatedNotes },
            });
        } catch (error: any) {
            setNotes(error.message); // Display error in the notes area
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsLoading(false);
        }
    };

    // A simple markdown to HTML converter for display
    const renderMarkdown = (text: string) => {
        if (!text.match(/^[#*]/m) && text.length < 200) {
            return <p className="text-red-400">{text}</p>;
        }
        
        const html = text
            .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold text-[--accent-400] mt-4 mb-2">$1</h3>')
            .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-[--accent-300] mt-6 mb-3 border-b border-gray-300 dark:border-white/10 pb-1">$1</h2>')
            .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-800 dark:text-white mt-8 mb-4">$1</h1>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/^\* (.*$)/gim, '<li class="ml-6">$1</li>')
            .replace(/^(<li.*<\/li>)$/gim, '<ul class="list-disc list-inside mb-2">$1</ul>')
            .replace(/\n/g, '<br />')
            .replace(/<br \/><ul/g, '<ul')
            .replace(/<\/ul><br \/>/g, '</ul>');
            
        return <div dangerouslySetInnerHTML={{ __html: html }} />;
    };

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 mb-4">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="Enter a topic you want to learn about..."
                    disabled={isLoading}
                    className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
                />
                <button 
                    onClick={handleGenerateNotes} 
                    disabled={isLoading || !topic.trim()}
                    className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap"
                    style={{boxShadow: '0 0 10px rgba(var(--shadow-color), 0.4)'}}
                >
                    {isLoading ? 'Generating...' : 'Generate Notes'}
                </button>
            </div>
            <div className={`flex-grow overflow-y-auto pr-2 bg-black/5 dark:bg-black/20 rounded-lg p-4 prose prose-slate dark:prose-invert ${isLoading ? 'animate-pulsate-glow' : ''}`}>
                {isLoading && (
                    <div className="text-center text-gray-400">
                        <p>Marci is studying hard to prepare your notes...</p>
                        <div className="w-12 h-12 border-4 border-dashed rounded-full animate-spin border-[--accent-400] mx-auto mt-4"></div>
                    </div>
                )}
                {notes ? (
                    renderMarkdown(notes)
                ) : (
                    !isLoading && <p className="text-center text-gray-500">Your study notes will appear here.</p>
                )}
            </div>
        </div>
    );
};

const PptxGenerator: React.FC<Pick<StudyTabProps, 'setAvatarState'>> = ({ setAvatarState }) => {
    const [pptxTopic, setPptxTopic] = useState('');
    const [isLoadingPptx, setIsLoadingPptx] = useState(false);
    const [status, setStatus] = useState('');

    const handleGeneratePptx = async () => {
        if (!pptxTopic) {
            setStatus('Please enter a topic for the presentation.');
            return;
        }
        setIsLoadingPptx(true);
        setStatus('Generating presentation content...');
        setAvatarState(AvatarState.Thinking, 10000);

        try {
            const content = await generatePptxContent(pptxTopic);
            
            setStatus('Creating .pptx file...');
            const pptx = new PptxGenJS();
            
            pptx.addSlide().addText(content.title, { x: 1, y: 2.5, w: 8, h: 1, fontSize: 32, bold: true, align: 'center' });

            content.slides.forEach(slideData => {
                const slide = pptx.addSlide();
                slide.addText(slideData.title, { x: 0.5, y: 0.25, w: '90%', h: 0.75, fontSize: 24, bold: true });
                slide.addText(slideData.points.join('\n'), { x: 0.5, y: 1.2, w: '90%', h: 4, fontSize: 18, bullet: true });
                slide.addNotes(slideData.notes);
            });

            pptx.writeFile({ fileName: `${pptxTopic.replace(/\s+/g, '_')}.pptx` });

            setStatus(`Presentation "${pptxTopic}.pptx" created successfully!`);
            setAvatarState(AvatarState.Happy);
            setPptxTopic('');
        } catch (error: any) {
            setStatus(error.message);
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsLoadingPptx(false);
        }
    };

     return (
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg">
            <div className="flex flex-col sm:flex-row gap-2">
                 <input
                    type="text"
                    value={pptxTopic}
                    onChange={(e) => setPptxTopic(e.target.value)}
                    placeholder="e.g., The Future of AI"
                    disabled={isLoadingPptx}
                    className="w-full bg-gray-200 dark:bg-gray-900/50 border border-gray-300 dark:border-white/20 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-[--accent-400] transition-all"
                />
                <button onClick={handleGeneratePptx} disabled={isLoadingPptx} className="bg-[--accent-500] text-white px-4 py-2 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed whitespace-nowrap">
                    {isLoadingPptx ? 'Generating...' : 'Create .pptx'}
                </button>
            </div>
             {status && (
                <div className="mt-4 text-center text-sm text-[--accent-300]">
                    <p>{status}</p>
                </div>
            )}
        </div>
    );
}

const StudyTab: React.FC<StudyTabProps> = ({ setAvatarState, onSaveHistory }) => {
    const [activeTool, setActiveTool] = useState<'notes' | 'pptx'>('notes');

    return (
        <div className="flex flex-col h-full">
            <div className="flex-shrink-0 flex justify-between items-center mb-4">
                 <h2 className="text-2xl font-orbitron text-[--accent-300]">Study Assistant</h2>
                <div className="flex border border-gray-300 dark:border-white/20 rounded-lg p-0.5">
                    <button onClick={() => setActiveTool('notes')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeTool === 'notes' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}>Study Notes</button>
                    <button onClick={() => setActiveTool('pptx')} className={`px-3 py-1 text-sm font-semibold rounded-md ${activeTool === 'pptx' ? 'bg-[--accent-500] text-white' : 'text-gray-500 hover:bg-black/5 dark:hover:bg-white/5'}`}>Presentation Maker</button>
                </div>
            </div>

            <div className="flex-grow">
                {activeTool === 'notes' ? <StudyNotes setAvatarState={setAvatarState} onSaveHistory={onSaveHistory} /> : <PptxGenerator setAvatarState={setAvatarState} />}
            </div>
        </div>
    );
};

export default StudyTab;