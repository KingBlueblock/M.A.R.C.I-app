


import React, { useState, useEffect } from 'react';
import { AvatarState } from '../types';
import { getFunFact, getEmojiRiddle, getEmojiFusion, getTicTacToeMove } from '../services/geminiService';
import { IconPuzzle, IconTicTacToe, IconLightbulb, IconAnime } from './Icons';
import { GoogleGenAI, Chat, Type } from "@google/genai";


interface GamesTabProps {
  setAvatarState: (state: AvatarState, duration?: number) => void;
}

// A centralized handler for API errors to provide user-friendly messages.
const handleApiError = (error: unknown, context: string): string => {
  console.error(`Error in ${context}:`, error);
  if (error instanceof Error) {
    if (error.message.includes('API_KEY')) {
      return "My core systems are reporting an authentication error. The API key might be invalid. Please alert the administrator.";
    }
    if (error.message.includes('429')) { // Too Many Requests
      return "I'm experiencing high traffic right now! Please wait a moment and try again.";
    }
     if (error.message.includes('SAFETY')) {
        return `My safety protocols were triggered for the ${context.toLowerCase()}. Please try a different prompt.`;
    }
    return `An unexpected issue occurred while ${context.toLowerCase()}: ${error.message}`;
  }
  return `An unknown error occurred while ${context.toLowerCase()}. Please try again.`;
};

const IconEmojiFusion = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21a6 6 0 00-9-5.197M15 21a6 6 0 01-9-5.197" />
    </svg>
);
const IconMovie = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" />
    </svg>
);
const Icon20Questions = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

// --- Individual Game Components ---

