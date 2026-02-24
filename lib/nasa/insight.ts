import { fetchFromNASA } from './telemetry';

const INSIGHT_BASE_URL = 'https://api.nasa.gov/insight_weather/';

export interface MarsWeather {
    sol: string;
    season: string;
    min_temp: number;
    max_temp: number;
    pressure: number;
    wind_speed: number;
}

export async function getMarsWeather(): Promise<MarsWeather[]> {
    // InSight Mission ended in Dec 2022. The API might return 403 Forbidden or be deprecated.
    try {
        const data = await fetchFromNASA(INSIGHT_BASE_URL, {
            feedtype: 'json',
            ver: '1.0',
        }, {
            next: { revalidate: 3600 },
        } as any);

        const solKeys = data.sol_keys;

        return solKeys.map((sol: string) => {
            const solData = data[sol];
            return {
                sol: sol,
                season: solData.Season,
                min_temp: solData.AT?.mn,
                max_temp: solData.AT?.mx,
                pressure: solData.PRE?.av,
                wind_speed: solData.HWS?.av,
            };
        });
    } catch (error: any) {
        // If 403, return empty array (API deprecated)
        if (error.message?.includes('403')) {
            console.warn('InSight Weather API is unavailable (likely deprecated).');
            return [];
        }
        console.warn('InSight Weather API is unavailable:', error);
        return [];
    }
}
