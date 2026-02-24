import { fetchFromNASA } from './telemetry';

// TLE API uses a public mirror since NASA's official TLE endpoint requires Space-Track auth
const TLE_BASE_URL = 'https://tle.ivanstanojevic.me/api/tle';

export async function getSatelliteTLE(search: string): Promise<any> {
    try {
        return await fetchFromNASA(TLE_BASE_URL, {
            search: search,
        }, { skipApiKey: true });
    } catch {
        return { error: 'Satellite not found or service unavailable.' };
    }
}
