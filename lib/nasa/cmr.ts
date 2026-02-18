export const CMR_BASE_URL = 'https://cmr.earthdata.nasa.gov/search/collections.json';

export interface CMRCollection {
    id: string;
    title: string;
    summary: string;
    updated: string;
    dataset_id: string;
    short_name: string;
    version_id: string;
    archive_center: string;
    links: Array<{
        rel: string;
        href: string;
        hreflang?: string;
        title?: string;
    }>;
}

export interface CMRSearchResponse {
    feed: {
        entry: CMRCollection[];
    };
}

export async function searchEarthData(keyword: string, limit: number = 5): Promise<CMRCollection[]> {
    const queryParams = new URLSearchParams({
        keyword: keyword,
        page_size: limit.toString(),
    });

    const response = await fetch(`${CMR_BASE_URL}?${queryParams.toString()}`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch CMR Data: ${response.statusText}`);
    }

    const data: CMRSearchResponse = await response.json();
    return data.feed.entry;
}
