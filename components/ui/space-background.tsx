'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';

// Generates stable random coordinates to avoid hydration mismatches
const generateStars = (count: number, size: number, opacity: number) => {
    return Array.from({ length: count }).map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size,
        opacity: opacity * (Math.random() * 0.5 + 0.5), // Variable opacity
    }));
};

export default function SpaceBackground() {
    // 3 Layers for Parallax depth
    const distantStars = useMemo(() => generateStars(100, 1, 0.3), []);
    const midStars = useMemo(() => generateStars(50, 2, 0.6), []);
    const nearStars = useMemo(() => generateStars(20, 3, 0.9), []);

    const renderLayer = (stars: any[], duration: number, direction: -1 | 1 = 1) => (
        <motion.div
            className="absolute inset-0"
            animate={{
                y: [direction === 1 ? '0%' : '-100%', direction === 1 ? '-100%' : '0%']
            }}
            transition={{
                duration,
                repeat: Infinity,
                ease: 'linear',
            }}
        >
            {/* Render two sets for seamless infinite scrolling */}
            <div className="absolute inset-0">
                {stars.map((star) => (
                    <div
                        key={star.id}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: star.size,
                            height: star.size,
                            opacity: star.opacity,
                            boxShadow: `0 0 ${star.size * 2}px ${star.size}px rgba(255,255,255,${star.opacity * 0.8})`
                        }}
                    />
                ))}
            </div>

            <div className="absolute inset-0" style={{ transform: 'translateY(100%)' }}>
                {stars.map((star) => (
                    <div
                        key={`clone-${star.id}`}
                        className="absolute rounded-full bg-white"
                        style={{
                            left: `${star.x}%`,
                            top: `${star.y}%`,
                            width: star.size,
                            height: star.size,
                            opacity: star.opacity,
                            boxShadow: `0 0 ${star.size * 2}px ${star.size}px rgba(255,255,255,${star.opacity * 0.8})`
                        }}
                    />
                ))}
            </div>
        </motion.div>
    );

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden bg-black bg-gradient-to-b from-slate-900 via-[#0a0f25] to-black">
            {/* Render layers with different speeds to create parallax 3D effect */}
            {renderLayer(distantStars, 120)}
            {renderLayer(midStars, 80)}
            {renderLayer(nearStars, 40)}

            {/* Subtle nebula gradients for extra depth */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(59,130,246,0.1),transparent_50%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(147,51,234,0.05),transparent_40%)]" />
        </div>
    );
}
