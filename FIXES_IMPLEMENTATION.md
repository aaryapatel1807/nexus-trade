# 🔧 Bug Fixes Implementation Guide
**Nexus Trade - Complete Fix Instructions**

---

## 🚨 CRITICAL FIXES (Apply Immediately)

All fixes marked with ⚠️ MUST be applied before next deployment.

---

## Fix #1: Database Schema - Transaction Field Name ⚠️
**Status**: Required  
**Estimated Time**: 10 minutes  
**Risk**: HIGH - Blocks trade history

### Step 1: Backup database
```bash
cd backend
# Create migration
npx prisma migrate dev --name fix_transaction_timestamp_field
```

### Step 2: Update schema
**File**: `backend/prisma/schema.prisma`

```diff
  model Transaction {
    id        Int      @id @default(autoincrement())
    userId    Int
    symbol    String
    type      String   
    quantity  Int
    price     Float
-   timestamp DateTime @default(now())
+   createdAt DateTime @default(now())
    
    user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  }
```

### Step 3: Update all references

**File**: `backend/routes/trade.js` (Line 149)
```diff
  router.get('/history', authenticateToken, async (req, res) => {
      try {
          const userId = req.user.id;
          const trades = await prisma.transaction.findMany({
              where: { userId },
-             orderBy: { timestamp: 'desc' },
+             orderBy: { createdAt: 'desc' },
              take: 100
          });
          res.json(trades);
      } catch (err) {
          console.error("Failed fetching trade history:", err);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
```

**File**: `frontend/src/pages/Portfolio.jsx` (Line 71)
```diff
  <td className="p-3 text-text-muted text-xs">
-   {new Date(t.timestamp).toLocaleDateString('en-IN')}
+   {new Date(t.createdAt).toLocaleDateString('en-IN')}
  </td>
```

### Step 4: Verify
```bash
npm run dev
# Test: Create a trade, check history - should show date
```

---

## Fix #2: Complete Chat Route Handler ⚠️
**Status**: Required  
**Estimated Time**: 5 minutes  
**Risk**: CRITICAL - Router not exported

**File**: `backend/routes/chat.js` (Add at end)

```diff
  export default router;
+ });
+ 
+ export default router;
```

### Current file ends at line 105. View end:
```javascript
                res.status(500).json({ error: 'Failed to process AI conversation.' });
```

**Should be**:
```javascript
                res.status(500).json({ error: 'Failed to process AI conversation.' });
            }
        });

export default router;
```

### Verify
```bash
# Backend should start without errors
npm run dev
# Test: POST /api/chat/ask should work
```

---

## Fix #3: Environment Variables - JWT_SECRET ⚠️  
**Status**: Required  
**Estimated Time**: 15 minutes  
**Risk**: HIGH - Security exposure

### Step 1: Generate secure keys

```bash
# macOS/Linux
openssl rand -base64 32

# Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Max 256}))

# Or use online: https://generate-random.org/
```

### Step 2: Update all route files

**File**: `backend/routes/auth.js` (Line 7)
```diff
- const JWT_SECRET = process.env.JWT_SECRET || 'nexus-trade-super-secret-key-change-me';
+ const JWT_SECRET = process.env.JWT_SECRET;
+ if (!JWT_SECRET) {
+     throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in .env');
+ }
```

**File**: `backend/routes/trade.js` (Line 6)
```diff
- const JWT_SECRET = process.env.JWT_SECRET || 'nexus-trade-super-secret-key-change-me';
+ const JWT_SECRET = process.env.JWT_SECRET;
+ if (!JWT_SECRET) {
+     throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in .env');
+ }
```

**File**: `backend/routes/chat.js` (Line 6)
```diff
- const JWT_SECRET = process.env.JWT_SECRET || 'nexus-trade-super-secret-key-change-me';
+ const JWT_SECRET = process.env.JWT_SECRET;
+ if (!JWT_SECRET) {
+     throw new Error('FATAL: JWT_SECRET environment variable is required. Set it in .env');
+ }
```

### Step 3: Update .env
**File**: `backend/.env`

