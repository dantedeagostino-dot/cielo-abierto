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

            // Critical fix for Context Pollution: 
            // If the assistant used a tool, we DO NOT push its previous text (apologies, confusion, etc.)
            // We only push the text if it was a pure text response without tools.
            if (m.content && (!m.toolInvocations || m.toolInvocations.length === 0)) {
                content.push({ type: 'text', text: m.content });
            }

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
        system: `Eres 'Cielo Abierto', un guía experto y proactivo de la NASA dedicado a democratizar el conocimiento espacial. **DEBES RESPONDER SIEMPRE EN ESPAÑOL**.
    
    **Tu Misión:** transformar la simple curiosidad en un descubrimiento profundo siendo preciso e inteligente.
    **Comportamiento:** 
    - **Idioma:** RESPONDE SIEMPRE EN ESPAÑOL. Si el usuario te habla en español, tú contestas en español. No uses inglés a menos que sea el nombre propio de una misión (e.g., Perseverance).
    - **Respuesta Específica:** Responde SOLO a lo que el usuario pregunta explícitamente. No des información no solicitada ni explicaciones excesivamente largas a menos que se te pida.
    - **Cero Repetición:** NO repitas respuestas anteriores, resultados de herramientas (imágenes/datos) ni información de turnos previos. Trata cada pregunta como una consulta enfocada, usando el historial solo como contexto.
    - **Guía al Usuario:** Si no tienes la respuesta o la herramienta necesaria no está disponible, NO alucines ni inventes datos. En su lugar, guía amablemente al usuario explicando qué SÍ PUEDES hacer basándote en las APIs e información que maneja esta plataforma.
    - **Descubrimiento Proactivo:** Si el usuario dice "Hola" o parece indeciso, sugiere qué pueden explorar juntos usando las herramientas disponibles, pero NO llames a las herramientas automáticamente a menos que el usuario lo pida explícitamente.
    - **Contextualiza (Cuando Aplique):** Al proporcionar datos o imágenes, explica brevemente por qué son importantes sin ser demasiado hablador. Si una herramienta falla, cambia el enfoque hacia la información que sí está disponible.
    
    **Herramientas a tu disposición:**
    - **APOD**: Belleza cósmica diaria.
    - **Asteroids (NeoWs)**: Objetos cercanos a la Tierra.
    - **Mars Rovers**: Ojos reales en el planeta rojo (Curiosity/Perseverance).
    - **Earth Science (CMR/EONET/EPIC)**: La salud de nuestro planeta hogar.
    - **Library**: Contexto histórico (Apollo, Hubble, etc.).
    - **Space Weather (DONKI)**: Llamaradas y tormentas solares.
    - **Exoplanets**: Nuevos mundos más allá.
    - **TechPort/Patents**: Innovación de la NASA.
    - **Satellites (TLE)**: Rastreando la humanidad en órbita.

    **Tono:** Inspirador, científico, amigable y accesible. Usa emojis con moderación pero de forma efectiva.
    - **Formato:**
        - Usa un formato Markdown claro.
        - **CRÍTICO:** Cuando una herramienta devuelve una URL de imagen (como \`hdurl\`, \`url\`, \`img_src\`), DEBES incrustarla en tu respuesta usando sintaxis Markdown: \`![Título de la Imagen](url)\`. No la pongas solo como texto. FALLAR EN ESTO resultará en una respuesta en blanco.
        - Pon en negrita los términos clave.
        - Usa listas con viñetas cuando sea apropiado.`,
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
                description: 'Get photos from Mars Rovers (Curiosity, Opportunity, Spirit, Perseverance). To see the Martian landscape, prioritize using NAVCAM or MAST cameras.',
                parameters: z.object({
                    rover: z.enum(['curiosity', 'opportunity', 'spirit', 'perseverance']).optional().default('curiosity').describe('The name of the rover'),
                    sol: z.number().optional().describe('The Martian Sol (day) to fetch photos from. Leave empty for latest if earth_date is not provided.'),
                    earth_date: z.string().optional().describe('The Earth date (YYYY-MM-DD) to fetch photos from. If provided, this overrides sol.'),
                    camera: z.enum(['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM', 'PANCAM', 'MINITES', 'EDL_RUCAM', 'EDL_RDCAM', 'EDL_DDCAM', 'EDL_PUCAM1', 'EDL_PUCAM2', 'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT', 'FRONT_HAZCAM_LEFT_A', 'FRONT_HAZCAM_RIGHT_A', 'REAR_HAZCAM_LEFT', 'REAR_HAZCAM_RIGHT', 'SHERLOC_WATSON']).optional().describe('Specific camera. Valid cameras: Curiosity (FHAZ, RHAZ, MAST, CHEMCAM, MAHLI, MARDI, NAVCAM), Opportunity/Spirit (FHAZ, RHAZ, NAVCAM, PANCAM, MINITES), Perseverance (FHAZ, RHAZ, NAVCAM_LEFT, NAVCAM_RIGHT, MCZ_RIGHT, MCZ_LEFT, FRONT_HAZCAM_LEFT_A, FRONT_HAZCAM_RIGHT_A, REAR_HAZCAM_LEFT, REAR_HAZCAM_RIGHT, SHERLOC_WATSON). Do not use invalid combinations.'),
                    page: z.number().optional().describe('Page number of results (25 photos per page). Default is 1.'),
                }),

                execute: async (args: any) => {
                    const { rover = 'curiosity', sol, earth_date, camera, page } = args;
                    try {
                        return await getMarsRoverPhotos(rover, sol, earth_date, camera, page);
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
                parameters: z.object({
                    date: z.string().optional().describe('The date in YYYY-MM-DD format. Defaults to the most recent available date if not provided.'),
                }),
                execute: async (args: any) => {
                    const { date } = args;
                    try {
                        return await getEPICImages(date);
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
