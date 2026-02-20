import { fetchFromNASA } from './telemetry';

export const MARS_ROVER_BASE_URL = 'https://api.nasa.gov/mars-photos/api/v1/rovers';

export type RoverName = 'curiosity' | 'opportunity' | 'spirit' | 'perseverance';

// Comprehensive list of cameras from the NASA API docs
export type CameraName = 'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'MAHLI' | 'MARDI' | 'NAVCAM' | 'PANCAM' | 'MINITES' | 'EDL_RUCAM' | 'EDL_RDCAM' | 'EDL_DDCAM' | 'EDL_PUCAM1' | 'EDL_PUCAM2' | 'NAVCAM_LEFT' | 'NAVCAM_RIGHT' | 'MCZ_RIGHT' | 'MCZ_LEFT' | 'FRONT_HAZCAM_LEFT_A' | 'FRONT_HAZCAM_RIGHT_A' | 'REAR_HAZCAM_LEFT' | 'REAR_HAZCAM_RIGHT' | 'SHERLOC_WATSON';

// Strict Camera mapping based on the NASA documentation provided by the user
const ROVER_CAMERAS: Record<RoverName, CameraName[]> = {
    curiosity: ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM'],
    opportunity: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
    spirit: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
    perseverance: [
        'EDL_RUCAM', 'EDL_RDCAM', 'EDL_DDCAM', 'EDL_PUCAM1', 'EDL_PUCAM2',
        'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT', 'FRONT_HAZCAM_LEFT_A',
        'FRONT_HAZCAM_RIGHT_A', 'REAR_HAZCAM_LEFT', 'REAR_HAZCAM_RIGHT', 'SHERLOC_WATSON'
    ] // Expanded Perseverance cameras
};

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
    const landscapeCams = ['NAVCAM', 'MAST', 'PANCAM', 'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT'];
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
    earthDate?: string,
    camera?: CameraName,
    page?: number
): Promise<MarsPhotosResponse> {

    // 1. Camera Validation
    if (camera) {
        const validCameras = ROVER_CAMERAS[rover];
        if (!validCameras.includes(camera)) {
            console.warn(`[Mars API] Tool requested invalid camera '${camera}' for rover '${rover}'. Ignoring camera filter.`);
            camera = undefined; // Nullify invalid camera to prevent barren API calls
        }
    }

    // 2. Decide the primary time parameter: `earth_date` overrides `sol`
    // If BOTH are undefined, fallback to `latest_photos` FIRST
    if (sol === undefined && earthDate === undefined) {
        const latestPhotos = await getLatestMarsPhotos(rover);
        if (latestPhotos.length > 0) {
            // Apply client-side camera filtering for `latest_photos` if requested, 
            // since `latest_photos` doesn't natively support `camera` query param robustly
            if (camera) {
                const filtered = latestPhotos.filter(p => p.camera.name === camera);
                if (filtered.length > 0) {
                    return { photos: filtered };
                }
                console.warn(`[Mars API] No latest photos found for specific camera ${camera}. Returning all latest.`);
            }
            return { photos: latestPhotos };
        }

        // If latest_photos fails (e.g. 404), check manifest for max_sol
        console.warn(`[Mars API] latest_photos returned empty for ${rover}. Fetching manifest max_sol.`);
        const manifest = await getRoverManifest(rover);
        if (manifest) {
            sol = manifest.max_sol;
        } else {
            sol = 1000; // Ultimate fallback
        }
    }

    // Prepare query parameters
    const params: Record<string, string> = {};

    // The API requires either `sol` OR `earth_date`. If `earthDate` is somehow set, we use it over `sol`
    if (earthDate) {
        params.earth_date = earthDate;
    } else if (sol !== undefined) {
        params.sol = sol.toString();
    }

    if (camera) {
        params.camera = camera;
    }

    if (page !== undefined) {
        params.page = page.toString();
    }

    try {
        const response: any = await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover.toLowerCase()}/photos`, params, {
            next: { revalidate: 3600 },
        });

        const data = response as MarsPhotosResponse;
        let photos = data.photos || [];

        // 3. HTTPS Enforcement
        photos = photos.map(photo => ({
            ...photo,
            img_src: photo.img_src.replace('http://', 'https://')
        }));

        // 4. Fallback Logic: If specific request returns empty, and it was a `sol` request, try manifest 
        if (photos.length === 0 && sol !== undefined) {
            console.warn(`[Mars API] No photos for ${rover} Sol ${sol}. Falling back to manifest max_sol.`);
            const manifest = await getRoverManifest(rover);
            if (manifest && manifest.max_sol !== sol) {
                const fallbackParams: Record<string, string> = { sol: manifest.max_sol.toString() };
                if (camera) fallbackParams.camera = camera;
                if (page !== undefined) fallbackParams.page = page.toString();

                const fallbackResponse: any = await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover.toLowerCase()}/photos`, fallbackParams);
                if (fallbackResponse.photos) {
                    const fallbackPhotos = fallbackResponse.photos.map((p: any) => ({ ...p, img_src: p.img_src.replace('http://', 'https://') }));
                    return { photos: getPreferredPhotos(fallbackPhotos) };
                }
            }
        }

        return { photos: getPreferredPhotos(photos) };
    } catch (e) {
        console.error(`[Mars API] Error fetching photos for ${rover}:`, e);
        return { photos: [] };
    }
}