const FunFactGame: React.FC<GamesTabProps> = ({ setAvatarState }) => {
  const [funFact, setFunFact] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleGetFunFact = async () => {
    setIsLoading(true);
    setAvatarState(AvatarState.Thinking, 3000);
    try {
        const fact = await getFunFact();
        setFunFact(fact);
        setAvatarState(AvatarState.Happy, 2000);
    } catch (error: any) {
        setFunFact(error.message); // Display error in the same area
        setAvatarState(AvatarState.Idle);
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg text-center">
      <h3 className="text-xl font-bold text-[--accent-400] mb-4">Fun Fact Generator</h3>
      <button onClick={handleGetFunFact} disabled={isLoading} className="bg-[--accent-500] text-white px-6 py-3 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 font-semibold">
        {isLoading ? 'Thinking...' : 'Tell Me Something Cool!'}
      </button>
      {funFact && (
        <div className="mt-6 border-t border-gray-300 dark:border-white/10 pt-4 animate-fade-in">
          <p className="text-lg text-gray-700 dark:text-gray-200">{funFact}</p>
        </div>
      )}
    </div>
  );
};

const EmojiRiddleGame: React.FC<GamesTabProps> = ({ setAvatarState }) => {
    const [riddle, setRiddle] = useState<{riddle: string, answer: string} | null>(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGetRiddle = async () => {
        setIsLoading(true);
        setShowAnswer(false);
        setRiddle(null);
        setError(null);
        setAvatarState(AvatarState.Thinking, 3000);
        try {
            const newRiddle = await getEmojiRiddle();
            setRiddle(newRiddle);
            setAvatarState(AvatarState.Happy, 1500);
        } catch (err: any) {
            setError(err.message);
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg text-center">
             <h3 className="text-xl font-bold text-[--accent-400] mb-4">Emoji Riddle</h3>
            <button onClick={handleGetRiddle} disabled={isLoading} className="bg-[--accent-500] text-white px-6 py-3 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 font-semibold">
                {isLoading ? 'Puzzling...' : 'Give Me a Riddle!'}
            </button>
            {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
            {riddle && (
                <div className="mt-6 border-t border-gray-300 dark:border-white/10 pt-4 text-center animate-fade-in">
                    <p className="text-5xl tracking-widest my-4">{riddle.riddle}</p>
                    <button onClick={() => setShowAnswer(true)} disabled={showAnswer} className="text-sm text-[--accent-300] hover:underline disabled:text-gray-500 disabled:cursor-not-allowed">
                        {showAnswer ? 'The answer is...' : 'Reveal Answer'}
                    </button>
                    {showAnswer && <p className="text-2xl font-bold mt-2 animate-fade-in text-slate-800 dark:text-white">{riddle.answer}</p>}
                </div>
            )}
        </div>
    );
};

const EmojiFusionGame: React.FC<GamesTabProps> = ({ setAvatarState }) => {
    const [emoji1, setEmoji1] = useState('');
    const [emoji2, setEmoji2] = useState('');
    const [result, setResult] = useState<{ name: string, emoji: string, description: string } | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFusion = async () => {
        if (!emoji1 || !emoji2) return;
        setIsLoading(true);
        setResult(null);
        setError(null);
        setAvatarState(AvatarState.Thinking, 4000);
        try {
            const fusionResult = await getEmojiFusion(emoji1, emoji2);
            setResult(fusionResult);
            setAvatarState(AvatarState.Happy);
        } catch (err: any) {
            setError(err.message);
            setAvatarState(AvatarState.Idle);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold text-[--accent-400] mb-4">AI Emoji Fusion</h3>
            <div className="flex justify-center items-center gap-4 mb-4">
                <input type="text" value={emoji1} onChange={e => setEmoji1(e.target.value)} maxLength={2} className="w-20 h-20 text-5xl bg-black/20 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[--accent-400]" />
                <span className="text-4xl font-bold text-[--accent-300]">+</span>
                <input type="text" value={emoji2} onChange={e => setEmoji2(e.target.value)} maxLength={2} className="w-20 h-20 text-5xl bg-black/20 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-[--accent-400]" />
            </div>
             <button onClick={handleFusion} disabled={isLoading || !emoji1 || !emoji2} className="bg-[--accent-500] text-white px-6 py-3 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 font-semibold">
                {isLoading ? 'Fusing...' : 'Fuse Emojis!'}
            </button>
            {error && <p className="mt-4 text-red-400 text-center">{error}</p>}
            {result && (
                <div className="mt-6 border-t border-gray-300 dark:border-white/10 pt-4 text-center animate-fade-in">
                    <p className="text-6xl my-4">{result.emoji}</p>
                    <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{result.name}</h4>
                    <p className="text-gray-600 dark:text-gray-300 mt-2">{result.description}</p>
                </div>
            )}
        </div>
    );
};

const TicTacToeGame: React.FC<GamesTabProps> = ({ setAvatarState }) => {
    const [board, setBoard] = useState<(string | null)[]>(Array(9).fill(null));
    const [isPlayerTurn, setIsPlayerTurn] = useState(true);
    const [winner, setWinner] = useState<string | null>(null);
    const [isLoadingAI, setIsLoadingAI] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkWinner = (currentBoard: (string|null)[]) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        for (let line of lines) {
            const [a, b, c] = line;
            if (currentBoard[a] && currentBoard[a] === currentBoard[b] && currentBoard[a] === currentBoard[c]) {
                return currentBoard[a];
            }
        }
        if (currentBoard.every(square => square !== null)) return 'Draw';
        return null;
    };
    
    const handlePlayerMove = (index: number) => {
        if (!isPlayerTurn || board[index] || winner) return;
        setError(null);
        
        const newBoard = [...board];
        newBoard[index] = 'X';
        setBoard(newBoard);
        
        const newWinner = checkWinner(newBoard);
        if (newWinner) {
            setWinner(newWinner);
            if(newWinner === 'X') setAvatarState(AvatarState.Happy);
        } else {
            setIsPlayerTurn(false);
        }
    };
    
    useEffect(() => {
        if (!isPlayerTurn && !winner) {
            const makeAiMove = async () => {
                setIsLoadingAI(true);
                setAvatarState(AvatarState.Thinking);
                let move: number | null = null;
                try {
                    const response = await getTicTacToeMove(board);
                    if (response && board[response.move] === null) {
                        move = response.move;
                    }
                } catch (err: any) {
                    setError(err.message);
                }

                setIsLoadingAI(false);
                setAvatarState(AvatarState.Idle);
                
                // Fallback to random move if AI fails or provides invalid move
                if (move === null) {
                    const availableMoves = board.map((val, idx) => val === null ? idx : null).filter(val => val !== null);
                    if(availableMoves.length > 0) {
                        move = availableMoves[Math.floor(Math.random() * availableMoves.length)]!;
                    }
                }
                
                if (move !== null) {
                    const newBoard = [...board];
                    newBoard[move] = 'O';
                    setBoard(newBoard);
                    const newWinner = checkWinner(newBoard);
                    if (newWinner) {
                        setWinner(newWinner);
                    } else {
                        setIsPlayerTurn(true);
                    }
                } else {
                    // No moves left, should be a draw
                    setIsPlayerTurn(true);
                }
            };
            makeAiMove();
        }
    }, [isPlayerTurn, winner, board, setAvatarState]);
    
    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setWinner(null);
        setIsPlayerTurn(true);
        setError(null);
    };

    return (
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold text-[--accent-400] mb-2">Tic-Tac-Toe</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">You are X, Marci is O. Can you win?</p>
            <div className="grid grid-cols-3 gap-2 w-48 h-48 mx-auto">
                {board.map((val, i) => (
                    <button key={i} onClick={() => handlePlayerMove(i)} className="bg-black/20 rounded text-4xl font-bold flex items-center justify-center hover:bg-black/40 transition-colors disabled:cursor-not-allowed" disabled={!isPlayerTurn || !!val || !!winner}>
                       <span className={val === 'X' ? 'text-indigo-400' : 'text-cyan-400'}>{val}</span>
                    </button>
                ))}
            </div>
            <div className="mt-4 h-10">
                {error && <p className="text-red-400 text-xs">{error}</p>}
                {winner && (
                    <div className="animate-fade-in">
                        <p className="text-2xl font-bold text-slate-800 dark:text-white">{winner === 'Draw' ? "It's a Draw!" : `${winner} wins!`}</p>
                        <button onClick={resetGame} className="mt-2 text-sm text-[--accent-300] hover:underline">Play Again</button>
                    </div>
                )}
                {isLoadingAI && <p className="text-gray-500 dark:text-gray-400 animate-pulse">Marci is thinking...</p>}
            </div>
        </div>
    )
};

const MovieQuizGame: React.FC<GamesTabProps> = ({ setAvatarState }) => {
    const [quiz, setQuiz] = useState<{ plot: string; title: string } | null>(null);
    const [guess, setGuess] = useState('');
    const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const getNewQuiz = async () => {
        setIsLoading(true);
        setError('');
        setQuiz(null);
        setGuess('');
        setIsCorrect(null);
        setAvatarState(AvatarState.Thinking);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: 'Give me a single, clever, but slightly obscure plot summary of a popular movie. Provide the movie title separately.',
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            plot: { type: Type.STRING },
                            title: { type: Type.STRING }
                        }
                    }
                }
            });
            const data = JSON.parse(response.text);
            setQuiz(data);
        } catch (e: any) {
            setError(handleApiError(e, "getting a movie quiz"));
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.Idle);
        }
    };

    const handleGuess = () => {
        if (!quiz) return;
        const correct = guess.trim().toLowerCase() === quiz.title.toLowerCase();
        setIsCorrect(correct);
        if(correct) setAvatarState(AvatarState.Happy);
    };

    return (
        <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold text-[--accent-400] mb-4">Movie Plot Quiz</h3>
            <button onClick={getNewQuiz} disabled={isLoading} className="bg-[--accent-500] text-white px-6 py-3 rounded-lg hover:bg-[--accent-400] transition-colors disabled:bg-gray-600 font-semibold">
                {isLoading ? 'Finding a movie...' : 'New Movie Quiz'}
            </button>
            {error && <p className="mt-4 text-red-400">{error}</p>}
            {quiz && (
                <div className="mt-4 animate-fade-in">
                    <p className="italic text-gray-600 dark:text-gray-300">"{quiz.plot}"</p>
                    <div className="flex gap-2 mt-4 max-w-sm mx-auto">
                        <input type="text" value={guess} onChange={e => setGuess(e.target.value)} placeholder="What movie is this?" className="w-full bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-white/20 border rounded px-3 py-2 focus:outline-none focus:ring-1 focus:ring-[--accent-400]" />
                        <button onClick={handleGuess} className="bg-indigo-500 text-white px-4 rounded">Guess</button>
                    </div>
                    {isCorrect === true && <p className="mt-2 font-bold text-green-400">Correct! It was {quiz.title}!</p>}
                    {isCorrect === false && <p className="mt-2 font-bold text-red-400">Not quite! The answer was {quiz.title}.</p>}
                </div>
            )}
        </div>
    );
};

