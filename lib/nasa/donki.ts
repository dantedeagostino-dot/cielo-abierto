import { fetchFromNASA } from './telemetry';

const DONKI_BASE_URL = 'https://api.nasa.gov/DONKI';

export async function getSpaceWeather(type: 'CME' | 'GST' | 'FLR', startDate?: string, endDate?: string): Promise<any> {
    const params: Record<string, string> = {};

    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;

    return await fetchFromNASA(`${DONKI_BASE_URL}/${type}`, params, {
        next: { revalidate: 3600 },
    } as any);
}
