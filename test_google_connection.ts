
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const models = [
    'gemini-1.5-flash',
    'gemini-1.5-flash-latest',
    'gemini-1.5-flash-001',
    'gemini-1.5-flash-002',
    'gemini-1.5-pro',
    'gemini-pro'
];

async function testModels() {
    console.log('--- Testing Models ---');
    if (!process.env.GOOGLE_API_KEY) {
        console.error('GOOGLE_API_KEY is missing');
        return;
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    for (const modelName of models) {
        try {
            console.log(`Testing ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Hello");
            console.log(`[SUCCESS] ${modelName}`);
        } catch (error: any) {
            console.log(`[FAILED] ${modelName}: ${error.message.split('\n')[0]}`);
        }
    }
}

testModels();
