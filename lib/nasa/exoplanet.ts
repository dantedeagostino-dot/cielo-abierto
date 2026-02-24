import { fetchFromNASA } from './telemetry';

const EXOPLANET_BASE_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

export async function queryExoplanets(limit: number = 5): Promise<any[]> {
    const query = `select top ${limit} pl_name, hostname, discoverymethod, disc_year, pl_rade, pl_masse from ps order by disc_year desc`;

    return await fetchFromNASA(EXOPLANET_BASE_URL, {
        query: query,
        format: 'json',
    }, {
        skipApiKey: true,
        next: { revalidate: 86400 },
    } as any);
}
