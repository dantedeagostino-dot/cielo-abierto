import { fetchFromNASA } from './telemetry';

export type RoverName = 'curiosity' | 'perseverance';

export type CameraName = 'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'MAHLI' | 'MARDI' | 'NAVCAM' |
    'EDL_RUCAM' | 'EDL_RDCAM' | 'EDL_DDCAM' | 'EDL_PUCAM1' | 'EDL_PUCAM2' |
    'NAVCAM_LEFT' | 'NAVCAM_RIGHT' | 'MCZ_RIGHT' | 'MCZ_LEFT' |
    'FRONT_HAZCAM_LEFT_A' | 'FRONT_HAZCAM_RIGHT_A' | 'REAR_HAZCAM_LEFT' | 'REAR_HAZCAM_RIGHT' |
    'SHERLOC_WATSON' | 'SKYCAM' | 'CHEMCAM_RMI';

const ROVER_CAMERAS: Record<RoverName, string[]> = {
    curiosity: ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'CHEMCAM_RMI', 'MAHLI', 'MARDI', 'NAVCAM'],
    perseverance: [
        'EDL_RUCAM', 'EDL_RDCAM', 'EDL_DDCAM', 'EDL_PUCAM1', 'EDL_PUCAM2',
        'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT',
        'FRONT_HAZCAM_LEFT_A', 'FRONT_HAZCAM_RIGHT_A',
        'REAR_HAZCAM_LEFT', 'REAR_HAZCAM_RIGHT', 'SHERLOC_WATSON', 'SKYCAM'
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
}

/** Prioritize landscape-view cameras */
function getPreferredPhotos(photos: MarsPhoto[]): MarsPhoto[] {
    const landscapeCams = ['NAVCAM', 'MAST', 'NAVCAM_LEFT', 'NAVCAM_RIGHT', 'MCZ_RIGHT', 'MCZ_LEFT'];
    const landscapePhotos = photos.filter(p => landscapeCams.includes(p.camera.name));
    return landscapePhotos.length > 0 ? landscapePhotos : photos;
}

/**
 * Fetches photos from Curiosity via mars.nasa.gov internal raw image API.
 * Source: https://mars.nasa.gov/msl/multimedia/raw-images/
 */
