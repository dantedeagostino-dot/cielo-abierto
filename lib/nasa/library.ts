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
    const queryParams = new URLSearchParams({
        q: q,
        media_type: mediaType,
    });

    const response = await fetch(`${LIBRARY_BASE_URL}?${queryParams.toString()}`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`Failed to search NASA Image Library: ${response.statusText}`);
    }

    const data: LibraryResponse = await response.json();
    return data.collection.items.slice(0, 10); // Return top 10 results
}
