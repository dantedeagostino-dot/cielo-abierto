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
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    try {
        const response = await fetch(`${EPIC_AVAILABLE_URL}?api_key=${apiKey}`, {
            next: { revalidate: 43200 }, // Cache for 12 hours
        });

        if (!response.ok) {
            console.warn(`Failed to fetch EPIC available dates: ${response.statusText}`);
            return [];
        }

        const dates: string[] = await response.json();
        return dates;
    } catch (error) {
        console.error("Error fetching EPIC available dates:", error);
        return [];
    }
}

async function fetchEPICImagesByDate(date: string): Promise<EPICImage[]> {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    // Date input from availability is usually YYYY-MM-DD
    const response = await fetch(`${EPIC_BASE_URL}?api_key=${apiKey}&date=${date}`, {
        next: { revalidate: 3600 }, // Cache specific date results for 1 hour
    });

    if (!response.ok) {
        // If 404 or other error, return empty array to trigger fallback/handling upstream
        if (response.status === 404) return [];
        throw new Error(`Failed to fetch EPIC images for date ${date}: ${response.statusText}`);
    }

    const data: EPICImage[] = await response.json();

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
}

export async function getEPICImages(date?: string): Promise<EPICImage[]> {
    // 1. If a specific date is requested, try to fetch it directly.
    if (date) {
        return await fetchEPICImagesByDate(date);
    }

    // 2. If no date is provided, try to get the most recent available date from the API.
    const availableDates = await getAvailableDates();
    if (availableDates.length > 0) {
        const latestDate = availableDates[availableDates.length - 1]; // "last" date in array is usually the most recent
        const images = await fetchEPICImagesByDate(latestDate);
        if (images.length > 0) return images;
    }

    // 3. Fallback Mechanism (Robustness)
    // If availability check failed or returned empty/invalid data, fallback to checking recent days manually.
    // Strategy: Check Today, then -1 day, -2 days, -3 days.
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
            // Ignore fetch errors during fallback and try next date
            console.warn(`EPIC fallback attempt failed for ${formattedDate}:`, e);
            continue;
        }
    }

    // 4. If all attempts fail, throw the specific maintenance error.
    // The user requested a capturable exception object. Since we are in a helper function, 
    // we should throw an Error that the tool wrapper or route handler can catch and format.
    // However, the requirement says "return: { error: ... }" in the exception context.
    // To fit the tool pattern (which often returns object with error key on catch), 
    // we will throw an error with the specific message, and the tool wrapper catches it.
    throw new Error(JSON.stringify({
        error: "DSCOVR_MAINTENANCE",
        message: "Los datos del satélite DSCOVR se encuentran en procesamiento o mantenimiento técnico."
    }));
}
