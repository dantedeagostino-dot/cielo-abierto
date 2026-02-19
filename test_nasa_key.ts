
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testNasaKey() {
    const apiKey = process.env.NASA_API_KEY || 'DEMO_KEY';
    console.log(`Testing with API Key: ${apiKey === 'DEMO_KEY' ? 'DEMO_KEY' : 'CONFIGURED KEY (Hidden)'}`);

    const url = `https://api.nasa.gov/planetary/apod?api_key=${apiKey}`;

    try {
        const response = await fetch(url);
        console.log(`Status: ${response.status} ${response.statusText}`);

        // Check Rate Limit Headers
        const limit = response.headers.get('X-RateLimit-Limit');
        const remaining = response.headers.get('X-RateLimit-Remaining');

        console.log('--- Rate Limits ---');
        console.log(`Limit: ${limit}`);
        console.log(`Remaining: ${remaining}`);

        if (!response.ok) {
            const text = await response.text();
            console.error('Error Body:', text);
        } else {
            console.log('Success! Key is valid.');
        }

    } catch (error) {
        console.error('Network Error:', error);
    }
}

testNasaKey();
