const EXOPLANET_BASE_URL = 'https://exoplanetarchive.ipac.caltech.edu/TAP/sync';

export async function queryExoplanets(limit: number = 5): Promise<any[]> {
    // TAP Query
    // select top 5 pl_name, hostname, discoverymethod, disc_year, pl_rade, pl_masse from ps
    const query = `select top ${limit} pl_name, hostname, discoverymethod, disc_year, pl_rade, pl_masse from ps order by disc_year desc`;

    const queryParams = new URLSearchParams({
        query: query,
        format: 'json',
    });

    const response = await fetch(`${EXOPLANET_BASE_URL}?${queryParams.toString()}`, {
        next: { revalidate: 86400 }, // Cache for 24 hours
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch Exoplanet data: ${response.statusText}`);
    }

    return response.json();
}
