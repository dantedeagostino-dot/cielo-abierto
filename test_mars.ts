import { getMarsRoverPhotos } from './lib/nasa/mars';

async function test() {
    console.log("Testing Curiosity...");
    const curiosity = await getMarsRoverPhotos('curiosity');
    console.log(`Curiosity found: ${curiosity.photos.length} photos`);

    console.log("Testing Perseverance...");
    const perseverance = await getMarsRoverPhotos('perseverance');
    console.log(`Perseverance found: ${perseverance.photos.length} photos`);
}

test().catch(console.error);
