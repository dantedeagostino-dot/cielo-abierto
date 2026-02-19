
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function listModelsDirectly() {
    const apiKey = process.env.GOOGLE_API_KEY;
    if (!apiKey) {
        console.error('GOOGLE_API_KEY missing');
        return;
    }

    // Try both v1beta and v1 endpoints
    const versions = ['v1beta', 'v1'];

    for (const v of versions) {
        console.log(`\n--- Listing models for API version: ${v} ---`);
        try {
            const response = await fetch(`https://generativelanguage.googleapis.com/${v}/models?key=${apiKey}`);
            if (!response.ok) {
                console.error(`Error ${response.status}: ${response.statusText}`);
                const text = await response.text();
                console.error('Body:', text);
                continue;
            }

            const data = await response.json();
            if (data.models) {
                data.models.forEach((m: any) => {
                    // Filter only for generating content
                    if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                        console.log(`- ${m.name} (${m.displayName})`);
                    }
                });
            } else {
                console.log('No models found in response.');
            }
        } catch (e: any) {
            console.error('Fetch error:', e.message);
        }
    }
}

listModelsDirectly();
