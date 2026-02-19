import { fetchFromNASA } from './telemetry';

export const MARS_ROVER_BASE_URL = 'https://api.nasa.gov/mars-photos/api/v1/rovers';

export type RoverName = 'curiosity' | 'opportunity' | 'spirit' | 'perseverance';
export type CameraName = 'FHAZ' | 'RHAZ' | 'MAST' | 'CHEMCAM' | 'MAHLI' | 'MARDI' | 'NAVCAM' | 'PANCAM' | 'MINITES';

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

export async function getMarsRoverPhotos(
    rover: RoverName,
    sol: number = 1000,
    camera?: CameraName
): Promise<MarsPhotosResponse> {
    const params: Record<string, string> = {
        sol: sol.toString(),
    };

    if (camera) {
        params.camera = camera;
    }

    try {
        const response: any = await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover}/photos`, params, {
            next: { revalidate: 3600 },
        });

        const data = response as MarsPhotosResponse;
        if (!data.photos || data.photos.length === 0) {
            console.log(`[Mars API] No photos found for ${rover} on Sol ${params.sol}. Trying fallback Sol 10...`);
            // Fallback to Sol 10 if no photos (some rovers might not have photos on Sol 1000)
            const fallbackParams = { ...params, sol: '100' }; // Use 100 as a safer bet than 10 or 1000
            return (await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover}/photos`, fallbackParams, {
                next: { revalidate: 3600 },
            })) as MarsPhotosResponse;
        }

        return data;
    } catch (e) {
        console.error(`[Mars API] Error fetching photos for ${rover} on Sol ${params.sol}:`, e);
        // Fallback on error too
        const fallbackParams = { ...params, sol: '100' };
        return (await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover}/photos`, fallbackParams, {
            next: { revalidate: 3600 },
        })) as MarsPhotosResponse;
    }
}
