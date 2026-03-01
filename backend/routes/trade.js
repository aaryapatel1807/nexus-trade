import express from 'express';
import prisma from '../prisma.js';
import jwt from 'jsonwebtoken';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'nexus-trade-super-secret-key-change-me';

// Auth Middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: 'Access denied' });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: 'Invalid or expired token' });
        req.user = user;
        next();
    });
};

// Execute Trade Route
router.post('/execute', authenticateToken, async (req, res) => {
    const { symbol, type, quantity, price } = req.body;
    const userId = req.user.id;

    if (!symbol || !type || !quantity || !price) {
        return res.status(400).json({ error: 'Symbol, type (BUY/SELL), quantity, and price are required' });
    }

    const qty = parseInt(quantity, 10);
    const prc = parseFloat(price);
    const totalValue = qty * prc;

    if (qty <= 0 || prc <= 0) {
        return res.status(400).json({ error: 'Invalid quantity or price' });
    }

    try {
        // Start an atomic DB Transaction
        const result = await prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });

            // Handle BUY Strategy
            if (type.toUpperCase() === 'BUY') {
                if (user.cashBalance < totalValue) {
                    throw new Error('Insufficient Funds');
                }

                // Deduct Cash
                await tx.user.update({
                    where: { id: userId },
                    data: { cashBalance: { decrement: totalValue } }
                });

                // Add to Portfolio (Upsert)
                const existingStock = await tx.portfolio.findUnique({
                    where: { userId_symbol: { userId, symbol } }
                });

                let newAvgPrice = prc;
                if (existingStock && existingStock.quantity > 0) {
                    // Calculate new moving average cost
                    const oldTotalValue = existingStock.quantity * existingStock.averagePrice;
                    newAvgPrice = (oldTotalValue + totalValue) / (existingStock.quantity + qty);
                }

                await tx.portfolio.upsert({
                    where: { userId_symbol: { userId, symbol } },
                    update: {
                        quantity: { increment: qty },
                        averagePrice: newAvgPrice
                    },
                    create: {
                        userId, symbol, quantity: qty, averagePrice: newAvgPrice
                    }
                });

                // Handle SELL Strategy
            } else if (type.toUpperCase() === 'SELL') {
                const stock = await tx.portfolio.findUnique({
                    where: { userId_symbol: { userId, symbol } }
                });

                if (!stock || stock.quantity < qty) {
                    throw new Error('Insufficient Shares for sale');
                }

                // Add Cash
                await tx.user.update({
                    where: { id: userId },
                    data: { cashBalance: { increment: totalValue } }
                });

                // Deduct from Portfolio
                if (stock.quantity === qty) {
                    // Full liquidation, delete row
                    await tx.portfolio.delete({ where: { userId_symbol: { userId, symbol } } });
                } else {
                    await tx.portfolio.update({
                        where: { userId_symbol: { userId, symbol } },
                        data: { quantity: { decrement: qty } }
                    });
                }
            } else {
                throw new Error('Type must be BUY or SELL');
            }

            // Create Transaction History Log
            const receipt = await tx.transaction.create({
                data: {
                    userId,
                    symbol,
                    type: type.toUpperCase(),
                    quantity: qty,
                    price: prc
                }
            });

            return receipt;
        });

        res.json({ success: true, transaction: result });

    } catch (err) {
        console.error("Trade Execution Failed:", err);
        res.status(400).json({ error: err.message || 'Trade execution failed' });
    }
});

// Get User Portfolio
router.get('/portfolio', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const portfolio = await prisma.portfolio.findMany({ where: { userId } });
        res.json(portfolio);
    } catch (err) {
        console.error("Failed fetching portfolio:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// Get Trade History
router.get('/history', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const trades = await prisma.transaction.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 100
        });
        res.json(trades);
    } catch (err) {
        console.error("Failed fetching trade history:", err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

export default router;
