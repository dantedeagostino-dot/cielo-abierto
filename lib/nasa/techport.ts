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
    // TechPort does not require an API Key? It seems open, but let's check.
    // Documentation says "No API key is required".

    // Search endpoint: /api/projects?search=query
    const response = await fetch(`${TECHPORT_BASE_URL}?search=${query}`, {
        next: { revalidate: 86400 },
    });

    if (!response.ok) {
        // Fallback or throw
        throw new Error(`Failed to fetch TechPort projects: ${response.statusText}`);
    }

    const data = await response.json();
    // detailed project data might require ID lookup, but let's see what search returns
    // Search returns list of projects.

    // Map response to simple structure
    return data.projects.slice(0, 5).map((p: any) => ({
        id: p.projectId,
        title: p.title,
        description: p.description, // might be missing in list view
        status: p.status,
    }));
}
