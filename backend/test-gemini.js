import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
].filter(Boolean);

console.log(`Testing with ${API_KEYS.length} keys...`);

async function test() {
    for (const apiKey of API_KEYS) {
        console.log(`\n--- Testing Key: ...${apiKey.slice(-5)} ---`);
        const ai = new GoogleGenAI({ apiKey });
        for (const model of ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-flash-8b']) {
            try {
                console.log(`Trying ${model}...`);
                const response = await ai.models.generateContent({
                    model,
                    contents: [{ role: 'user', parts: [{ text: 'Say "hello world" and nothing else.' }] }]
                });
                console.log('SUCCESS!');
                console.log(response.text);
                return;
            } catch (err) {
                console.error(`FAILED on ${model}: ${err.status} - ${err.message}`);
            }
        }
    }
}
test();
