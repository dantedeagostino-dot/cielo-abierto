export const APOD_BASE_URL = 'https://api.nasa.gov/planetary/apod';

export interface ApodResponse {
  copyright?: string;
  date: string;
  explanation: string;
  hdurl?: string;
  media_type: 'image' | 'video';
  service_version: string;
  title: string;
  url: string;
  thumbnail_url?: string; // For video thumbnails if available
}

export async function getAPOD(date?: string): Promise<ApodResponse> {
  const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
  const queryParams = new URLSearchParams({
    api_key: apiKey,
    thumbs: 'true', // Get video thumbnails
  });

  if (date) {
    queryParams.append('date', date);
  }

  const response = await fetch(`${APOD_BASE_URL}?${queryParams.toString()}`, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch APOD: ${response.statusText}`);
  }

  return response.json();
}
