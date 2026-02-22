'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Rocket } from 'lucide-react';

interface SplashScreenProps {
    onFinish: () => void;
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
    const [isLaunching, setIsLaunching] = useState(false);

    useEffect(() => {
        // Sequence:
        // 0-2s: Idle/Engine startup (handled by animation prop)
        // 2s: Launch trigger
        // 3.5s: Finish callback (screen clear)

        const launchTimer = setTimeout(() => {
            setIsLaunching(true);
        }, 2000);

        const finishTimer = setTimeout(() => {
            onFinish();
        }, 3500);

        return () => {
            clearTimeout(launchTimer);
            clearTimeout(finishTimer);
        };
    }, [onFinish]);

    return (
        <motion.div
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white overflow-hidden"
            initial={{ opacity: 1 }}
            animate={isLaunching ? { opacity: 0, transition: { duration: 0.8, delay: 0.5 } } : { opacity: 1 }}
        >
            {/* Stars Background Effect (Simple CSS or SVG) */}
            <div className="absolute inset-0 opacity-20">
                {[...Array(20)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute bg-white rounded-full"
                        initial={{
                            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1000),
                            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1000),
                            width: Math.random() * 3,
                            height: Math.random() * 3,
                            opacity: Math.random(),
                        }}
                        animate={{
                            y: [null, 1000], // Move stars down to simulate upward movement
                        }}
                        transition={{
                            duration: Math.random() * 2 + 1,
                            repeat: Infinity,
                            ease: "linear",
                            delay: Math.random() * 2
                        }}
                    />
                ))}
            </div>

            <div className="relative flex flex-col items-center">
                {/* Launch Pad Glow */}
                {!isLaunching && (
                    <motion.div
                        className="absolute bottom-[-50px] w-64 h-32 bg-blue-500/10 rounded-full blur-3xl z-0"
                        animate={{ opacity: [0.5, 0.8, 0.5], scale: [1, 1.1, 1] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                )}

                {/* Rocket Container with Camera Shake during launch */}
                <motion.div
                    initial={{ y: 0, x: 0 }}
                    animate={
                        isLaunching
                            ? {
                                y: -1500,
                                x: [0, -5, 5, -5, 5, 0], // Aggressive shake on launch
                                transition: { y: { duration: 1.5, ease: [0.5, 0, 1, 1] }, x: { duration: 0.1, repeat: 10 } },
                            }
                            : {
                                y: [0, -4, 0], // Smooth idle float
                                x: [0, 0.5, -0.5, 0], // Subtle engine rumble
                                transition: {
                                    y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
                                    x: { duration: 0.05, repeat: Infinity }
                                }
                            }
                    }
                    className="relative z-10 flex flex-col items-center"
                >
                    {/* Highly Detailed 3D-styled SVG Rocket */}
                    <svg width="120" height="200" viewBox="0 0 120 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-2xl">
                        {/* Shadow underneath */}
                        <ellipse cx="60" cy="180" rx="30" ry="10" fill="rgba(0,0,0,0.5)" filter="blur(5px)" />

                        {/* Main Body with 3D Gradient */}
                        <defs>
                            <linearGradient id="bodyGrad" x1="20" y1="0" x2="100" y2="0">
                                <stop offset="0%" stopColor="#94A3B8" /> {/* Shadow side */}
                                <stop offset="30%" stopColor="#F8FAFC" /> {/* Highlight */}
                                <stop offset="100%" stopColor="#CBD5E1" /> {/* Standard */}
                            </linearGradient>
                            <linearGradient id="finGrad" x1="0" y1="0" x2="1" y2="0">
                                <stop offset="0%" stopColor="#B91C1C" />
                                <stop offset="100%" stopColor="#EF4444" />
                            </linearGradient>
                            <linearGradient id="windowGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#60A5FA" />
                                <stop offset="100%" stopColor="#1E3A8A" />
                            </linearGradient>
                        </defs>

                        {/* Fuselage */}
                        <path d="M60 10C35 10 25 50 25 120C25 140 35 160 40 170H80C85 160 95 140 95 120C95 50 85 10 60 10Z" fill="url(#bodyGrad)" />

                        {/* Nose Cone Tip */}
                        <path d="M60 0C55 0 50 5 45 20C55 25 65 25 75 20C70 5 65 0 60 0Z" fill="#334155" />

                        {/* Rivets/Texture Lines */}
                        <path d="M25 120C40 125 80 125 95 120" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
                        <path d="M25 80C40 85 80 85 95 80" stroke="#94A3B8" strokeWidth="2" />

                        {/* Main Window Frame & Glass */}
                        <circle cx="60" cy="55" r="18" fill="#1E293B" />
                        <circle cx="60" cy="55" r="14" fill="url(#windowGrad)" />
                        <path d="M52 47Q60 40 68 47" stroke="rgba(255,255,255,0.4)" strokeWidth="3" strokeLinecap="round" /> {/* Specular Highlight */}

                        {/* Auxiliary Window */}
                        <circle cx="60" cy="95" r="8" fill="#1E293B" />
                        <circle cx="60" cy="95" r="6" fill="url(#windowGrad)" />

                        {/* Wings / Fins */}
                        <path d="M25 100L5 160C5 170 15 175 25 175V140Z" fill="url(#finGrad)" /> {/* Left Fin */}
                        <path d="M95 100L115 160C115 170 105 175 95 175V140Z" fill="url(#finGrad)" /> {/* Right Fin */}

                        {/* Center Engine Thruster */}
                        <path d="M45 170H75V180C75 185 70 190 60 190C50 190 45 185 45 180V170Z" fill="#334155" />
                        <path d="M50 170H70V175C70 178 65 180 60 180C55 180 50 178 50 175V170Z" fill="#1E293B" />
                    </svg>

                    {/* Dynamic High-Energy Exhaust Flames */}
                    <div className="absolute top-[185px] w-full flex justify-center perspective-[500px]">
                        {/* Core White-Hot Flame */}
                        <motion.div
                            className="absolute w-6 bg-white rounded-full blur-[2px] z-20"
                            animate={isLaunching ? { height: [40, 80, 50], opacity: [1, 0.8, 1] } : { height: [15, 25, 15], opacity: [0.8, 1, 0.8] }}
                            transition={{ duration: 0.1, repeat: Infinity }}
                        />
                        {/* Inner Yellow Flame */}
                        <motion.div
                            className="absolute w-12 bg-yellow-300 rounded-full blur-[4px] z-10"
                            animate={isLaunching ? { height: [80, 140, 90], opacity: [1, 0.7, 1] } : { height: [30, 45, 30], opacity: [0.6, 0.9, 0.6] }}
                            transition={{ duration: 0.15, repeat: Infinity }}
                        />
                        {/* Outer Orange/Red Flame */}
                        <motion.div
                            className="absolute w-20 bg-orange-600 rounded-full blur-[8px] z-0"
                            animate={isLaunching ? { height: [120, 200, 140], opacity: [0.8, 1, 0.8], width: [80, 90, 80] } : { height: [50, 70, 50], opacity: [0.4, 0.7, 0.4] }}
                            transition={{ duration: 0.2, repeat: Infinity }}
                        />
                    </div>

                    {/* Launch Smoke Particles (Only active on launch) */}
                    {isLaunching && (
                        <div className="absolute top-[200px] w-full flex justify-center">
                            {[...Array(15)].map((_, i) => (
                                <motion.div
                                    key={i}
                                    className="absolute bg-slate-300/80 rounded-full blur-[10px]"
                                    initial={{ width: 40, height: 40, x: 0, y: 0, opacity: 0.8 }}
                                    animate={{
                                        width: [40, 150 + Math.random() * 100],
                                        height: [40, 150 + Math.random() * 100],
                                        x: (Math.random() - 0.5) * 300,
                                        y: Math.random() * 200,
                                        opacity: [0.8, 0]
                                    }}
                                    transition={{ duration: 1.5 + Math.random(), ease: "easeOut" }}
                                />
                            ))}
                        </div>
                    )}
                </motion.div>

                {/* Text Indicator */}
                <motion.div
                    className="mt-16 relative z-10"
                    initial={{ opacity: 0, y: 10 }}
                    animate={isLaunching ? { opacity: 0, y: 50, transition: { duration: 0.5 } } : { opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    <div className="px-6 py-2 bg-slate-900/50 backdrop-blur-md rounded-full border border-blue-500/30 flex items-center gap-3 shadow-[0_0_15px_rgba(59,130,246,0.3)] text-blue-300 font-mono tracking-widest text-sm">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
                        </span>
                        {isLaunching ? 'IGNICIÓN...' : 'INICIALIZANDO SISTEMAS'}
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