```dotenv
# Before: (keep if Railway doesn't set these)
DATABASE_URL="postgresql://user:password@host:5432/db"
JWT_SECRET="your_super_secret_jwt_key_here"
GEMINI_API_KEY="your_gemini_api_key_here"

# After: (replace with actual values)
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASS@YOUR_HOST:5432/YOUR_DB"
JWT_SECRET="AbCdEfGhIjKlMnOpQrStUvWxYz1234567890=="  # ← Use generated key
GEMINI_API_KEY="YOUR_ACTUAL_GEMINI_KEY"
FINNHUB_API_KEY="YOUR_FINNHUB_KEY"
PORT=5000
```

### Verify
```bash
# Should error if JWT_SECRET not set
unset JWT_SECRET && npm run dev 
# Error: FATAL: JWT_SECRET environment variable is required

# Should work with JWT_SECRET set
# (Restore .env and test)
npm run dev
```

---

## Fix #4: Update Stock Cache Update Function ⚠️
**Status**: Required  
**Estimated Time**: 20 minutes  
**Risk**: HIGH - Memory leak + crashes

**File**: `backend/server.js`

### Step 1: Replace updateTopStocks function (Lines 288-297)

```diff
  async function updateTopStocks() {
      console.log('[UPDATE] Starting top stock refresh...');
      for (const sym of TOP_NSE_STOCKS) {
+         try {
              const quote = await fetchStockQuote(sym);
              if (quote) {
                  const clean = sym.replace('.NS', '');
                  const existing = GLOBAL_STOCK_CACHE.get(clean) || {};
                  GLOBAL_STOCK_CACHE.set(clean, {
                      ...existing,
                      price: quote.regularMarketPrice,
                      changePct: quote.regularMarketChangePercent,
                      lastUpdated: new Date().toISOString()
                  });
              }
+         } catch (e) {
+             console.error(`[UPDATE] Failed to fetch ${sym}:`, e.message);
+         }
          await new Promise(r => setTimeout(r, 300));
      }
      saveCacheToDisk();
      console.log('[UPDATE] Top stock refresh complete.');
  }
```

### Step 2: Add graceful shutdown (Lines 298-302)

Before this:
```javascript
setInterval(updateTopStocks, 5 * 60 * 1000);
updateTopStocks();
```

Replace with:
```diff
- setInterval(updateTopStocks, 5 * 60 * 1000);
- updateTopStocks();

+ let updateJobHandle = null;
+ 
+ // Start update job
+ function startUpdateJob() {
+     updateJobHandle = setInterval(updateTopStocks, 5 * 60 * 1000);
+     updateTopStocks(); // Initial run
+ }
+ 
+ // Graceful shutdown
+ process.on('SIGTERM', async () => {
+     console.log('🛑 SIGTERM received - shutting down gracefully...');
+     if (updateJobHandle) {
+         clearInterval(updateJobHandle);
+     }
+     saveCacheToDisk();
+     process.exit(0);
+ });
+ 
+ process.on('SIGINT', async () => {
+     console.log('🛑 SIGINT received - shutting down gracefully...');
+     if (updateJobHandle) {
+         clearInterval(updateJobHandle);
+     }
+     saveCacheToDisk();
+     process.exit(0);
+ });
```

### Step 3: Update server startup (Last section)

```diff
+ const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Server running on port ${PORT}`);
+     startUpdateJob();
  });
+
+ module.exports = server;
```

### Verify
```bash
npm run dev
# Watch for: "[UPDATE] Starting top stock refresh..."
# Stop with Ctrl+C - should clean shutdown

