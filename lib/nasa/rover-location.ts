import { fetchFromNASA } from './telemetry';

// GeoJSON endpoints from NASA MMGIS (same data source as the official interactive maps)
const ENDPOINTS = {
    curiosity: {
        current: 'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints_current.json',
        mapUrl: 'https://science.nasa.gov/mission/msl-curiosity/location-map/',
    },
    perseverance: {
        current: 'https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints_current.json',
        mapUrl: 'https://science.nasa.gov/mission/mars-2020-perseverance/location-map/',
    },
};

export interface RoverLocation {
    rover: string;
    sol: number;
    latitude: number;
    longitude: number;
    elevation: number;
    distanceTotal_km: number;
    distanceTotal_mi: number;
    lastDrive_m: number;
    roll: number;
    pitch: number;
    yaw: number;
    tilt: number;
    mapUrl: string;
    panoramaUrl?: string;
}

/**
 * Get the current location of a Mars rover using NASA's MMGIS GeoJSON API.
 * This is the same data source used by the official NASA interactive maps.
 */
export async function getRoverLocation(rover: 'curiosity' | 'perseverance'): Promise<RoverLocation> {
    const endpoint = ENDPOINTS[rover];
    if (!endpoint) throw new Error(`Unknown rover: ${rover}`);

    const data = await fetchFromNASA(endpoint.current, {}, { skipApiKey: true });

    const feature = data.features?.[0];
    if (!feature) throw new Error(`No location data available for ${rover}`);

    const props = feature.properties;

    // Build panorama URL for Perseverance if available
    let panoramaUrl: string | undefined;
    if (props.images && props.images.length > 0) {
        const pano = props.images.find((img: any) => img.isPanoramic);
        if (pano) {
            panoramaUrl = `https://mars.nasa.gov/mmgis-maps/M20/${pano.url}`;
        }
    }

    return {
        rover: rover.charAt(0).toUpperCase() + rover.slice(1),
        sol: props.sol,
        latitude: props.lat,
        longitude: props.lon,
        elevation: props.elev_geoid,
        distanceTotal_km: props.dist_km || (props.dist_total_m / 1000),
        distanceTotal_mi: props.dist_mi || 0,
        lastDrive_m: props.dist_m,
        roll: props.roll,
        pitch: props.pitch,
        yaw: props.yaw,
        tilt: props.tilt,
        mapUrl: endpoint.mapUrl,
        panoramaUrl,
    };
}
