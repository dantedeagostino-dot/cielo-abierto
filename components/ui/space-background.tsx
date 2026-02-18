'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SpaceBackground() {
    const [stars, setStars] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

    useEffect(() => {
        // Generate random stars on client-side only to avoid hydration mismatch
        const newStars = Array.from({ length: 50 }).map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
        }));
        setStars(newStars);
    }, []);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-black bg-gradient-to-b from-slate-900 to-black">
            {stars.map((star) => (
                <motion.div
                    key={star.id}
                    className="absolute rounded-full bg-white opacity-70"
                    style={{
                        left: `${star.x}%`,
                        top: `${star.y}%`,
                        width: star.size,
                        height: star.size,
                    }}
                    animate={{
                        opacity: [0.2, 1, 0.2],
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: Math.random() * 3 + 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                    }}
                />
            ))}
            <div className="absolute inset-0 bg-[url('/noise.png')] opacity-5 mix-blend-overlay"></div>
        </div>
    );
}
