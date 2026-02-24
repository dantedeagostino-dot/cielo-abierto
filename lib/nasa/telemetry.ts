
interface FetchOptions extends RequestInit {
    /** Skip appending NASA API key (for APIs that don't require one) */
    skipApiKey?: boolean;
}

export async function fetchFromNASA(url: string, params: Record<string, string> = {}, init?: FetchOptions) {
    const apiKey = process.env.NASA_API_KEY;
    const isDemo = !apiKey || apiKey === 'DEMO_KEY';
    const skipApiKey = init?.skipApiKey ?? false;

    if (!skipApiKey) {
        console.log(`[NASA API] Using Key: ${isDemo ? 'DEMO_KEY' : (apiKey?.substring(0, 5) + '...')}`);
    }

    const query = new URLSearchParams(params);
    if (!skipApiKey && !query.has('api_key')) {
        query.append('api_key', apiKey || 'DEMO_KEY');
    }

    const queryString = query.toString();
    const fullUrl = queryString ? `${url}?${queryString}` : url;
    const maskedUrl = apiKey ? fullUrl.replace(apiKey, '***') : fullUrl;
    console.log(`[NASA API] Fetching: ${maskedUrl}`);

    const startTime = Date.now();
    // Extract skipApiKey from init so it doesn't get passed to fetch
    const { skipApiKey: _, ...fetchInit } = init || {};

    try {
        const response = await fetch(fullUrl, {
            ...fetchInit,
            headers: {
                ...fetchInit?.headers,
                'User-Agent': 'CieloAbierto/1.0',
            }
        });
        const duration = Date.now() - startTime;

        // Telemetry Logging
        console.log('--- [NASA API Telemetry] ---');
        console.log(`URL: ${maskedUrl}`);
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

        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('text/html')) {
            const htmlBody = await response.text();
            console.error(`[NASA API Error] Received HTML instead of JSON: ${htmlBody.substring(0, 200)}...`);
            throw new Error(`NASA API returned HTML instead of JSON. Possible rate limit or gateway error.`);
        }

        return await response.json();
    } catch (error) {
        console.error('[NASA API Network Error]', error);
        throw error;
    }
}