const TwentyQuestionsGame: React.FC<GamesTabProps> = ({ setAvatarState }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [history, setHistory] = useState<{sender: 'user' | 'ai', text: string}[]>([]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);

    const startNewGame = () => {
        setIsLoading(true);
        setError('');
        setHistory([]);
        setIsGameOver(false);
        setAvatarState(AvatarState.Thinking);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
            const chatInstance = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: {
                    systemInstruction: `You are the game master for a game of 20 Questions. You have thought of a common object, animal, or concept. Do not reveal what you've thought of. The user will ask yes/no questions to guess it. Keep track of the number of questions. Only answer with "Yes.", "No.", "Sometimes.", or "I cannot answer that." If they guess correctly, congratulate them and state "YOU WIN!". If they run out of questions (20 questions), reveal the answer and state "GAME OVER". Your first message should be "I have thought of something. You have 20 questions. What is your first question?".`
                }
            });
            setChat(chatInstance);
            
            // Get the initial message from the AI
            chatInstance.sendMessage({ message: "Start" }).then(response => {
// Fix: Use 'as const' to ensure the 'sender' property is typed as a literal, not a generic string.
                setHistory([{ sender: 'ai' as const, text: response.text }]);
            });
        } catch (e: any) {
            setError(handleApiError(e, "starting 20 Questions"));
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.Idle);
        }
    };
    
    useEffect(() => {
        startNewGame();
    }, []);

    const handleSend = async () => {
        if (!userInput.trim() || !chat || isLoading || isGameOver) return;
        
// Fix: Use 'as const' to ensure the 'sender' property is typed as a literal, not a generic string.
        const newHistory = [...history, { sender: 'user' as const, text: userInput }];
        setHistory(newHistory);
        setUserInput('');
        setIsLoading(true);
        setAvatarState(AvatarState.Thinking);
        
        try {
            const response = await chat.sendMessage({ message: userInput });
            const aiText = response.text;
            if (aiText.includes("YOU WIN!") || aiText.includes("GAME OVER")) {
                setIsGameOver(true);
            }
// Fix: Use 'as const' to ensure the 'sender' property is typed as a literal, not a generic string.
            setHistory([...newHistory, { sender: 'ai' as const, text: aiText }]);
        } catch (e: any) {
            setError(handleApiError(e, "playing 20 Questions"));
        } finally {
            setIsLoading(false);
            setAvatarState(AvatarState.Idle);
        }
    };
    
    return (
         <div className="bg-black/5 dark:bg-white/5 p-6 rounded-lg">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-[--accent-400]">20 Questions</h3>
                <button onClick={startNewGame} className="bg-[--accent-500] text-white px-4 py-1 rounded-lg text-sm">New Game</button>
            </div>
            <div className="h-64 bg-black/10 dark:bg-black/20 p-2 rounded overflow-y-auto space-y-2 flex flex-col-reverse">
                {history.slice().reverse().map((msg, i) => (
                    <p key={i} className={`p-2 rounded-lg max-w-[80%] ${msg.sender === 'ai' ? 'bg-slate-600 self-start' : 'bg-indigo-600 self-end'}`}>{msg.text}</p>
                ))}
            </div>
            {error && <p className="mt-2 text-red-400">{error}</p>}
            <div className="flex gap-2 mt-2">
                <input type="text" value={userInput} onChange={e => setUserInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleSend()} disabled={isLoading || isGameOver} placeholder={isGameOver ? "Game Over!" : "Ask a question or make a guess..."} className="w-full bg-gray-200 dark:bg-gray-900/50 border-gray-300 dark:border-white/20 border rounded px-3 py-2"/>
                <button onClick={handleSend} disabled={isLoading || isGameOver} className="bg-indigo-500 text-white px-4 rounded">Send</button>
            </div>
        </div>
    );
};


