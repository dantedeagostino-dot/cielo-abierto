
export async function fetchFromNASA(url: string, params: Record<string, string> = {}, init?: RequestInit) {
    const apiKey = process.env.NASA_API_KEY;
    const isDemo = !apiKey || apiKey === 'DEMO_KEY';

    // Log key usage (masked)
    console.log(`[NASA API] Using Key: ${isDemo ? 'DEMO_KEY' : (apiKey?.substring(0, 5) + '...')}`);

    const query = new URLSearchParams(params);
    if (!query.has('api_key')) {
        query.append('api_key', apiKey || 'DEMO_KEY');
    }

    const fullUrl = `${url}?${query.toString()}`;
    console.log(`[NASA API] Fetching: ${fullUrl.replace(apiKey || 'DEMO_KEY', '***')}`);

    const startTime = Date.now();
    try {
        const response = await fetch(fullUrl, {
            ...init,
            headers: {
                ...init?.headers,
                'User-Agent': 'CieloAbierto/1.0',
            }
        });
        const duration = Date.now() - startTime;

        // Telemetry Logging
        console.log('--- [NASA API Telemetry] ---');
        console.log(`URL: ${fullUrl.replace(apiKey || 'DEMO_KEY', '***')}`);
        console.log(`Duration: ${duration}ms`);
        console.log(`Status: ${response.status} ${response.statusText}`);
        console.log(`X-RateLimit-Limit: ${response.headers.get('X-RateLimit-Limit')}`);
        console.log(`X-RateLimit-Remaining: ${response.headers.get('X-RateLimit-Remaining')}`);
        console.log('----------------------------');

        if (!response.ok) {
            const errorBody = await response.text();
            console.error(`[NASA API Error] Body: ${errorBody}`);
            throw new Error(`NASA API Error (${response.status}): ${errorBody}`);
        }

        return response.json();
    } catch (error) {
        console.error('[NASA API Network Error]', error);
        throw error;
    }
}
