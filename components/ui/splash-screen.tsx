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
                {/* Rocket Container */}
                <motion.div
                    initial={{ y: 0, x: 0 }}
                    animate={
                        isLaunching
                            ? {
                                y: -1000,
                                transition: { duration: 1.5, ease: "easeIn" },
                            }
                            : {
                                y: [0, -5, 0], // Hover/Idle effect
                                x: [0, 1, -1, 0], // Subtle vibration
                                transition: {
                                    y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                                    x: { duration: 0.1, repeat: Infinity } // Engine rumble
                                }
                            }
                    }
                    className="relative z-10"
                >
                    {/* Custom Rocket SVG for better verification than Lucide icon */}
                    <svg
                        width="100"
                        height="180"
                        viewBox="0 0 100 180"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        {/* Rocket Body */}
                        <path
                            d="M50 0C30 0 15 30 15 60V100C15 110 50 130 50 130C50 130 85 110 85 100V60C85 30 70 0 50 0Z"
                            fill="#E2E8F0" // Slate-200
                        />
                        {/* Window */}
                        <circle cx="50" cy="50" r="15" fill="#3B82F6" stroke="#1E293B" strokeWidth="4" />
                        {/* Fins */}
                        <path d="M15 90L0 130H30L15 90Z" fill="#EF4444" /> {/* Left Fin - Red */}
                        <path d="M85 90L100 130H70L85 90Z" fill="#EF4444" /> {/* Right Fin - Red */}
                        <path d="M40 100H60V130H40V100Z" fill="#475569" /> {/* Center Engine */}
                    </svg>

                    {/* Flame - Only visible when launching or aggressive idling */}
                    <motion.div
                        className="absolute top-[125px] left-1/2 -translate-x-1/2 w-10 origin-top"
                        animate={
                            isLaunching
                                ? { scaleY: [1, 2, 1.5], opacity: [0.8, 1, 0.8] }
                                : { scaleY: [0.5, 0.8, 0.5], opacity: [0.5, 0.8, 0.5] }
                        }
                        transition={{ duration: 0.1, repeat: Infinity }}
                    >
                        <svg width="40" height="80" viewBox="0 0 40 80" fill="none">
                            <path d="M20 80C20 80 0 30 10 0H30C40 30 20 80 20 80Z" fill="#F59E0B" /> {/* Orange Flame */}
                            <path d="M20 60C20 60 10 30 15 0H25C30 30 20 60 20 60Z" fill="#EF4444" /> {/* Red Core */}
                        </svg>
                    </motion.div>
                </motion.div>

                {/* Text */}
                <motion.div
                    className="mt-12 font-mono text-blue-400 text-lg tracking-widest"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                >
                    CONECTANDO CON NASA...
                </motion.div>
            </div>
        </motion.div>
    );
}
