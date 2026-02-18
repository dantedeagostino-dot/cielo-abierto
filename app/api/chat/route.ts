import { google } from '@ai-sdk/google';
import { convertToCoreMessages, streamText, tool } from 'ai';
import { z } from 'zod';
import { getAPOD } from '@/lib/nasa/apod';
import { getNeoFeed } from '@/lib/nasa/neows';
import { getMarsRoverPhotos } from '@/lib/nasa/mars';
import { searchEarthData } from '@/lib/nasa/cmr';
import { format } from 'date-fns';

export const maxDuration = 60; // Allow longer timeouts for API calls

export async function POST(req: Request) {
    const { messages } = await req.json();

    const result = await streamText({
        model: google('gemini-1.5-flash-latest'),
        messages: convertToCoreMessages(messages),
        system: `You are 'Cielo Abierto', an intelligent assistant dedicated to democratizing NASA's scientific data.
    You have access to real-time tools to fetch data about:
    - Astronomy Picture of the Day (APOD)
    - Near Earth Objects (Asteroids) and their approach data.
    - Mars Rover Photos (Curiosity, Opportunity, Spirit, Perseverance).
    - Earth Science Data Collections (via CMR).
    
    When a user asks for images, use the appropriate tool and explain the result.
    Always provide context about the data you retrieve.
    If the user asks for "today's picture", use the APOD tool.
    For Mars photos, if no camera is specified, find a diverse set. Sol defaults to 1000 if not specified.
    
    Format your responses in Markdown. use clear headings and bullet points.`,

        tools: {
            getDataFromAPOD: tool({
                description: 'Get the Astronomy Picture of the Day (Image or Video) and its explanation.',
                parameters: z.object({
                    date: z.string().optional().describe('The date in YYYY-MM-DD format. Defaults to today if not provided.'),
                }),
                execute: async ({ date }: { date?: string }) => {
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
                execute: async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
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
                execute: async ({ rover, sol, camera }: { rover: 'curiosity' | 'opportunity' | 'spirit' | 'perseverance'; sol?: number; camera?: any }) => {
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
                execute: async ({ keyword, limit }: { keyword: string; limit?: number }) => {
                    try {
                        return await searchEarthData(keyword, limit);
                    } catch (e: any) {
                        return { error: e.message };
                    }
                },
            })
        },
    });

    return result.toTextStreamResponse();
}