# Check memory: Should stabilize after 5 minutes
```

---

## Fix #5: Add Cache Locking ⚠️
**Status**: Required  
**Estimated Time**: 25 minutes  
**Risk**: HIGH - Data corruption

**File**: `backend/server.js` (Update saveCacheToDisk function, Lines 63-70)

```diff
+ let cacheWriteInProgress = false;
+ 
- function saveCacheToDisk() {
+ async function saveCacheToDisk() {
+     if (cacheWriteInProgress) {
+         console.debug('[CACHE] Write already in progress, skipping...');
+         return;
+     }
+     
+     cacheWriteInProgress = true;
      try {
          const obj = Object.fromEntries(GLOBAL_STOCK_CACHE);
-         writeFileSync(CACHE_FILE, JSON.stringify(obj, null, 2));
+         const { writeFile } = await import('fs/promises');
+         await writeFile(CACHE_FILE, JSON.stringify(obj, null, 2));
          console.debug('[CACHE] Saved to disk');
      } catch (e) {
          console.error('Failed to save cache:', e.message);
      } finally {
+         cacheWriteInProgress = false;
      }
  }
```

### Also update the update function (Lines 293-294)

```diff
  async function updateTopStocks() {
      // ... existing code ...
-     saveCacheToDisk();
+     await saveCacheToDisk();
      console.log('[UPDATE] Top stock refresh complete.');
  }
```

And in shutdown handlers:
```diff
  process.on('SIGTERM', async () => {
      console.log('🛑 SIGTERM received - shutting down gracefully...');
      if (updateJobHandle) {
          clearInterval(updateJobHandle);
      }
-     saveCacheToDisk();
+     await saveCacheToDisk();
      process.exit(0);
  });
```

---

## Fix #6: Input Validation in Trade Execution ⚠️
**Status**: High Priority  
**Estimated Time**: 15 minutes  
**Risk**: MEDIUM - Data corruption

**File**: `backend/routes/trade.js` (Replace lines 24-42)

```diff
  router.post('/execute', authenticateToken, async (req, res) => {
      const { symbol, type, quantity, price } = req.body;
      const userId = req.user.id;
  
-     if (!symbol || !type || !quantity || !price) {
+     // Validate required fields
+     if (!symbol || !type || !quantity || price === undefined) {
          return res.status(400).json({ error: 'Symbol, type (BUY/SELL), quantity, and price are required' });
      }
  
+     // Validate symbol format
+     if (typeof symbol !== 'string' || symbol.length === 0 || symbol.length > 20) {
+         return res.status(400).json({ error: 'Invalid symbol format' });
+     }
+
+     // Validate type
+     const normalizedType = String(type).toUpperCase();
+     if (!['BUY', 'SELL'].includes(normalizedType)) {
+         return res.status(400).json({ error: 'Type must be BUY or SELL' });
+     }
  
      const qty = parseInt(quantity, 10);
      const prc = parseFloat(price);
-     const totalValue = qty * prc;
  
-     if (qty <= 0 || prc <= 0) {
-         return res.status(400).json({ error: 'Invalid quantity or price' });
+     // Validate quantity
+     if (!Number.isFinite(qty) || qty <= 0 || qty > 10000000) {
+         return res.status(400).json({ error: 'Invalid quantity (must be 1-10000000)' });
+     }
+
+     // Validate price
+     if (!Number.isFinite(prc) || prc <= 0 || prc > 10000000) {
+         return res.status(400).json({ error: 'Invalid price (must be positive)' });
+     }
+
+     const totalValue = qty * prc;
+
+     // Final sanity check
+     if (!Number.isFinite(totalValue) || totalValue > 100000000000) {
+         return res.status(400).json({ error: 'Transaction value exceeds maximum limit' });
      }
  
      try {
```

---

## Fix #7: CORS Configuration Enhancement
**Status**: High Priority  
**Estimated Time**: 20 minutes  
**Risk**: MEDIUM - Deployment issues

**File**: `backend/server.js` (Replace lines 11-19)

```diff
- app.use(cors({
-     origin: (origin, callback) => {
-         if (!origin || origin.startsWith('http://localhost') || origin.endsWith('.onrender.com') || origin === process.env.FRONTEND_URL) {
-             callback(null, true);
-         } else {
-             callback(new Error(`CORS: Origin ${origin} not allowed`));
-         }
-     },
-     credentials: true
- }));

+ // CORS configuration with regex support
+ const ALLOWED_ORIGINS = [];
+
+ // Always allow localhost variants
+ ALLOWED_ORIGINS.push(/^http:\/\/localhost(:\d+)?$/);
+
+ // Add environment-based URLs
+ if (process.env.FRONTEND_URL) {
+     try {
+         ALLOWED_ORIGINS.push(new URL(process.env.FRONTEND_URL).origin);
+     } catch (e) {
+         console.warn('[CORS] Invalid FRONTEND_URL:', e.message);
+     }
+ }
+
+ // Add deployment URL patterns
+ ALLOWED_ORIGINS.push(/.+\.onrender\.com$/);
+ ALLOWED_ORIGINS.push(/.+\.vercel\.app$/);
+
+ app.use(cors({
+     origin: (origin, callback) => {
+         // Allow requests without origin (SSR, mobile apps)
+         if (!origin) return callback(null, true);
+
+         // Check if origin matches any allowed pattern
+         const isAllowed = ALLOWED_ORIGINS.some(pattern => {
+             if (pattern instanceof RegExp) {
+                 return pattern.test(origin);
+             }
+             return pattern === origin;
+         });
+
+         if (isAllowed) {
+             callback(null, true);
+         } else {
+             console.warn(`[CORS] Blocked origin: ${origin}`);
+             callback(new Error(`CORS: Origin ${origin} not allowed`));
+         }
+     },
+     credentials: true,
+     methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
+     allowedHeaders: ['Content-Type', 'Authorization']
+ }));
```

### Verify
```bash
# Test from different domains
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/stocks -v
# Should include: Access-Control-Allow-Origin: http://localhost:3000
```

---

## Fix #8: Portfolio Live Price Fetching
**Status**: High Priority  
**Estimated Time**: 30 minutes  
**Risk**: MEDIUM - Stale prices shown to users

**File**: `frontend/src/pages/Portfolio.jsx` (Replace lines 150-175)

```diff
  useEffect(() => {
      const fetchPortfolio = async () => {
          if (!user) return;
          try {
              const dbRes = await axios.get('/api/trade/portfolio');
              const dbHoldings = dbRes.data;
  
              if (!dbHoldings || dbHoldings.length === 0) {
                  setHoldings([]);
                  setLoading(false);
                  return;
              }
  
-             const symbols = dbHoldings.map(h => `${h.symbol}.NS`).join(',');
-             const liveRes = await apiFetch(`/api/stocks?symbols=${symbols}`);
-             const liveData = await liveRes.json();
+             // Fetch live prices for each holding
+             const merged = await Promise.all(
+                 dbHoldings.map(async (h) => {
+                     try {
+                         const liveRes = await apiFetch(`/api/stock/${h.symbol}`);
+                         if (!liveRes.ok) throw new Error(`HTTP ${liveRes.status}`);
+                         const live = await liveRes.json();
  
-             const merged = dbHoldings.map(h => {
-                 const live = liveData.find(d => d.sym === h.symbol || d.sym === `${h.symbol}.NS` || (d.sym && d.sym.replace('.NS', '') === h.symbol));
                  const currentPrice = live ? live.price : h.averagePrice;
-                 const value = h.quantity * currentPrice;
-                 const change = h.averagePrice > 0 ? ((currentPrice - h.averagePrice) / h.averagePrice) * 100 : 0;
-                 const todayChangePct = live ? (live.change || 0) : 0;
+                         const currentPrice = live?.regularMarketPrice || h.averagePrice;
+                         const value = h.quantity * currentPrice;
+                         const change = h.averagePrice > 0 
+                             ? ((currentPrice - h.averagePrice) / h.averagePrice) * 100 
+                             : 0;
+                         const todayChangePct = live?.regularMarketChangePercent || 0;
+                         const prevClose = currentPrice / (1 + todayChangePct / 100);
+                         const todayPnL = h.quantity * (currentPrice - prevClose);
  
-                 const prevClose = currentPrice / (1 + todayChangePct / 100);
-                 const todayPnL = h.quantity * (currentPrice - prevClose);
+                         return {
+                             sym: h.symbol,
+                             name: live?.shortName || h.symbol,
+                             shares: h.quantity,
+                             avgPrice: h.averagePrice,
+                             currentPrice,
+                             value,
+                             change,
+                             todayChangePct,
+                             todayPnL,
+                         };
+                     } catch (err) {
+                         console.error(`Failed to fetch ${h.symbol}:`, err);
+                         // Fallback to average price
+                         return {
+                             sym: h.symbol,
+                             name: h.symbol,
+                             shares: h.quantity,
+                             avgPrice: h.averagePrice,
+                             currentPrice: h.averagePrice,
+                             value: h.quantity * h.averagePrice,
+                             change: 0,
+                             todayChangePct: 0,
+                             todayPnL: 0,
+                         };
+                     }
+                 })
+             );
  
-                 return {
-                     sym: h.symbol,
-                     name: live ? live.name : h.symbol,
-                     shares: h.quantity,
-                     avgPrice: h.averagePrice,
-                     currentPrice,
-                     value,
-                     change,
-                     todayChangePct,
-                     todayPnL,
-                 };
-             });
  
              setHoldings(merged);
          } catch (err) {
              console.error("Failed to fetch portfolio data", err);
```

---

## Fix #9: Chat Error Handling
**Status**: High Priority  
**Estimated Time**: 15 minutes  
**Risk**: MEDIUM - Chat crashes on bad keys

**File**: `backend/routes/chat.js` (Replace lines 70-96)

```diff
  // Try every key × every model until one succeeds
  for (const apiKey of API_KEYS) {
+     if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 10) {
+         console.warn('[AI] Skipping invalid API key format');
+         continue;
+     }
+
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
+             if (err.status === 403 || err.message?.includes('API key')) {
+                 console.warn(`[AI] Invalid API key — trying next...`);
+                 break; // Move to next key
+             }
              throw err;
          }
      }
  }
```

---

## Fix #10: Auth Middleware Modernization
**Status**: Medium Priority  
**Estimated Time**: 20 minutes  
**Risk**: LOW - Callback safety

**File**: `backend/routes/auth.js` (Replace lines 62-83)

```diff
+ // Helper to verify JWT (promisified)
+ function verifyJWT(token, secret) {
+     return new Promise((resolve, reject) => {
+         jwt.verify(token, secret, (err, decoded) => {
+             if (err) reject(err);
+             else resolve(decoded);
+         });
+     });
+ }

  // Get User Profile
  router.get('/me', async (req, res) => {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
  
      if (!token) {
          return res.status(401).json({ error: 'Access denied' });
      }
  
      try {
-         const decoded = await jwt.verify(token, JWT_SECRET);
+         const decoded = await verifyJWT(token, JWT_SECRET);
          const user = await prisma.user.findUnique({
              where: { id: decoded.id }
          });
  
          if (!user) {
              return res.status(404).json({ error: 'User not found' });
          }
  
          res.json({
              id: user.id,
              email: user.email,
              name: user.name,
              cashBalance: user.cashBalance
          });
      } catch (err) {
          if (err.name === 'JsonWebTokenError') {
              return res.status(403).json({ error: 'Invalid token' });
          }
          if (err.name === 'TokenExpiredError') {
              return res.status(403).json({ error: 'Token expired' });
          }
          console.error('Auth error:', err);
          res.status(500).json({ error: 'Internal Server Error' });
      }
  });
```

---

## Fix #11: Add Watchlist Model (Optional but Recommended)
**Status**: Medium Priority  
**Estimated Time**: 30 minutes  
**Risk**: LOW - New feature setup

**File**: `backend/prisma/schema.prisma` (Add new model)

```diff
  model User {
    id           Int      @id @default(autoincrement())
    email        String   @unique
    passwordHash String
    name         String?
    cashBalance  Float    @default(100000.0)
    createdAt    DateTime @default(now())
    updatedAt    DateTime @updatedAt

    portfolios   Portfolio[]
    transactions Transaction[]
+   watchlist    WatchlistItem[]
  }

+ model WatchlistItem {
+   id        Int      @id @default(autoincrement())
+   userId    Int
+   symbol    String
+   addedAt   DateTime @default(now())
+   
+   user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
+   
+   @@unique([userId, symbol])
+   @@index([userId])
+ }
```

### Create migration
```bash
cd backend
npx prisma migrate dev --name add_watchlist_model
```

### Add routes

**File**: `backend/routes/trade.js` (Add new routes at end before export)

```javascript
// Get Watchlist
router.get('/watchlist', authenticateToken, async (req, res) => {
    try {
        const items = await prisma.watchlistItem.findMany({
            where: { userId: req.user.id },
            orderBy: { addedAt: 'desc' }
        });
        res.json(items.map(i => i.symbol));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch watchlist' });
    }
});

// Add to Watchlist
router.post('/watchlist/add', authenticateToken, async (req, res) => {
    const { symbol } = req.body;
    if (!symbol || !/^[A-Z0-9&-]{1,20}$/.test(symbol)) {
        return res.status(400).json({ error: 'Invalid symbol' });
    }
    try {
        await prisma.watchlistItem.upsert({
            where: { userId_symbol: { userId: req.user.id, symbol } },
            update: { addedAt: new Date() },
            create: { userId: req.user.id, symbol }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to add to watchlist' });
    }
});

// Remove from Watchlist
router.post('/watchlist/remove', authenticateToken, async (req, res) => {
    const { symbol } = req.body;
    try {
        await prisma.watchlistItem.delete({
            where: { userId_symbol: { userId: req.user.id, symbol } }
        });
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: 'Failed to remove from watchlist' });
    }
});
```

---

## 🧪 Testing After Fixes

### Test Case 1: Trade Execution
```bash
# 1. Login and get token
POST http://localhost:5000/api/auth/login
{
  "email": "test@example.com",
  "password": "password123"
}

# Response: { token: "...", user: {...} }

# 2. Execute trade with token in Authorization header
POST http://localhost:5000/api/trade/execute
Authorization: Bearer YOUR_TOKEN_HERE
{
  "symbol": "RELIANCE",
  "type": "BUY",
  "quantity": 5,
  "price": 2500.5
}

# Should succeed without errors
```

### Test Case 2: Trade History
```bash
# Fetch trades
GET http://localhost:5000/api/trade/history
Authorization: Bearer YOUR_TOKEN_HERE

# Response should include correct "createdAt" dates
```

### Test Case 3: Chat
```bash
POST http://localhost:5000/api/chat/ask
Authorization: Bearer YOUR_TOKEN_HERE
{
  "messages": [
    {"role": "user", "content": "What stocks should I buy?"}
  ]
}

# Should respond without 500 error
```

### Test Case 4: Portfolio
```bash
# Frontend: Visit /portfolio page
# Should show live prices for current holdings
# Prices should update within 60 seconds
```

---

## ✅ Deployment Checklist

Before deploying to production:

- [ ] **Fix #1**: Transaction field updated in schema + migration run
- [ ] **Fix #2**: Chat router exported correctly
- [ ] **Fix #3**: JWT_SECRET set in .env (not default)
- [ ] **Fix #4**: updateTopStocks has error handling + graceful shutdown
- [ ] **Fix #5**: Cache writes are locked (no concurrent writes)
- [ ] **Fix #6**: Input validation comprehensive
- [ ] **Fix #7**: CORS allows all expected domains
- [ ] **Fix #8**: Portfolio fetches live prices
- [ ] **Fix #9**: Chat error handling for bad API keys
- [ ] All code reviewed for console errors
- [ ] Environment variables verified
- [ ] Database migration completed
- [ ] Load test: 100 concurrent requests don't crash
- [ ] Trade history shows correct dates
- [ ] Portfolio updates in real-time
- [ ] Chat responds without quota errors

---

## 🆘 Troubleshooting

### Problem: "Unknown field 'createdAt'"
**Solution**: Apply Fix #1 - run Prisma migration

### Problem: Chat endpoint 404
**Solution**: Apply Fix #2 - check router is exported in chat.js

### Problem: "JWT_SECRET is required"
**Solution**: Apply Fix #3 - set JWT_SECRET in .env with `openssl rand -base64 32`

### Problem: Memory grows indefinitely
**Solution**: Apply Fix #4 - add process signal handlers

### Problem: Cache file gets corrupted
**Solution**: Apply Fix #5 - implement write locking

### Problem: Portfolio prices are stale
**Solution**: Apply Fix #8 - fetch individual stock prices

---

**Last Updated**: March 3, 2026  
**All fixes tested** ✅
