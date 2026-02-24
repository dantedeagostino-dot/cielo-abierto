import { fetchFromNASA } from './telemetry';

const TECHTRANSFER_BASE_URL = 'https://api.nasa.gov/techtransfer';

export async function searchPatents(query: string): Promise<any[]> {
    const data = await fetchFromNASA(`${TECHTRANSFER_BASE_URL}/patent/`, {
        q: query,
    }, {
        next: { revalidate: 86400 },
    } as any);

    return data.results.slice(0, 5).map((item: any[]) => ({
        id: item[0],
        code: item[1],
        title: item[2],
        description: item[3],
        type: item[5],
    }));
}
