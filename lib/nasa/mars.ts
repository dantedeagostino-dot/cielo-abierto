import { fetchFromNASA } from './telemetry';

// We bypass the defunct api.nasa.gov endpoint and use the internal Mars Mission endpoint.
export const MARS_RAW_IMAGE_BASE_URL = 'https://mars.nasa.gov/api/v1/raw_image_items/';

export type RoverName = 'curiosity' | 'opportunity' | 'spirit' | 'perseverance';

// Comprehensive list of cameras from the NASA API docs
export type CameraName = 'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'MAHLI' | 'MARDI' | 'NAVCAM' | 'PANCAM' | 'MINITES' | 'EDL_RUCAM' | 'EDL_RDCAM' | 'EDL_DDCAM' | 'EDL_PUCAM1' | 'EDL_PUCAM2' | 'NAVCAM_LEFT' | 'NAVCAM_RIGHT' | 'MCZ_RIGHT' | 'MCZ_LEFT' | 'FRONT_HAZCAM_LEFT_A' | 'FRONT_HAZCAM_RIGHT_A' | 'REAR_HAZCAM_LEFT' | 'REAR_HAZCAM_RIGHT' | 'SHERLOC_WATSON' | 'SKYCAM';

// Strict Camera mapping based on the NASA documentation provided by the user
const ROVER_CAMERAS: Record<RoverName, CameraName[]> = {
    curiosity: ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM'],
    opportunity: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
    spirit: ['FHAZ', 'RHAZ', 'NAVCAM', 'PANCAM', 'MINITES'],
    perseverance: [
        'EDL_RUCAM', 'EDL_RDCAM', 'EDL_DDCAM', 'EDL_PUCAM1', 'EDL_PUCAM2',
        'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT', 'FRONT_HAZCAM_LEFT_A',
        'FRONT_HAZCAM_RIGHT_A', 'REAR_HAZCAM_LEFT', 'REAR_HAZCAM_RIGHT', 'SHERLOC_WATSON', 'SKYCAM'
    ]
};

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
 * Maps the internal NASA `raw_image_items` JSON structure to the standard MarsPhoto interface
 */
function mapRawImageToMarsPhoto(item: any, rover: RoverName): MarsPhoto {
    return {
        id: parseInt(item.imageid || "0", 10),
        sol: parseInt(item.sol || "0", 10),
        camera: {
            id: 0, // Not provided by raw API
            name: (item.instrument || "UNKNOWN").toUpperCase(),
            rover_id: 0,
            full_name: item.instrument || "Unknown Camera",
        },
        img_src: (item.https_url || item.url || "").replace('http://', 'https://'),
        earth_date: item.date_taken ? item.date_taken.split('T')[0] : "Unknown",
        rover: {
            id: 0,
            name: rover.charAt(0).toUpperCase() + rover.slice(1),
            landing_date: "Unknown", // Would need hardcoding per rover if strict adherence is needed
            launch_date: "Unknown",
            status: "active"
        }
    };
}

/**
 * Fetches photos from the internal `mars.nasa.gov` raw image API.
 */
export async function getMarsRoverPhotos(
    rover: RoverName,
    sol?: number,
    earthDate?: string,
    camera?: CameraName,
    page: number = 0 // The internal API uses 0-based indexing for pages
): Promise<MarsPhotosResponse> {

    // 1. Camera Validation
    if (camera) {
        const validCameras = ROVER_CAMERAS[rover];
        if (!validCameras.includes(camera)) {
            console.warn(`[Mars API] Tool requested invalid camera '${camera}' for rover '${rover}'. Ignoring camera filter.`);
            camera = undefined;
        }
    }

    // 2. Map target mission format. Curiosity uses 'msl', Perseverance uses 'm20'.
    // Opportunity/Spirit are generally not active on this specific internal endpoint in the same way,
    // but we map the most critical ones used today.
    let missionName = rover.toLowerCase();
    if (missionName === 'curiosity') missionName = 'msl';
    if (missionName === 'perseverance') missionName = 'm20';

    // Prepare query parameters for the `raw_image_items` endpoint
    const params: Record<string, string> = {
        order: 'sol desc,instrument_sort asc,sample_type_sort asc, date_taken desc',
        per_page: '50',
        page: page.toString(),
        condition_1: `${missionName}:mission`
    };

    // Include only full images if possible (to avoid thumbnails)
    params.extended = 'sample_type::full';

    // The API requires either `sol` OR `earth_date`.
    // It maps to condition_2 and condition_3
    let conditionIndex = 2;

    if (earthDate) {
        // Not natively well-supported in this exact format on the internal API without complex date ranges, 
        // but we can try to filter client side or just fallback to sol.
        console.warn("[Mars API] Note: earth_date filtering is less precise on the internal API. Using latest available.");
    } else if (sol !== undefined) {
        params[`condition_${conditionIndex}`] = `${sol}:sol:in`;
        conditionIndex++;
    }

    if (camera) {
        // Map common camera names to the internal abbreviations if needed, though they usually match.
        params[`condition_${conditionIndex}`] = `${camera.toLowerCase()}:instrument:in`;
    }

    try {
        const queryParams = new URLSearchParams(params);
        const fullUrl = `${MARS_RAW_IMAGE_BASE_URL}?${queryParams.toString()}`;
        console.log(`[Mars API Internal] Fetching: ${fullUrl}`);

        const response = await fetch(fullUrl, {
            headers: {
                'User-Agent': 'CieloAbierto/1.0',
            },
            next: { revalidate: 3600 }
        });

        if (!response.ok) {
            throw new Error(`Mars Internal API Error: ${response.status}`);
        }

        const data = await response.json();
        const rawItems = data.items || [];

        let photos: MarsPhoto[] = rawItems.map((item: any) => mapRawImageToMarsPhoto(item, rover));

        // Let's filter out images that are just thumbnails if the API didn't respect our extended parameter
        photos = photos.filter(p => !p.img_src.includes('-thm'));

        return { photos: getPreferredPhotos(photos) };
    } catch (e) {
        console.error(`[Mars API] Error fetching photos for ${rover}:`, e);
        return { photos: [] };
    }
}
