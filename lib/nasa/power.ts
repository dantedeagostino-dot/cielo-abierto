import { fetchFromNASA } from './telemetry';

const POWER_BASE_URL = 'https://power.larc.nasa.gov/api/temporal/daily/point';

export interface PowerData {
    parameters: Record<string, Record<string, number>>;
    location: { latitude: number; longitude: number };
    timeRange: { start: string; end: string };
}

// Available parameters grouped by category
const PARAMETER_SETS = {
    temperature: 'T2M,T2M_MAX,T2M_MIN',
    solar: 'ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN',
    wind: 'WS10M,WS10M_MAX,WD10M',
    precipitation: 'PRECTOTCORR',
    humidity: 'RH2M',
    all: 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,WS10M,RH2M',
};

/**
 * Get solar/meteorological data from NASA POWER for any point on Earth.
 * Source: https://power.larc.nasa.gov/
 * 
 * @param latitude  Latitude (-90 to 90)
 * @param longitude Longitude (-180 to 180)
 * @param startDate Start date YYYYMMDD
 * @param endDate   End date YYYYMMDD
 * @param category  Data category: 'temperature', 'solar', 'wind', 'precipitation', 'humidity', 'all'
 */
export async function getPowerData(
    latitude: number,
    longitude: number,
    startDate: string,
    endDate: string,
    category: keyof typeof PARAMETER_SETS = 'all'
): Promise<PowerData> {
    const parameters = PARAMETER_SETS[category] || PARAMETER_SETS.all;

    const result = await fetchFromNASA(POWER_BASE_URL, {
        parameters,
        community: 'RE',
        longitude: longitude.toString(),
        latitude: latitude.toString(),
        start: startDate,
        end: endDate,
        format: 'JSON',
    }, { skipApiKey: true });

    return {
        parameters: result.properties?.parameter || {},
        location: {
            latitude: result.geometry?.coordinates?.[1] || latitude,
            longitude: result.geometry?.coordinates?.[0] || longitude,
        },
        timeRange: {
            start: startDate,
            end: endDate,
        },
    };
}
