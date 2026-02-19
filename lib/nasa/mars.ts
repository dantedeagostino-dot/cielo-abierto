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

    return (await fetchFromNASA(`${MARS_ROVER_BASE_URL}/${rover}/photos`, params, {
        next: { revalidate: 3600 },
    })) as MarsPhotosResponse;
}
