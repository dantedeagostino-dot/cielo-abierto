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

export const maxDuration = 60;

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
        system: `You are 'Cielo Abierto', an expert and proactive NASA guide dedicated to democratizing space knowledge.
    
    **Your Goal:** transform simple curiosity into deep discovery. 
    **Behavior:** 
    - **Be Helpful:** Answer questions directly. If the user asks about a specific topic (e.g., "Mars"), call the relevant tool (e.g., \`getMarsPhotos\`).
    - **Suggest Discovery:** If the user says "Hello" or seems unsure, *suggest* what you can do (e.g., "I can show you the picture of the day or Mars weather"), but DO NOT call tools automatically unless asked.
    - **Contextualize:** Never show raw data. Explain WHY it matters.
    - **Guide the User:** If a specific tool fails, ignore the error gracefully and pivot to what IS available.
    
    **Tools at your disposal:**
    - **APOD**: Daily cosmic beauty.
    - **Asteroids (NeoWs)**: Near-earth objects.
    - **Mars Rovers**: Real eyes on the ground (Curiosity/Perseverance).
    - **Earth Science (CMR/EONET/EPIC)**: Our home planet's health.
    - **Library**: Historical context (Apollo, Hubble, etc.).
    - **Space Weather (DONKI)**: Solar flares and storms.
    - **Exoplanets**: New worlds beyond.
    - **TechPort/Patents**: NASA innovation.
    - **Satellites (TLE)**: Tracking humanity in orbit.

    **Tone:** Inspiring, scientific, friendly, and accessible. Use emojis sparingly but effectively.
    **Format:**
    - Use clear Markdown.
    - **CRITICAL:** When a tool returns an image URL (like \`hdurl\`, \`url\`, \`img_src\`), YOU MUST embed it in your response using Markdown syntax: \`![Image Title](url)\`. Do not just list it as text. FAILURE TO DO THIS will result in a blank response.
    - Bold key terms.
    - Use bullet points for lists.`,
        // Multi-step tool execution logic for AI SDK v6 (replaces maxSteps)
        stopWhen: (steps: any) => steps.length >= 10,

        tools: {
            getDataFromAPOD: tool({
                description: 'Get the Astronomy Picture of the Day (Image or Video) and its explanation.',
                parameters: z.object({
                    date: z.string().optional().describe('The date in YYYY-MM-DD format. Defaults to today if not provided.'),
                }),
                execute: async (args: any) => {
                    const { date } = args;
                    try {
                        return await getAPOD(date);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            getAsteroidFeed: tool({
                description: 'Get a list of asteroids approaching Earth within a date range.',
                parameters: z.object({
                    startDate: z.string().describe('Start date in YYYY-MM-DD format'),
                    endDate: z.string().describe('End date in YYYY-MM-DD format. Must be within 7 days of startDate.'),
                }),
                execute: async (args: any) => {
                    const { startDate, endDate } = args;
                    try {
                        return await getNeoFeed(startDate, endDate);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            getMarsPhotos: tool({
                description: 'Get photos from Mars Rovers (Curiosity, Opportunity, Spirit, Perseverance).',
                parameters: z.object({
                    rover: z.enum(['curiosity', 'opportunity', 'spirit', 'perseverance']).describe('The name of the rover'),
                    sol: z.number().optional().default(1000).describe('The Martian Sol (day) to fetch photos from.'),
                    camera: z.enum(['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM', 'PANCAM', 'MINITES']).optional().describe('Specific camera to filter by'),
                }),
                execute: async (args: any) => {
                    const { rover, sol, camera } = args;
                    try {
                        return await getMarsRoverPhotos(rover, sol, camera);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            searchEarthDataCollections: tool({
                description: 'Search for Earth Science data collections in the Common Metadata Repository (CMR).',
                parameters: z.object({
                    keyword: z.string().describe('Search keyword (e.g., "temperature", "precipitation", "ozone")'),
                    limit: z.number().optional().default(5).describe('Number of results to return'),
                }),
                execute: async (args: any) => {
                    const { keyword, limit } = args;
                    try {
                        return await searchEarthData(keyword, limit);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

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
            } as any),

            getNaturalEvents: tool({
                description: 'Get real-time natural events (wildfires, storms, volcanoes) from EONET.',
                parameters: z.object({
                    limit: z.number().optional().default(5).describe('Number of events to return'),
                    category: z.string().optional().describe('Category of event (e.g., "wildfires", "severeStorms")'),
                }),
                execute: async (args: any) => {
                    const { limit, category } = args;
                    try {
                        return await getNaturalEvents(limit, category);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            searchImageLibrary: tool({
                description: 'Search for general space images and videos in the NASA Image and Video Library.',
                parameters: z.object({
                    q: z.string().describe('Search query (e.g., "Apollo 11", "Andromeda Galaxy")'),
                    mediaType: z.string().optional().default('image').describe('Media type: "image", "video", or "audio"'),
                }),
                execute: async (args: any) => {
                    const { q, mediaType } = args;
                    try {
                        return await searchImageLibrary(q, mediaType);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            getSpaceWeather: tool({
                description: 'Get Space Weather notifications (CME, Geomagnetic Storms) from DONKI.',
                parameters: z.object({
                    type: z.enum(['CME', 'GST', 'FLR']).describe('Type of weather: CME (Coronal Mass Ejection), GST (Geomagnetic Storm), FLR (Solar Flare)'),
                    startDate: z.string().optional().describe('Start date (YYYY-MM-DD)'),
                    endDate: z.string().optional().describe('End date (YYYY-MM-DD)'),
                }),
                execute: async (args: any) => {
                    const { type, startDate, endDate } = args;
                    try {
                        return await getSpaceWeather(type, startDate, endDate);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            queryExoplanets: tool({
                description: 'Query the NASA Exoplanet Archive for confirmed planets.',
                parameters: z.object({
                    limit: z.number().optional().default(5).describe('Number of planets to return'),
                }),
                execute: async (args: any) => {
                    const { limit } = args;
                    try {
                        return await queryExoplanets(limit);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            searchTechProjects: tool({
                description: 'Search for NASA technology projects (TechPort).',
                parameters: z.object({
                    query: z.string().describe('Search query (e.g., "propulsion", "robotics")'),
                }),
                execute: async (args: any) => {
                    const { query } = args;
                    try {
                        return await searchTechProjects(query);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

            getSatelliteTLE: tool({
                description: 'Get Two-Line Element (TLE) data for a satellite.',
                parameters: z.object({
                    search: z.string().describe('Satellite name or ID (e.g., "ISS", "NOAA 19")'),
                }),
                execute: async (args: any) => {
                    const { search } = args;
                    try {
                        return await getSatelliteTLE(search);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),

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
            } as any),

            searchPatents: tool({
                description: 'Search NASA patents and technologies.',
                parameters: z.object({
                    query: z.string().describe('Search query (e.g., "engine", "solar")'),
                }),
                execute: async (args: any) => {
                    const { query } = args;
                    try {
                        return await searchPatents(query);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            } as any),
        },
    });

    return result.toUIMessageStreamResponse();
}
