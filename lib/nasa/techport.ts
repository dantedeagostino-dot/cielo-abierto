import { fetchFromNASA } from './telemetry';

const TECHPORT_BASE_URL = 'https://techport.nasa.gov/api/projects';

export interface TechProject {
    id: number;
    title: string;
    description: string;
    status: string;
    startDate: string;
    endDate: string;
}

export async function searchTechProjects(query: string): Promise<TechProject[]> {
    // TechPort does not require an API Key
    const data = await fetchFromNASA(TECHPORT_BASE_URL, {
        search: query,
    }, {
        skipApiKey: true,
        next: { revalidate: 86400 },
    } as any);

    return data.projects.slice(0, 5).map((p: any) => ({
        id: p.projectId,
        title: p.title,
        description: p.description,
        status: p.status,
    }));
}
