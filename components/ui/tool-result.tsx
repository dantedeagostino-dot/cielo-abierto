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
    if (!result) return null;

    if (result.error) {
        return (
            <div className="p-3 my-2 bg-red-900/20 border border-red-500/50 rounded-lg text-red-200 text-xs font-mono">
                <strong>Error en {toolName}:</strong> {result.error}
            </div>
        );
    }

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

    // 6. NeoWs - Asteroids
    if (toolName === 'getAsteroidFeed') {
        const neos = result.near_earth_objects;
        if (!neos) return <div className="text-xs text-slate-500 italic">No se encontraron asteroides.</div>;

        const allAsteroids = Object.values(neos).flat() as any[];
        const display = allAsteroids.slice(0, 6);

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                <p className="text-xs text-slate-400 font-mono">☄️ {allAsteroids.length} objetos cercanos encontrados</p>
                {display.map((neo: any) => {
                    const hazardous = neo.is_potentially_hazardous_asteroid;
                    const diamMin = neo.estimated_diameter?.kilometers?.estimated_diameter_min?.toFixed(3);
                    const diamMax = neo.estimated_diameter?.kilometers?.estimated_diameter_max?.toFixed(3);
                    const approach = neo.close_approach_data?.[0];
                    return (
                        <div key={neo.id} className={cn(
                            "p-3 rounded-lg border text-sm",
                            hazardous
                                ? "bg-red-900/20 border-red-500/40"
                                : "bg-slate-800/50 border-slate-700/50"
                        )}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={cn("text-lg", hazardous ? "text-red-400" : "text-green-400")}>
                                    {hazardous ? '🔴' : '🟢'}
                                </span>
                                <span className="font-bold text-white text-xs">{neo.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-1 text-xs text-slate-300">
                                <span>⌀ {diamMin} – {diamMax} km</span>
                                {approach && <span>📏 {parseFloat(approach.miss_distance?.lunar || 0).toFixed(1)} dist. lunares</span>}
                                {approach && <span>🚀 {parseFloat(approach.relative_velocity?.kilometers_per_hour || 0).toLocaleString()} km/h</span>}
                                {approach && <span>📅 {approach.close_approach_date}</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 7. EONET - Natural Events
    if (toolName === 'getNaturalEvents') {
        const events = result as any[];
        if (!events || events.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron eventos naturales activos.</div>;

        const categoryIcons: Record<string, string> = {
            wildfires: '🔥', severeStorms: '🌪️', volcanoes: '🌋', seaLakeIce: '🧊',
            earthquakes: '🫨', floods: '🌊', landslides: '⛰️', snow: '❄️',
        };

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                {events.slice(0, 5).map((event: any) => {
                    const catId = event.categories?.[0]?.id || '';
                    const icon = categoryIcons[catId] || '🌍';
                    const geo = event.geometry?.[event.geometry.length - 1];
                    return (
                        <div key={event.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{icon}</span>
                                <span className="font-bold text-white text-sm">{event.title}</span>
                            </div>
                            <div className="flex gap-3 text-xs text-slate-400">
                                <span>📍 {event.categories?.[0]?.title || 'Evento'}</span>
                                {geo && <span>📅 {new Date(geo.date).toLocaleDateString('es-AR')}</span>}
                                {geo?.coordinates && <span>🌐 {geo.coordinates[1]?.toFixed(2)}°, {geo.coordinates[0]?.toFixed(2)}°</span>}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    // 8. CMR - Earth Science Data
    if (toolName === 'searchEarthDataCollections') {
        const collections = result as any[];
        if (!collections || collections.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron colecciones de datos.</div>;

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                {collections.slice(0, 5).map((col: any) => (
                    <div key={col.id} className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50">
                        <h4 className="font-bold text-blue-300 text-sm mb-1">🛰️ {col.title}</h4>
                        <p className="text-xs text-slate-400 line-clamp-2">{col.summary}</p>
                        {col.archive_center && (
                            <span className="text-[10px] text-slate-500 mt-1 block">📦 {col.archive_center}</span>
                        )}
                    </div>
                ))}
            </div>
        );
    }

    // 9. DONKI - Space Weather
    if (toolName === 'getSpaceWeather') {
        const events = result as any[];
        if (!events || events.length === 0) return <div className="text-xs text-slate-500 italic">No se detectaron eventos de clima espacial recientes.</div>;

        const typeColors: Record<string, string> = {
            CME: 'border-orange-500/40 bg-orange-900/20',
            GST: 'border-purple-500/40 bg-purple-900/20',
            FLR: 'border-yellow-500/40 bg-yellow-900/20',
        };

        const typeIcons: Record<string, string> = { CME: '☀️', GST: '🧲', FLR: '⚡' };

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                <p className="text-xs text-slate-400 font-mono">🌞 {events.length} evento(s) de clima espacial</p>
                {events.slice(0, 5).map((event: any, idx: number) => {
                    const eventType = event.activityID?.split('-')?.[3] || event.gstID ? 'GST' : event.flrID ? 'FLR' : 'CME';
                    const icon = typeIcons[eventType] || '☀️';
                    const colorClass = typeColors[eventType] || 'border-slate-700/50 bg-slate-800/50';
                    const startTime = event.startTime || event.beginTime || event.time21_5;

                    return (
                        <div key={event.activityID || event.gstID || event.flrID || idx} className={cn("p-3 rounded-lg border", colorClass)}>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-lg">{icon}</span>
                                <span className="font-bold text-white text-xs">{event.activityID || event.gstID || event.flrID || 'Evento Solar'}</span>
                            </div>
                            {startTime && <p className="text-xs text-slate-300">📅 {new Date(startTime).toLocaleString('es-AR')}</p>}
                            {event.note && <p className="text-xs text-slate-400 mt-1 line-clamp-2">{event.note}</p>}
                        </div>
                    );
                })}
            </div>
        );
    }

    // 10. Exoplanets
    if (toolName === 'queryExoplanets') {
        const planets = result as any[];
        if (!planets || planets.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron exoplanetas.</div>;

        return (
            <div className="my-2 w-full max-w-lg overflow-x-auto">
                <table className="w-full text-xs text-slate-300 border-collapse">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400">
                            <th className="text-left p-2">🪐 Planeta</th>
                            <th className="text-left p-2">⭐ Estrella</th>
                            <th className="text-left p-2">📡 Método</th>
                            <th className="text-right p-2">📅 Año</th>
                            <th className="text-right p-2">📏 Radio (R⊕)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {planets.slice(0, 10).map((p: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                                <td className="p-2 font-bold text-blue-300">{p.pl_name}</td>
                                <td className="p-2">{p.hostname}</td>
                                <td className="p-2">{p.discoverymethod}</td>
                                <td className="p-2 text-right">{p.disc_year}</td>
                                <td className="p-2 text-right">{p.pl_rade?.toFixed(2) || '—'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    // 11. TLE - Satellites
    if (toolName === 'getSatelliteTLE') {
        const members = result?.member || (Array.isArray(result) ? result : [result]);
        if (!members || members.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron datos de satélite.</div>;

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                {members.slice(0, 3).map((sat: any, idx: number) => (
                    <div key={sat.satelliteId || idx} className="p-3 bg-slate-800/50 rounded-lg border border-cyan-500/30">
                        <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg">🛰️</span>
                            <span className="font-bold text-cyan-300 text-sm">{sat.name || 'Satélite'}</span>
                            {sat.satelliteId && <span className="text-[10px] text-slate-500">ID: {sat.satelliteId}</span>}
                        </div>
                        {sat.date && <p className="text-xs text-slate-400 mb-2">📅 Actualizado: {new Date(sat.date).toLocaleString('es-AR')}</p>}
                        <div className="font-mono text-[10px] text-green-400 bg-black/40 p-2 rounded space-y-0.5 overflow-x-auto">
                            {sat.line1 && <div>{sat.line1}</div>}
                            {sat.line2 && <div>{sat.line2}</div>}
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 12. InSight - Mars Weather (likely deprecated/empty)
    if (toolName === 'getMarsWeather') {
        const weatherData = result as any[];
        if (!weatherData || weatherData.length === 0) {
            return (
                <div className="p-3 my-2 bg-amber-900/20 border border-amber-500/40 rounded-lg text-amber-200 text-xs max-w-lg">
                    <span className="font-bold">⚠️ Misión InSight finalizada:</span> La misión InSight de la NASA terminó en diciembre de 2022. Los datos meteorológicos de Marte ya no se actualizan.
                </div>
            );
        }

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                {weatherData.slice(0, 5).map((w: any) => (
                    <div key={w.sol} className="p-3 bg-red-900/10 rounded-lg border border-red-500/20">
                        <span className="font-bold text-red-300 text-sm">Sol {w.sol}</span>
                        <span className="text-xs text-slate-400 ml-2">{w.season}</span>
                        <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-slate-300">
                            <span>🌡️ {w.min_temp?.toFixed(1)}° / {w.max_temp?.toFixed(1)}°C</span>
                            <span>💨 {w.wind_speed?.toFixed(1)} m/s</span>
                            <span>🔵 {w.pressure?.toFixed(0)} Pa</span>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    // 13. TechTransfer - Patents
    if (toolName === 'searchPatents') {
        const patents = result as any[];
        if (!patents || patents.length === 0) return <div className="text-xs text-slate-500 italic">No se encontraron patentes.</div>;

        return (
            <div className="flex flex-col gap-2 my-2 w-full max-w-lg">
                {patents.slice(0, 5).map((p: any, idx: number) => (
                    <div key={p.id || idx} className="p-3 bg-slate-800/50 rounded-lg border border-emerald-500/30">
                        <h4 className="font-bold text-emerald-300 text-sm mb-1">📜 {p.title || 'Patente'}</h4>
                        {p.description && <p className="text-xs text-slate-400 line-clamp-2">{p.description}</p>}
                        {p.type && <span className="text-[10px] text-slate-500 mt-1 block">Tipo: {p.type}</span>}
                    </div>
                ))}
            </div>
        );
    }

    // Generic Fallback — collapsible JSON view
    return (
        <details className="text-xs text-slate-500 my-2 max-w-lg">
            <summary className="cursor-pointer hover:text-slate-300 transition-colors">
                📋 Datos de {toolName}
            </summary>
            <pre className="p-3 mt-1 bg-black/50 overflow-auto max-h-40 rounded-lg border border-slate-700/50 text-slate-400 text-[10px]">
                {JSON.stringify(result, null, 2)}
            </pre>
        </details>
    );
}
