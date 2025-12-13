
import React, { useState, useEffect } from 'react';
import { GameBoard } from './GameBoard';
import { Shop } from './Shop';
import { CandyToken } from './CandyToken';
import { generateMathProblem, MathProblem } from '../services/engine';
import { playSound } from '../services/audio';
import { Button } from './Button';
import { ShoppingBag, ArrowLeft, Trophy, Play, Star, RotateCcw } from 'lucide-react';
import { ExamSession, ExamResult } from '../types';

interface Props {
  session: ExamSession; // Used for tracking final score
  onSubmit: (finalSession: ExamSession) => void;
  onExit: () => void;
}

export const GameScreen: React.FC<Props> = ({ session, onSubmit, onExit }) => {
    const [gameState, setGameState] = useState<'START' | 'PLAYING' | 'SHOP' | 'FINISHED'>('START');
    const [tokens, setTokens] = useState(() => parseInt(localStorage.getItem('kids_tokens') || '0'));
    const [unlocked, setUnlocked] = useState<string[]>(() => JSON.parse(localStorage.getItem('kids_unlocked') || '["theme_blue"]'));
    const [score, setScore] = useState(0);
    const [questionCount, setQuestionCount] = useState(0);
    const [problem, setProblem] = useState<MathProblem | null>(null);
    const [level, setLevel] = useState(1);
    const [streak, setStreak] = useState(0);

    // Save tokens whenever they change
    useEffect(() => {
        localStorage.setItem('kids_tokens', tokens.toString());
        localStorage.setItem('kids_unlocked', JSON.stringify(unlocked));
    }, [tokens, unlocked]);

    const startGame = () => {
        playSound('click');
        setScore(0);
        setQuestionCount(0);
        setStreak(0);
        setLevel(1);
        nextQuestion(1);
        setGameState('PLAYING');
    };

    const nextQuestion = (lvl: number) => {
        const p = generateMathProblem(lvl);
        setProblem(p);
    };

    const handleAnswer = (isCorrect: boolean) => {
        if (isCorrect) {
            const reward = 5 + (streak * 2);
            setTokens(prev => prev + reward);
            setScore(prev => prev + 10);
            setStreak(prev => prev + 1);
            
            if (streak > 2) setLevel(prev => Math.min(prev + 1, 12));
        } else {
            setStreak(0);
            setLevel(prev => Math.max(1, prev - 1));
        }

        setQuestionCount(prev => prev + 1);
        
        // Fixed set of 10 questions per round
        if (questionCount >= 9) {
            setTimeout(finishGame, 1000);
        } else {
            nextQuestion(level);
        }
    };

    const finishGame = () => {
        playSound('win');
        setGameState('FINISHED');
    };

    const handlePurchase = (cost: number, id: string) => {
        setTokens(prev => prev - cost);
        setUnlocked(prev => [...prev, id]);
    };

    if (gameState === 'SHOP') {
        return <Shop tokens={tokens} onPurchase={handlePurchase} unlockedItems={unlocked} onClose={() => setGameState('START')} />;
    }

    if (gameState === 'FINISHED') {
         return (
            <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in duration-300">
                <div className="bg-white/10 p-8 rounded-3xl backdrop-blur-md border-4 border-white/30 max-w-sm w-full">
                    <Trophy size={80} className="text-yellow-300 drop-shadow-lg mx-auto mb-4" />
                    <h2 className="text-4xl font-black mb-2">Awesome!</h2>
                    <p className="text-xl font-bold text-purple-200 mb-6">You finished the quiz!</p>
                    
                    <div className="bg-white/20 rounded-xl p-4 mb-6">
                        <p className="text-sm font-bold uppercase text-purple-200">Total Score</p>
                        <p className="text-5xl font-black">{score}</p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Button onClick={startGame} className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 border-none w-full py-4 text-xl font-black flex items-center justify-center gap-2">
                             <RotateCcw size={24}/> Play Again
                        </Button>
                        <Button onClick={() => setGameState('START')} variant="secondary" className="w-full py-3 bg-purple-500 hover:bg-purple-400 border-purple-400">
                             Main Menu
                        </Button>
                    </div>
                </div>
            </div>
         );
    }

    if (gameState === 'START') {
        return (
            <div className="min-h-screen bg-purple-600 flex flex-col items-center justify-center p-4 text-white relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                    <div className="absolute top-10 left-10 text-9xl">➕</div>
                    <div className="absolute bottom-20 right-10 text-9xl">➗</div>
                    <div className="absolute top-40 right-40 text-8xl">➖</div>
                </div>

                <div className="z-10 text-center space-y-8 animate-in zoom-in duration-500">
                    <div className="bg-white/20 p-8 rounded-full mb-4 backdrop-blur-sm border-4 border-white/30 inline-block">
                        <Star size={80} className="text-yellow-300 drop-shadow-lg" fill="currentColor" />
                    </div>
                    
                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter drop-shadow-xl">
                        MATH QUIZ
                    </h1>

                    <div className="bg-white/10 rounded-xl p-4 flex items-center justify-center gap-3 backdrop-blur-md">
                        <CandyToken size={32} />
                        <span className="text-3xl font-bold">{tokens} Tokens</span>
                    </div>

                    <div className="flex flex-col gap-4 w-full max-w-xs mx-auto">
                        <button 
                            onClick={startGame}
                            className="bg-yellow-400 hover:bg-yellow-300 text-yellow-900 text-2xl font-black py-6 rounded-2xl shadow-[0_6px_0_0_#b45309] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <Play fill="currentColor" /> PLAY NOW
                        </button>

                        <button 
                            onClick={() => setGameState('SHOP')}
                            className="bg-blue-500 hover:bg-blue-400 text-white text-xl font-bold py-4 rounded-2xl shadow-[0_6px_0_0_#1e3a8a] active:translate-y-1 active:shadow-none transition-all flex items-center justify-center gap-3"
                        >
                            <ShoppingBag /> STICKER SHOP
                        </button>
                        
                        <button 
                            onClick={onExit}
                            className="bg-transparent hover:bg-white/10 text-white text-lg font-bold py-2 rounded-xl transition-all"
                        >
                            Exit
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-purple-50 dark:bg-gray-900 flex flex-col font-sans">
            {/* Header */}
            <div className="p-4 flex justify-between items-center bg-white dark:bg-gray-800 shadow-sm border-b-4 border-purple-200 dark:border-purple-900">
                <button onClick={() => setGameState('START')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ArrowLeft className="text-gray-600 dark:text-gray-300" />
                </button>
                
                <div className="flex items-center gap-4">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-400 uppercase">Score</span>
                        <span className="text-2xl font-black text-purple-600">{score}</span>
                    </div>
                    <div className="bg-yellow-100 px-3 py-1 rounded-full flex items-center gap-2 border border-yellow-300">
                        <CandyToken size={20} />
                        <span className="font-bold text-yellow-800">{tokens}</span>
                    </div>
                </div>
            </div>

            {/* Game Area */}
            {problem && (
                <GameBoard 
                    problem={problem} 
                    onAnswer={handleAnswer} 
                    themeColor="border-purple-500"
                />
            )}

            {/* Progress Bar */}
            <div className="h-4 bg-gray-200 w-full">
                <div 
                    className="h-full bg-purple-500 transition-all duration-500" 
                    style={{ width: `${(questionCount / 10) * 100}%` }}
                ></div>
            </div>
        </div>
    );
};
