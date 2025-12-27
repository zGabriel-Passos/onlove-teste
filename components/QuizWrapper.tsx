'use client';
import { useState } from 'react';

export default function QuizWrapper({ quiz, themeColor, couple, children }: any) {
    const [step, setStep] = useState(0);
    const [input, setInput] = useState("");
    const [completed, setCompleted] = useState(false);

    const checkAnswer = () => {
        if (input.toLowerCase().trim() === quiz[step].resposta.toLowerCase().trim()) {
            if (step + 1 < quiz.length) {
                setStep(step + 1);
                setInput("");
            } else {
                setCompleted(true);
            }
        } else {
            alert("Resposta errada! Tente novamente ❤️");
        }
    };

    if (completed) return <>{children}</>;

    return (
        <div className="p-8 text-center space-y-6 animate-in fade-in duration-500">
            <div className="w-20 h-20 bg-pink-100 rounded-full flex items-center justify-center mx-auto text-3xl">
                🔒
            </div>
            <h2 className="text-xl font-bold" style={{ color: themeColor }}>
                Prove que você é o amor de {couple.split('&')[0]}!
            </h2>
            <div className="space-y-4">
                <p className="text-gray-600 font-medium">{quiz[step].pergunta}</p>
                <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    className="w-full p-4 bg-gray-50 rounded-2xl border-2 outline-none transition-all focus:border-pink-400 text-black"
                    placeholder="Sua resposta..."
                    onKeyDown={(e) => e.key === 'Enter' && checkAnswer()}
                />
                <button
                    onClick={checkAnswer}
                    className="w-full py-4 rounded-2xl text-white font-bold shadow-lg"
                    style={{ backgroundColor: themeColor }}
                >
                    Próxima Pergunta
                </button>
            </div>
            <p className="text-xs text-gray-400">Pergunta {step + 1} de {quiz.length}</p>
        </div>
    );
}