import { fetchFromNASA } from './telemetry';
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
  const queryParams: Record<string, string> = {
    thumbs: 'true', // Get video thumbnails
  };

  if (date) {
    queryParams.date = date;
  }

  return (await fetchFromNASA(APOD_BASE_URL, queryParams, {
    next: { revalidate: 3600 }, // Cache for 1 hour
  })) as ApodResponse;
}
