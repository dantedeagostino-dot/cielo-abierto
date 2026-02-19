'use client';

import { useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, Expand, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for clsx/tailwind-merge

// --- Interfaces based on your lib files ---

interface ApodResponse {
    copyright?: string;
    date: string;
    explanation: string;
    hdurl?: string;
    media_type: 'image' | 'video';
    title: string;
    url: string;
}

interface MarsPhoto {
    id: number;
    img_src: string;
    camera: { full_name: string };
    earth_date: string;
}

interface EpicImage {
    identifier: string;
    image: string;
    file_url?: string;
    date: string;
    caption: string;
}

interface LibraryItem {
    href: string;
    data: {
        title: string;
        description: string;
        media_type: 'image' | 'video' | 'audio';
    }[];
    links?: {
        href: string;
        rel: string;
        render?: string;
    }[];
}

interface TechPortProject {
    id: string;
    title: string;
    description: string;
}

// --- Helper Components ---

function ImageCard({ src, alt, caption, date }: { src: string; alt: string; caption?: string; date?: string }) {
    return (
        <div className="rounded-xl overflow-hidden bg-black/20 border border-white/10 relative group">
            <div className="relative aspect-video w-full bg-slate-800">
                {/* Using standard img for external URLs to avoid domain config issues in Next.js Image, 
                 unless domains are configured in next.config.mjs */}
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                />
            </div>
            {(caption || date) && (
                <div className="p-3 bg-black/40 backdrop-blur-sm absolute bottom-0 w-full">
                    {caption && <p className="text-sm font-medium text-white truncate">{caption}</p>}
                    {date && <p className="text-xs text-white/60">{date}</p>}
                </div>
            )}
        </div>
    );
}

function ParametersGrid({ data }: { data: Record<string, any> }) {
    if (!data) return null;
    return (
        <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
            {Object.entries(data).map(([key, value]) => (
                <div key={key} className="flex flex-col">
                    <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="text-slate-200 truncate" title={String(value)}>{String(value)}</span>
                </div>
            ))}
        </div>
    );
}

// --- Main Component ---

export default function ToolResult({ toolName, result }: { toolName: string; result: any }) {
    if (!result || result.error) return null; // Errors are usually handled in text or ignored

    // 1. APOD
    if (toolName === 'getDataFromAPOD') {
        const data = result as ApodResponse;
        if (data.media_type === 'image') {
            return (
                <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                    <ImageCard src={data.url} alt={data.title} caption={data.title} date={data.date} />
                    <details className="text-xs text-slate-400 bg-slate-900/30 p-2 rounded cursor-pointer">
                        <summary>Explicación</summary>
                        <p className="mt-2 p-2">{data.explanation}</p>
                    </details>
                </div>
            );
        } else if (data.media_type === 'video') {
            return (
                <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                    <div className="aspect-video w-full rounded-xl overflow-hidden border border-white/10">
                        <iframe src={data.url} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
                    </div>
                    <p className="text-sm font-bold text-blue-200">{data.title}</p>
                </div>
            );
        }
    }

    // 2. Mars Photos
    if (toolName === 'getMarsPhotos') {
        const photos = result.photos as MarsPhoto[];
        if (!photos || photos.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron fotos.</div>;

        // Show max 4 photos
        const displayPhotos = photos.slice(0, 4);
        return (
            <div className="grid grid-cols-2 gap-2 my-2 w-full max-w-lg">
                {displayPhotos.map((photo) => (
                    <ImageCard
                        key={photo.id}
                        src={photo.img_src}
                        alt={`Mars Rover Photo ${photo.id}`}
                        caption={`${photo.camera.full_name}`}
                    />
                ))}
            </div>
        );
    }

    // 3. EPIC Images (Earth)
    if (toolName === 'getEPICImages') {
        const images = result as EpicImage[];
        if (!images || images.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron imágenes de EPIC.</div>;

        const displayImages = images.slice(0, 4);
        return (
            <div className="grid grid-cols-2 gap-2 my-2 w-full max-w-lg">
                {displayImages.map((img) => (
                    <ImageCard
                        key={img.identifier}
                        src={img.file_url || ''}
                        alt={img.caption}
                        caption={img.date}
                    />
                ))}
            </div>
        );
    }

    // 4. Image Library
    if (toolName === 'searchImageLibrary') {
        const items = result as LibraryItem[];
        if (!items || items.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron resultados en la librería.</div>;

        // Filter primarily for items that have an image link
        const validItems = items.filter(i => i.links && i.links.length > 0 && i.data && i.data.length > 0).slice(0, 4);

        return (
            <div className="grid grid-cols-2 gap-2 my-2 w-full max-w-lg">
                {validItems.map((item, idx) => {
                    const imgLink = item.links?.find(l => l.render === 'image' || l.href.endsWith('.jpg'))?.href || item.links?.[0]?.href;
                    if (!imgLink) return null;
                    return (
                        <ImageCard
                            key={idx}
                            src={imgLink}
                            alt={item.data[0].title}
                            caption={item.data[0].title}
                        />
                    );
                })}
            </div>
        );
    }

    // 5. TechPort
    if (toolName === 'searchTechProjects') {
        const projects = result.projects ? result.projects.projects : result; // Handle potential varying structure
        if (Array.isArray(projects)) {
            return (
                <div className="flex flex-col gap-2 my-2 w-full">
                    {projects.slice(0, 3).map((p: any) => (
                        <div key={p.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                            <h4 className="font-bold text-blue-300 text-sm">{p.title}</h4>
                            <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>
                        </div>
                    ))}
                </div>
            )
        }
    }

    // Fallback for data-heavy tools (NeoWs, EONET, etc.) - Just a quick summary JSON for now or nothing
    // The user really wants IMAGES, so for data tools, we might rely on the Assistant's text description 
    // unless we want to visualize charts (which is harder).

    // Debug for others
    // return (
    //     <details className="text-xs text-slate-500 my-2">
    //         <summary>Raw Data: {toolName}</summary>
    //         <pre className="p-2 bg-black/50 overflow-auto max-h-40 rounded">
    //             {JSON.stringify(result, null, 2)}
    //         </pre>
    //     </details>
    // );

    return null;
}
