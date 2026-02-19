
import { getMarsWeather } from '@/lib/nasa/insight';

async function test() {
    try {
        console.log('Testing getMarsWeather...');
        const result = await getMarsWeather();
        console.log('Result:', result);
    } catch (error) {
        console.error('Error:', error);
    }
}

test();
