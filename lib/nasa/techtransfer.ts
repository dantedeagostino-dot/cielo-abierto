const TECHTRANSFER_BASE_URL = 'https://api.nasa.gov/techtransfer';

export async function searchPatents(query: string): Promise<any[]> {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';

    // endpoint: /patent/?q=engine&api_key=DEMO_KEY
    const response = await fetch(`${TECHTRANSFER_BASE_URL}/patent/?q=${query}&api_key=${apiKey}`, {
        next: { revalidate: 86400 },
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch patents: ${response.statusText}`);
    }

    const data = await response.json();
    // Structure: { count: 123, results: [[id, code, title, ...], ...] }
    // We need to map the array results to objects if possible, but the API returns arrays.
    // Let's just return the raw results or slice them.

    return data.results.slice(0, 5).map((item: any[]) => ({
        id: item[0],
        code: item[1],
        title: item[2],
        description: item[3],
        type: item[5],
    }));
}
