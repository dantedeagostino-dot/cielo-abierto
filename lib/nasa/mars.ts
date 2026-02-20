import { fetchFromNASA } from './telemetry';

export const MARS_ROVER_BASE_URL = 'https://api.nasa.gov/mars-photos/api/v1/rovers';

export type RoverName = 'curiosity' | 'opportunity' | 'spirit' | 'perseverance';
export type CameraName = 'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'MAHLI' | 'MARDI' | 'NAVCAM' | 'PANCAM' | 'MINITES';

export interface RoverManifest {
    name: string;
    landing_date: string;
    launch_date: string;
    status: string;
    max_sol: number;
    max_date: string;
    total_photos: number;
    photos: {
        sol: number;
        earth_date: string;
        total_photos: number;
        cameras: string[];
    }[];
}

export interface MarsPhoto {
    id: number;
    sol: number;
    camera: {
        id: number;
        name: string;
        rover_id: number;
        full_name: string;
    };
    img_src: string;
    earth_date: string;
    rover: {
        id: number;
        name: string;
        landing_date: string;
        launch_date: string;
        status: string;
    };
}

export interface MarsPhotosResponse {
    photos: MarsPhoto[];
    latest_photos?: MarsPhoto[]; // The API sometimes returns this key for latest_photos endpoint
}

/**
 * Filters the photos list to prioritize cameras that offer landscape views.
 * If no landscape photos are available, returns everything that was captured.
 */
function getPreferredPhotos(photos: MarsPhoto[]): MarsPhoto[] {
    const landscapeCams = ['NAVCAM', 'MAST', 'PANCAM'];
    const landscapePhotos = photos.filter(p => landscapeCams.includes(p.camera.name));
    return landscapePhotos.length > 0 ? landscapePhotos : photos;
}

/**
 * Fetches the mission manifest for a specific rover.
 * Utilizing the manifest ensures we know the exact 'max_sol' and 'max_date' available,
 * preventing empty responses when querying for "today" (which might not have data yet).
 */
export async function getRoverManifest(rover: RoverName): Promise<RoverManifest | null> {
    try {
        // The manifest endpoint is at /manifests/[rover], NOT /rovers/[rover]/manifests/[rover]
        const manifestBaseUrl = 'https://api.nasa.gov/mars-photos/api/v1/manifests';
        const url = `${manifestBaseUrl}/${rover.toLowerCase()}`;
        console.log(`[Mars API] Fetching manifest from: ${url}`);

        const response: any = await fetchFromNASA(url, {}, {
            next: { revalidate: 3600 } // Cache manifest for 1 hour
        });

        if (response.photo_manifest) {
            return response.photo_manifest as RoverManifest;
        }
        return null;
    } catch (error) {
        console.error(`[Mars API] Error fetching manifest for ${rover}:`, error);
        return null; // Fail gracefully
    }
}

/**
 * Fetches the absolute latest photos available for a rover.
 * This is the preferred fallback when no specific date/sol is requested.
 */
export async function getLatestMarsPhotos(rover: RoverName): Promise<MarsPhoto[]> {
    try {
        const url = `${MARS_ROVER_BASE_URL}/${rover.toLowerCase()}/latest_photos`;
        console.log(`[Mars API] Fetching latest photos from: ${url}`);
        const response: any = await fetchFromNASA(url, {}, {
            next: { revalidate: 3600 }
        });

        // The endpoint returns { latest_photos: [...] }
        const data = response as MarsPhotosResponse;
        let photos = data.latest_photos || data.photos || [];

        // Enforce HTTPS
        photos = photos.map(photo => ({
            ...photo,
            img_src: photo.img_src.replace('http://', 'https://')
        }));

        photos = getPreferredPhotos(photos);

        if (photos.length > 0) return photos;
        throw new Error("Empty photos array from Mars Rover API");
    } catch (error) {
        console.warn(`[Mars API] Error fetching latest photos for ${rover}:`, error);
        return [];
    }
}

export async function getMarsRoverPhotos(
    rover: RoverName,
    sol?: number,
    camera?: CameraName
): Promise<MarsPhotosResponse> {

    // 1. If no specific Sol is provided, try the dedicated latest_photos endpoint first
    if (sol === undefined) {
        const latestPhotos = await getLatestMarsPhotos(rover);
        if (latestPhotos.length > 0) {
            return { photos: latestPhotos };
        }

        // If latest_photos fails (e.g. 404 on API), check manifest for max_sol
        console.warn(`[Mars API] latest_photos returned empty for ${rover}. Fetching manifest max_sol.`);
        const manifest = await getRoverManifest(rover);
        if (manifest) {
            sol = manifest.max_sol;
        } else {
            sol = 1000; // Ultimate fallback if everything fails
        }
    }

    const params: Record<string, string> = {
        sol: sol.toString(),
    };

    if (camera) {
        params.camera = camera;
    }

    try {
        const response: any = await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover.toLowerCase()}/photos`, params, {
            next: { revalidate: 3600 },
        });

        const data = response as MarsPhotosResponse;

        let photos = data.photos || [];

        // 2. HTTPS Enforcement (Critical for Vercel/Mixed Content)
        photos = photos.map(photo => ({
            ...photo,
            img_src: photo.img_src.replace('http://', 'https://')
        }));

        // 3. Fallback Logic: If specific Sol request returns empty, try manifest
        if (photos.length === 0) {
            console.warn(`[Mars API] No photos for ${rover} Sol ${sol}. Falling back to manifest max_sol.`);
            const manifest = await getRoverManifest(rover);
            if (manifest && manifest.max_sol !== sol) { // Prevent infinite loop if max_sol is also empty
                const fallbackParams: Record<string, string> = { sol: manifest.max_sol.toString() };
                if (camera) fallbackParams.camera = camera;

                const fallbackResponse: any = await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover.toLowerCase()}/photos`, fallbackParams);
                if (fallbackResponse.photos) {
                    const fallbackPhotos = fallbackResponse.photos.map((p: any) => ({ ...p, img_src: p.img_src.replace('http://', 'https://') }));
                    return { photos: getPreferredPhotos(fallbackPhotos) };
                }
            }
        }

        // 3. Fallback Logic: If specific Sol request returns empty, try finding nearest data?
        // For now, we return empty structure, but the chat agent typically handles "no photos found".
        // However, if we defaulted to 'sol=1000' because manifest failed, and it's empty, we might try a hardcoded safe sol.
        if (photos.length === 0 && sol === 1000) {
            // Try Curiosity Sol 1 (guaranteed to exists) just to show SOMETHING if standard fallback fails
            console.warn(`[Mars API] No photos for ${rover} Sol ${sol}. Attempting Sol 1 fallback.`);
            const retryParams = { ...params, sol: '1' };
            const retryResponse: any = await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover}/photos`, retryParams);
            const retryData = retryResponse as MarsPhotosResponse;
            if (retryData.photos) {
                photos = retryData.photos.map(p => ({ ...p, img_src: p.img_src.replace('http://', 'https://') }));
            }
        }

        return { photos: getPreferredPhotos(photos) };
    } catch (e) {
        console.error(`[Mars API] Error fetching photos for ${rover} on Sol ${sol}:`, e);
        return { photos: [] };
    }
}
