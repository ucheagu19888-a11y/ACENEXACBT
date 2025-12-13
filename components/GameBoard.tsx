
import React from 'react';
import { MathProblem } from '../services/engine';
import { playSound } from '../services/audio';
import { Check, X } from 'lucide-react';

interface Props {
    problem: MathProblem;
    onAnswer: (isCorrect: boolean) => void;
    themeColor: string;
}

export const GameBoard: React.FC<Props> = ({ problem, onAnswer, themeColor }) => {
    const [selected, setSelected] = React.useState<string | null>(null);
    const [processed, setProcessed] = React.useState(false);

    // Reset when problem changes
    React.useEffect(() => {
        setSelected(null);
        setProcessed(false);
    }, [problem]);

    const handleSelect = (opt: string) => {
        if (processed) return;
        
        setSelected(opt);
        setProcessed(true);
        const isCorrect = opt === problem.answer;
        
        if (isCorrect) playSound('correct');
        else playSound('wrong');

        setTimeout(() => {
            onAnswer(isCorrect);
        }, 1000); // 1s delay to show animation
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
            {/* Question Card */}
            <div className={`bg-white dark:bg-gray-800 rounded-3xl shadow-[0_10px_0_0_rgba(0,0,0,0.1)] border-4 ${themeColor} p-8 md:p-12 mb-8 w-full max-w-lg text-center transform transition-all hover:scale-[1.02]`}>
                <h2 className="text-5xl md:text-7xl font-black text-gray-800 dark:text-white tracking-wider font-mono">
                    {problem.text}
                </h2>
            </div>

            {/* Options Grid */}
            <div className="grid grid-cols-2 gap-4 w-full max-w-lg">
                {problem.options.map((opt, idx) => {
                    const isSelected = selected === opt;
                    const isCorrect = opt === problem.answer;
                    
                    let bgClass = "bg-blue-100 hover:bg-blue-200 text-blue-900 border-blue-300";
                    let shadowClass = "shadow-[0_6px_0_0_#93c5fd]";
                    
                    if (processed) {
                        if (isCorrect) {
                            bgClass = "bg-green-500 text-white border-green-600";
                            shadowClass = "shadow-[0_6px_0_0_#15803d]";
                        } else if (isSelected && !isCorrect) {
                            bgClass = "bg-red-500 text-white border-red-600";
                            shadowClass = "shadow-[0_6px_0_0_#b91c1c]";
                        } else {
                            bgClass = "bg-gray-100 text-gray-400 opacity-50";
                            shadowClass = "shadow-none";
                        }
                    }

                    return (
                        <button
                            key={idx}
                            onClick={() => handleSelect(opt)}
                            disabled={processed}
                            className={`
                                h-24 md:h-32 text-3xl md:text-4xl font-bold rounded-2xl border-b-4 transition-all transform active:translate-y-1 active:shadow-none
                                flex items-center justify-center relative
                                ${bgClass} ${shadowClass}
                            `}
                        >
                            {opt}
                            {processed && isCorrect && <Check size={32} className="absolute top-2 right-2 text-white/50" />}
                            {processed && isSelected && !isCorrect && <X size={32} className="absolute top-2 right-2 text-white/50" />}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};
