import { fetchFromNASA } from './telemetry';

const CAD_BASE_URL = 'https://ssd-api.jpl.nasa.gov/cad.api';
const FIREBALL_BASE_URL = 'https://ssd-api.jpl.nasa.gov/fireball.api';

export interface CloseApproach {
    designation: string;
    orbit_id: string;
    jd: string;
    cd: string; // Close-approach date (TDB)
    dist: string; // Nominal distance (AU)
    dist_min: string;
    dist_max: string;
    v_rel: string; // Relative velocity (km/s)
    v_inf: string;
    h: string; // Absolute magnitude
}

export interface Fireball {
    date: string;
    energy: string;
    impact_e: string;
    lat: string;
    lat_dir: string;
    lon: string;
    lon_dir: string;
    alt: string;
    vel: string;
}

/**
 * Get Close Approach Data (asteroids/comets approaching Earth).
 * Source: https://ssd-api.jpl.nasa.gov/doc/cad.html
 */
export async function getCloseApproaches(
    dateMin?: string,
    dateMax?: string,
    distMax: string = '0.05'
): Promise<{ count: string; data: CloseApproach[] }> {
    const params: Record<string, string> = {
        'dist-max': distMax,
        sort: 'dist',
    };

    if (dateMin) params['date-min'] = dateMin;
    if (dateMax) params['date-max'] = dateMax;

    const result = await fetchFromNASA(CAD_BASE_URL, params, { skipApiKey: true });

    // API returns data as arrays of strings; map to objects using fields definition
    const fields = result.fields || [];
    const data = (result.data || []).map((row: string[]) => {
        const obj: any = {};
        fields.forEach((field: string, i: number) => { obj[field] = row[i]; });
        return obj;
    });

    return { count: result.count, data };
}

/**
 * Get Fireball (bolide) data — large meteors detected by US government sensors.
 * Source: https://ssd-api.jpl.nasa.gov/doc/fireball.html
 */
export async function getFireballs(
    dateMin?: string,
    dateMax?: string,
    limit: number = 10
): Promise<{ count: string; data: Fireball[] }> {
    const params: Record<string, string> = {
        limit: limit.toString(),
        sort: '-date',
    };

    if (dateMin) params['date-min'] = dateMin;
    if (dateMax) params['date-max'] = dateMax;

    const result = await fetchFromNASA(FIREBALL_BASE_URL, params, { skipApiKey: true });

    const fields = result.fields || [];
    const data = (result.data || []).map((row: string[]) => {
        const obj: any = {};
        fields.forEach((field: string, i: number) => { obj[field] = row[i]; });
        return obj;
    });

    return { count: result.count, data };
}
