import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
].filter(Boolean);

async function test() {
    const ai = new GoogleGenAI({ apiKey: API_KEYS[0] });
    for (const model of ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']) {
        try {
            const response = await ai.models.generateContent({
                model,
                contents: [{ role: 'user', parts: [{ text: 'hi' }] }]
            });
            console.log(`SUCCESS: ${model}`);
        } catch (err) {
            console.log(`FAILED: ${model} -> ${err.status}`);
        }
    }
}
test();
