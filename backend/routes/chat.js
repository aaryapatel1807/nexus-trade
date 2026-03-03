import express from 'express';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import prisma from '../prisma.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in .env or your deployment platform.');
}

// Models ordered by quality (will try each on rate limit)
const MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];

// Collect all available API keys (supports unlimited keys)
const API_KEYS = [
    process.env.GEMINI_API_KEY,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
].filter(Boolean); // remove empty/undefined keys

console.log(`[AI] Loaded ${API_KEYS.length} Gemini API key(s). ${API_KEYS.length * 1500} requests/day capacity.`);

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'Access denied' });
    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid token' });
        req.user = user;
        next();
    });
};

router.post('/ask', authenticateToken, async (req, res) => {
    try {
        const { messages } = req.body;

        if (API_KEYS.length === 0) {
            return res.status(500).json({ error: "GEMINI_API_KEY is missing from .env configuration." });
        }

        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: "Invalid dialogue format." });
        }

        // Fetch user + portfolio for personalized context
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { portfolios: true }
        });

        const portfolioStr = user.portfolios.length > 0
            ? user.portfolios.map(p => `${p.quantity} shares of ${p.symbol} @ ₹${p.averagePrice.toFixed(2)} avg`).join(', ')
            : 'No active stock holdings.';

        const systemInstruction = `You are 'Nexus', an elite AI financial advisor and trading analyst for the Indian (NSE/BSE) and global stock markets.
Your user is ${user.name || 'Trader'}. Cash Balance: ₹${parseFloat(user.cashBalance).toLocaleString('en-IN')}.
Portfolio: ${portfolioStr}.
Provide direct, actionable, data-driven insights in a professional yet conversational tone.
If they ask to buy or sell stocks, remind them they can do so on the Dashboard Trade Terminal.
Format your answers in markdown. Add disclaimers for high-risk recommendations.`;

        const geminiMessages = messages.map(msg => ({
            role: msg.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: msg.content }]
        }));

        // Try every key × every model until one succeeds
        for (const apiKey of API_KEYS) {
            // Validate API key before use
            if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
                console.warn('[AI] Skipping invalid API key format');
                continue;
            }
            const ai = new GoogleGenAI({ apiKey });
            for (const model of MODELS) {
                try {
                    const response = await ai.models.generateContent({
                        model,
                        contents: geminiMessages,
                        config: { systemInstruction, temperature: 0.7 }
                    });
                    console.log(`[AI] Response via key[${API_KEYS.indexOf(apiKey) + 1}] model[${model}]`);
                    return res.json({ reply: response.text });
                } catch (err) {
                    if (err.status === 429) {
                        console.warn(`[AI] 429 on key[${API_KEYS.indexOf(apiKey) + 1}] model[${model}] — trying next...`);
                        continue;
                    }
                    throw err; // non-quota error, don't retry
                }
            }
        }

        // All keys + models exhausted
        console.error('[AI] All API keys and models are quota-limited.');
        return res.status(429).json({
            error: 'RATE_LIMIT',
            message: 'All AI API keys have hit their daily quota. Add more keys in backend/.env or wait for midnight reset.'
        });

    } catch (error) {
        console.error('AI Generation Error:', error.status, error.message?.substring(0, 120));
        if (error.status === 429) {
            return res.status(429).json({ error: 'RATE_LIMIT', message: 'AI rate limit reached.' });
        }
        res.status(500).json({ error: 'Failed to process AI conversation.' });
    }
});

export default router;
