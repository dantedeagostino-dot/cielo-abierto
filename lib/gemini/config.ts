import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GOOGLE_API_KEY;

if (!apiKey) {
    console.warn('Missing GOOGLE_API_KEY environment variable. AI features will not work.');
}

export const genAI = new GoogleGenerativeAI(apiKey || 'dummy-key');

export const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash-latest',
});