async function fetchCuriosityPhotos(sol?: number, camera?: string, page: number = 0): Promise<MarsPhoto[]> {
    // Build query params exactly as the NASA raw images page does
    const params: Record<string, string> = {
        order: 'sol desc,instrument_sort asc,sample_type_sort asc, date_taken desc',
        per_page: '25',
        page: page.toString(),
        condition_1: 'msl:mission',
        // This is the KEY fix — the actual NASA page uses this to exclude thumbnails
        extended: 'thumbnail::sample_type::noteq',
    };

    let conditionIndex = 2;
    if (sol !== undefined) {
        params[`condition_${conditionIndex}`] = `${sol}:sol:in`;
        conditionIndex++;
    }
    if (camera) {
        params[`condition_${conditionIndex}`] = `${camera.toLowerCase()}:instrument:in`;
    }

    const url = 'https://mars.nasa.gov/api/v1/raw_image_items/';
    const queryParams = new URLSearchParams(params);
    // The internal API fails if commas are URL-encoded as %2C
    const fullUrl = `${url}?${queryParams.toString().replace(/%2C/g, ',')}`;

    console.log(`[Mars API] Curiosity fetching: ${fullUrl}`);

    const response = await fetch(fullUrl, {
        headers: { 'User-Agent': 'CieloAbierto/1.0' },
    });

    if (!response.ok) {
        throw new Error(`Mars Curiosity API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawItems = data.items || [];

    return rawItems.map((item: any): MarsPhoto => {
        let imageUrl = item.https_url || item.url || '';
        imageUrl = imageUrl.replace('http://', 'https://');

        return {
            id: parseInt(item.imageid || item.id || '0', 10),
            sol: parseInt(item.sol || '0', 10),
            camera: {
                id: 0,
                name: (item.instrument || 'UNKNOWN').toUpperCase(),
                rover_id: 0,
                full_name: item.instrument || 'Unknown',
            },
            img_src: imageUrl,
            earth_date: item.date_taken ? item.date_taken.split('T')[0] : 'Unknown',
            rover: {
                id: 5,
                name: 'Curiosity',
                landing_date: '2012-08-06',
                launch_date: '2011-11-26',
                status: 'active',
            },
        };
    });
}

/**
 * Fetches photos from Perseverance via mars.nasa.gov RSS API.
 * Source: https://mars.nasa.gov/mars2020/multimedia/raw-images/
 */
async function fetchPerseverancePhotos(sol?: number, camera?: string, page: number = 0): Promise<MarsPhoto[]> {
    const params: Record<string, string> = {
        feed: 'raw_images',
        category: 'mars2020,ingenuity',
        feedtype: 'json',
        ver: '1.2',
        num: '25',
        page: page.toString(),
        order: 'sol desc',
    };

    if (sol !== undefined) params.sol = sol.toString();
    if (camera) params.search = camera;

    const queryParams = new URLSearchParams(params);
    const fullUrl = `https://mars.nasa.gov/rss/api/?${queryParams.toString().replace(/%2C/g, ',')}`;

    console.log(`[Mars API] Perseverance fetching: ${fullUrl}`);

    const response = await fetch(fullUrl, {
        headers: { 'User-Agent': 'CieloAbierto/1.0' },
    });

    if (!response.ok) {
        throw new Error(`Mars Perseverance API Error: ${response.status}`);
    }

    const data = await response.json();
    const rawImages = data.images || [];

    return rawImages.map((item: any): MarsPhoto => {
        const cam = item.camera || {};
        const camName = typeof cam === 'string' ? cam : (cam.instrument || cam.filter_name || 'UNKNOWN');
        let imageUrl = item.image_files?.full_res || item.https_url || item.url || '';
        imageUrl = imageUrl.replace('http://', 'https://');

        return {
            id: parseInt(item.imageid || item.id || '0', 10),
            sol: parseInt(item.sol || '0', 10),
            camera: {
                id: 0,
                name: camName.toUpperCase(),
                rover_id: 0,
                full_name: camName,
            },
            img_src: imageUrl,
            earth_date: item.date_taken_utc ? item.date_taken_utc.split('T')[0] :
                item.date_taken ? item.date_taken.split('T')[0] : 'Unknown',
            rover: {
                id: 8,
                name: 'Perseverance',
                landing_date: '2021-02-18',
                launch_date: '2020-07-30',
                status: 'active',
            },
        };
    });
}

/**
 * Main entry point — fetches Mars rover photos from NASA internal endpoints.
 * These are the same endpoints used by the official NASA raw images pages.
 */
export async function getMarsRoverPhotos(
    rover: RoverName,
    sol?: number,
    earthDate?: string,
    camera?: CameraName,
    page: number = 0
): Promise<MarsPhotosResponse> {

    console.log(`[Mars] getMarsRoverPhotos → rover=${rover}, sol=${sol}, earthDate=${earthDate}, camera=${camera}, page=${page}`);

    // Camera validation
    if (camera) {
        const validCameras = ROVER_CAMERAS[rover];
        if (!validCameras.includes(camera)) {
            console.warn(`[Mars] Invalid camera '${camera}' for ${rover}. Ignoring filter.`);
            camera = undefined;
        }
    }

    // Note: earthDate filtering is not directly supported by internal APIs, log a warning
    if (earthDate) {
        console.warn('[Mars] earth_date filtering is approximate on internal NASA APIs.');
    }

    try {
        let photos: MarsPhoto[];

        if (rover === 'perseverance') {
            photos = await fetchPerseverancePhotos(sol, camera, page);
        } else {
            photos = await fetchCuriosityPhotos(sol, camera, page);
        }

        // Filter out remaining thumbnails
        photos = photos.filter(p => p.img_src && !p.img_src.includes('-thm'));

        return { photos: getPreferredPhotos(photos) };
    } catch (e) {
        console.error(`[Mars] Error fetching photos for ${rover}:`, e);
        return { photos: [] };
    }
}
