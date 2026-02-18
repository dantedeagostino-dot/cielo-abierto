export const NEOWS_BASE_URL = 'https://api.nasa.gov/neo/rest/v1';

export interface NearEarthObject {
    id: string;
    neo_reference_id: string;
    name: string;
    nasa_jpl_url: string;
    absolute_magnitude_h: number;
    estimated_diameter: {
        kilometers: {
            estimated_diameter_min: number;
            estimated_diameter_max: number;
        };
    };
    is_potentially_hazardous_asteroid: boolean;
    close_approach_data: Array<{
        close_approach_date: string;
        close_approach_date_full: string;
        epoch_date_close_approach: number;
        relative_velocity: {
            kilometers_per_second: string;
            kilometers_per_hour: string;
        };
        miss_distance: {
            astronomical: string;
            lunar: string;
            kilometers: string;
            miles: string;
        };
        orbiting_body: string;
    }>;
}

export interface NeoFeedResponse {
    links: {
        next: string;
        prev: string;
        self: string;
    };
    element_count: number;
    near_earth_objects: Record<string, NearEarthObject[]>;
}

export async function getNeoFeed(startDate: string, endDate: string): Promise<NeoFeedResponse> {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const queryParams = new URLSearchParams({
        api_key: apiKey,
        start_date: startDate,
        end_date: endDate,
    });

    const response = await fetch(`${NEOWS_BASE_URL}/feed?${queryParams.toString()}`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch NeoWs Feed: ${response.statusText}`);
    }

    return response.json();
}
