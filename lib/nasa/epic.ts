import { fetchFromNASA } from './telemetry';

const EPIC_BASE_URL = 'https://api.nasa.gov/EPIC/api/natural/images';
const EPIC_ARCHIVE_URL = 'https://epic.gsfc.nasa.gov/archive/natural';
const EPIC_AVAILABLE_URL = 'https://api.nasa.gov/EPIC/api/natural/available';

export interface EPICImage {
    identifier: string;
    caption: string;
    image: string;
    version: string;
    date: string;
    centroid_coordinates: {
        lat: number;
        lon: number;
    };
    dscovr_j2000_position: {
        x: number;
        y: number;
        z: number;
    };
    file_url?: string; // Constructed URL
}

async function getAvailableDates(): Promise<string[]> {
    try {
        const dates: string[] = await fetchFromNASA(EPIC_AVAILABLE_URL, {}, {
            next: { revalidate: 43200 },
        } as any);
        return dates;
    } catch (error) {
        console.warn('Failed to fetch EPIC available dates:', error);
        return [];
    }
}

async function fetchEPICImagesByDate(date: string): Promise<EPICImage[]> {
    try {
        const data: EPICImage[] = await fetchFromNASA(EPIC_BASE_URL, { date }, {
            next: { revalidate: 3600 },
        } as any);

        return data.map(item => {
            const dateObj = new Date(item.date);
            const year = dateObj.getFullYear();
            const month = String(dateObj.getMonth() + 1).padStart(2, '0');
            const day = String(dateObj.getDate()).padStart(2, '0');

            return {
                ...item,
                file_url: `${EPIC_ARCHIVE_URL}/${year}/${month}/${day}/png/${item.image}.png`
            };
        });
    } catch (error: any) {
        // If 404, return empty array to trigger fallback
        if (error.message?.includes('404')) return [];
        throw error;
    }
}

export async function getEPICImages(date?: string): Promise<EPICImage[]> {
    // 1. If a specific date is requested, try to fetch it directly.
    if (date) {
        return await fetchEPICImagesByDate(date);
    }

    // 2. If no date is provided, try to get the most recent available date from the API.
    const availableDates = await getAvailableDates();
    if (availableDates.length > 0) {
        const latestDate = availableDates[availableDates.length - 1];
        const images = await fetchEPICImagesByDate(latestDate);
        if (images.length > 0) return images;
    }

    // 3. Fallback: Check recent days manually (Today, -1, -2, -3).
    const MAX_RETRIES = 3;
    const now = new Date();

    for (let i = 0; i <= MAX_RETRIES; i++) {
        const targetDate = new Date(now);
        targetDate.setDate(now.getDate() - i);

        const year = targetDate.getFullYear();
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const day = String(targetDate.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;

        try {
            const images = await fetchEPICImagesByDate(formattedDate);
            if (images.length > 0) {
                return images;
            }
        } catch (e) {
            console.warn(`EPIC fallback attempt failed for ${formattedDate}:`, e);
            continue;
        }
    }

    throw new Error(JSON.stringify({
        error: "DSCOVR_MAINTENANCE",
        message: "Los datos del satélite DSCOVR se encuentran en procesamiento o mantenimiento técnico."
    }));
}