// --- Main GamesTab Component ---

const GAMES = {
  'fact': { name: 'Fun Facts', icon: IconLightbulb, component: FunFactGame },
  'riddle': { name: 'Emoji Riddle', icon: IconPuzzle, component: EmojiRiddleGame },
  'fusion': { name: 'Emoji Fusion', icon: IconEmojiFusion, component: EmojiFusionGame },
  'tictactoe': { name: 'Tic-Tac-Toe', icon: IconTicTacToe, component: TicTacToeGame },
  'moviequiz': { name: 'Movie Quiz', icon: IconMovie, component: MovieQuizGame },
  '20q': { name: '20 Questions', icon: Icon20Questions, component: TwentyQuestionsGame },
};
type GameId = keyof typeof GAMES;

const GamesTab: React.FC<GamesTabProps> = ({ setAvatarState }) => {
  const [activeGame, setActiveGame] = useState<GameId | null>(null);

  const renderActiveGame = () => {
    if (!activeGame) return null;
    const GameComponent = GAMES[activeGame].component;
    return (
        <div className="animate-fade-in">
            <button onClick={() => setActiveGame(null)} className="mb-4 text-sm text-[--accent-300] hover:underline">&larr; Back to Game Select</button>
            <GameComponent setAvatarState={setAvatarState} />
        </div>
    );
  };
  
  const renderGameSelect = () => (
    <div>
        <h2 className="text-2xl font-orbitron text-[--accent-300] mb-2">Game Center</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Choose a game to play with me!</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {Object.entries(GAMES).map(([id, { name, icon: Icon }]) => (
                <button 
                    key={id}
                    onClick={() => setActiveGame(id as GameId)}
                    className="bg-black/5 dark:bg-white/5 p-4 rounded-lg flex flex-col items-center justify-center text-center hover:bg-black/10 dark:hover:bg-white/10 hover:scale-105 transition-all"
                >
                    <div className="text-[--accent-400] mb-2"><Icon /></div>
                    <p className="font-semibold text-slate-800 dark:text-white">{name}</p>
                </button>
            ))}
        </div>
    </div>
  );

  return (
    <div className="h-full w-full">
        {activeGame ? renderActiveGame() : renderGameSelect()}
    </div>
  );
};

export default GamesTab;