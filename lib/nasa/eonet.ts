import { fetchFromNASA } from './telemetry';

const EONET_BASE_URL = 'https://eonet.gsfc.nasa.gov/api/v3/events';

export interface EONETEvent {
    id: string;
    title: string;
    description: string;
    link: string;
    categories: {
        id: string;
        title: string;
    }[];
    sources: {
        id: string;
        url: string;
    }[];
    geometry: {
        magnitudeValue?: number;
        magnitudeUnit?: string;
        date: string;
        type: string;
        coordinates: [number, number]; // [lon, lat]
    }[];
}

export interface EONETResponse {
    title: string;
    description: string;
    link: string;
    events: EONETEvent[];
}

export async function getNaturalEvents(limit: number = 10, category?: string): Promise<EONETEvent[]> {
    // EONET does not require an API Key
    const params: Record<string, string> = {
        limit: limit.toString(),
        status: 'open',
    };

    if (category) {
        params.category = category;
    }

    const data: EONETResponse = await fetchFromNASA(EONET_BASE_URL, params, {
        skipApiKey: true,
        next: { revalidate: 3600 },
    } as any);

    return data.events;
}
