import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';
import { getAPOD } from '@/lib/nasa/apod';
import { getNeoFeed } from '@/lib/nasa/neows';
import { getMarsRoverPhotos } from '@/lib/nasa/mars';
import { searchEarthData } from '@/lib/nasa/cmr';
import { getEPICImages } from '@/lib/nasa/epic';
import { getNaturalEvents } from '@/lib/nasa/eonet';
import { searchImageLibrary } from '@/lib/nasa/library';
import { getSpaceWeather } from '@/lib/nasa/donki';
import { queryExoplanets } from '@/lib/nasa/exoplanet';
import { searchTechProjects } from '@/lib/nasa/techport';
import { getSatelliteTLE } from '@/lib/nasa/tle';
import { getMarsWeather } from '@/lib/nasa/insight';
import { searchPatents } from '@/lib/nasa/techtransfer';
import { format } from 'date-fns';

export const maxDuration = 60; // Allow longer timeouts for API calls

export async function POST(req: Request) {
    const { messages } = await req.json();

    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        return new Response('Missing GOOGLE_API_KEY environment variable', { status: 500 });
    }

    const coreMessages: any[] = [];
    for (const m of messages) {
        if (m.role === 'user' || m.role === 'system') {
            coreMessages.push({ role: m.role, content: m.content });
        } else if (m.role === 'assistant') {
            const content: any[] = [];
            if (m.content) content.push({ type: 'text', text: m.content });

            if (m.toolInvocations) {
                for (const t of m.toolInvocations) {
                    content.push({
                        type: 'tool-call',
                        toolCallId: t.toolCallId,
                        toolName: t.toolName,
                        args: t.args
                    });
                }
            }
            coreMessages.push({ role: 'assistant', content });

            // Handle tool results which are separate messages in CoreMessage format
            if (m.toolInvocations) {
                const toolResults: any[] = [];
                for (const t of m.toolInvocations) {
                    if ('result' in t) {
                        toolResults.push({
                            type: 'tool-result',
                            toolCallId: t.toolCallId,
                            toolName: t.toolName,
                            result: t.result
                        });
                    }
                }
                if (toolResults.length > 0) {
                    coreMessages.push({ role: 'tool', content: toolResults });
                }
            }
        }
    }

    const google = createGoogleGenerativeAI({
        apiKey: process.env.GOOGLE_API_KEY,
    });

    const result = await streamText({
        model: google('gemini-2.5-flash'),
        messages: coreMessages,
        system: `You are 'Cielo Abierto', an intelligent assistant dedicated to democratizing NASA's scientific data.
    You have access to real-time tools to fetch data about:
    - Astronomy Picture of the Day (APOD)
    - Near Earth Objects (Asteroids) and their approach data.
    - Mars Rover Photos (Curiosity, Opportunity, Spirit, Perseverance).
    - Earth Science Data Collections (via CMR).
    - Earth Polychromatic Imaging Camera (EPIC) - Blue Marble images.
    - Earth Natural Events (EONET) - Wildfires, storms, volcanoes.
    - NASA Image and Video Library - General space media.
    - Space Weather (DONKI) - CMEs, Geomagnetic Storms.
    - Exoplanets - Confirmed planets and their data.
    - NASA Technology Projects (TechPort).
    - Satellite Tracking (TLE).
    - Mars Weather (InSight) - Elysium Planitia reports.
    - NASA Patents and Software (TechTransfer).
    
    When a user asks for information, select the most appropriate tool.
    Always provide context about the data you retrieve.
    If the user asks for "today's picture", use the APOD tool.
    For Mars photos, if no camera is specified, find a diverse set. Sol defaults to 1000 if not specified.
    
    Format your responses in Markdown. use clear headings and bullet points.`,
        maxSteps: 10,

        tools: {
            getDataFromAPOD: tool({
                description: 'Get the Astronomy Picture of the Day (Image or Video) and its explanation.',
                parameters: z.object({
                    date: z.string().optional().describe('The date in YYYY-MM-DD format. Defaults to today if not provided.'),
                }),
                execute: async ({ date }: any) => {
                    try {
                        return await getAPOD(date);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getAsteroidFeed: tool({
                description: 'Get a list of asteroids approaching Earth within a date range.',
                parameters: z.object({
                    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
                    endDate: z.string().describe('End date in YYYY-MM-DD format. Must be within 7 days of startDate.'),
                }),
                execute: async ({ startDate, endDate }: any) => {
                    try {
                        return await getNeoFeed(startDate, endDate);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getMarsPhotos: tool({
                description: 'Get photos from Mars Rovers (Curiosity, Opportunity, Spirit, Perseverance).',
                parameters: z.object({
                    rover: z.enum(['curiosity', 'opportunity', 'spirit', 'perseverance']).describe('The name of the rover'),
                    sol: z.number().optional().default(1000).describe('The Martian Sol (day) to fetch photos from.'),
                    camera: z.enum(['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM', 'PANCAM', 'MINITES']).optional().describe('Specific camera to filter by'),
                }),
                execute: async ({ rover, sol, camera }: any) => {
                    try {
                        return await getMarsRoverPhotos(rover, sol, camera);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            searchEarthDataCollections: tool({
                description: 'Search for Earth Science data collections in the Common Metadata Repository (CMR).',
                parameters: z.object({
                    keyword: z.string().describe('Search keyword (e.g., "temperature", "precipitation", "ozone")'),
                    limit: z.number().optional().default(5).describe('Number of results to return'),
                }),
                execute: async ({ keyword, limit }: any) => {
                    try {
                        return await searchEarthData(keyword, limit);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getEPICImages: tool({
                description: 'Get recent images of Earth from the DSCOVR satellite (EPIC camera).',
                parameters: z.object({}),
                execute: async () => {
                    try {
                        return await getEPICImages();
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getNaturalEvents: tool({
                description: 'Get real-time natural events (wildfires, storms, volcanoes) from EONET.',
                parameters: z.object({
                    limit: z.number().optional().default(5).describe('Number of events to return'),
                    category: z.string().optional().describe('Category of event (e.g., "wildfires", "severeStorms")'),
                }),
                execute: async ({ limit, category }: any) => {
                    try {
                        return await getNaturalEvents(limit, category);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            searchImageLibrary: tool({
                description: 'Search for general space images and videos in the NASA Image and Video Library.',
                parameters: z.object({
                    q: z.string().describe('Search query (e.g., "Apollo 11", "Andromeda Galaxy")'),
                    mediaType: z.string().optional().default('image').describe('Media type: "image", "video", or "audio"'),
                }),
                execute: async ({ q, mediaType }: any) => {
                    try {
                        return await searchImageLibrary(q, mediaType);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getSpaceWeather: tool({
                description: 'Get Space Weather notifications (CME, Geomagnetic Storms) from DONKI.',
                parameters: z.object({
                    type: z.enum(['CME', 'GST', 'FLR']).describe('Type of weather: CME (Coronal Mass Ejection), GST (Geomagnetic Storm), FLR (Solar Flare)'),
                    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
                    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
                }),
                execute: async ({ type, startDate, endDate }: any) => {
                    try {
                        return await getSpaceWeather(type, startDate, endDate);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            queryExoplanets: tool({
                description: 'Query the NASA Exoplanet Archive for confirmed planets.',
                parameters: z.object({
                    limit: z.number().optional().default(5).describe('Number of planets to return'),
                }),
                execute: async ({ limit }: any) => {
                    try {
                        return await queryExoplanets(limit);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            searchTechProjects: tool({
                description: 'Search for NASA technology projects (TechPort).',
                parameters: z.object({
                    query: z.string().describe('Search query (e.g., "propulsion", "robotics")'),
                }),
                execute: async ({ query }: any) => {
                    try {
                        return await searchTechProjects(query);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getSatelliteTLE: tool({
                description: 'Get Two-Line Element (TLE) data for a satellite.',
                parameters: z.object({
                    search: z.string().describe('Satellite name or ID (e.g., "ISS", "NOAA 19")'),
                }),
                execute: async ({ search }: any) => {
                    try {
                        return await getSatelliteTLE(search);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            getMarsWeather: tool({
                description: 'Get latest weather report from Elysium Planitia, Mars (InSight mission).',
                parameters: z.object({}),
                execute: async () => {
                    try {
                        return await getMarsWeather();
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),

            searchPatents: tool({
                description: 'Search NASA patents and technologies.',
                parameters: z.object({
                    query: z.string().describe('Search query (e.g., "engine", "solar")'),
                }),
                execute: async ({ query }: any) => {
                    try {
                        return await searchPatents(query);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            }),
        },
    });

    return result.toUIMessageStreamResponse();
}
