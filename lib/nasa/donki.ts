const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI';

export async function getSpaceWeather(type: 'CME' | 'GST' | 'FLR', startDate?: string, endDate?: string): Promise<any> {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    const queryParams = new URLSearchParams({
        api_key: apiKey,
    });

    if (startDate) queryParams.append('startDate', startDate);
    if (endDate) queryParams.append('endDate', endDate);

    const response = await fetch(`${DONKI_BASE_URL}/${type}?${queryParams.toString()}`, {
        next: { revalidate: 3600 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch DONKI ${type} data: ${response.statusText}`);
    }

    return response.json();
}
