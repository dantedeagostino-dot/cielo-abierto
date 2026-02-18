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
    const queryParams = new URLSearchParams({
        limit: limit.toString(),
        status: 'open', // Only active events
    });

    if (category) {
        queryParams.append('category', category);
    }

    const response = await fetch(`${EONET_BASE_URL}?${queryParams.toString()}`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch EONET events: ${response.statusText}`);
    }

    const data: EONETResponse = await response.json();
    return data.events;
}
