const EPIC_BASE_URL = 'https://api.nasa.gov/EPIC/api/natural/images';
const EPIC_ARCHIVE_URL = 'https://epic.gsfc.nasa.gov/archive/natural';

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

export async function getEPICImages(): Promise<EPICImage[]> {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

    // Fetch latest available images
    const response = await fetch(`${EPIC_BASE_URL}?api_key=${apiKey}`, {
        next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch EPIC images: ${response.statusText}`);
    }

    const data: EPICImage[] = await response.json();

    // Construct the image URL for the frontend
    // Format: https://epic.gsfc.nasa.gov/archive/natural/2015/10/31/png/epic_1b_20151031074844.png
    return data.map(item => {
        const date = new Date(item.date);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');

        return {
            ...item,
            file_url: `${EPIC_ARCHIVE_URL}/${year}/${month}/${day}/png/${item.image}.png`
        };
    });
}
