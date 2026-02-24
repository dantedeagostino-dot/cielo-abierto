import { fetchFromNASA } from './telemetry';

const LIBRARY_BASE_URL = 'https://images-api.nasa.gov/search';

export interface LibraryItem {
    href: string;
    data: {
        center: string;
        title: string;
        nasa_id: string;
        date_created: string;
        keywords: string[];
        media_type: 'image' | 'video' | 'audio';
        description_508?: string;
        secondary_creator?: string;
        description: string;
    }[];
    links?: {
        href: string;
        rel: string;
        render?: string;
    }[];
}

export interface LibraryResponse {
    collection: {
        version: string;
        href: string;
        items: LibraryItem[];
        metadata: {
            total_hits: number;
        };
    };
}

export async function searchImageLibrary(q: string, mediaType: string = 'image'): Promise<LibraryItem[]> {
    // NASA Image Library does not require an API Key
    const data: LibraryResponse = await fetchFromNASA(LIBRARY_BASE_URL, {
        q: q,
        media_type: mediaType,
    }, {
        skipApiKey: true,
        next: { revalidate: 3600 },
    } as any);

    return data.collection.items.slice(0, 10);
}
