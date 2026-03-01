# 🚀 NEXUS TRADE — Complete Website Blueprint
### Antigravity 3D · AI-Powered · Free APIs · Stock Intelligence Platform

> **Type:** Full-Stack Web Application  
> **Level:** Advanced (College Final Year / Portfolio)  
> **Stack:** React + Three.js + GSAP + Node.js + Claude AI + Free APIs  
> **Estimated Build Time:** 8–10 Weeks  
> **Team Size:** 2–4 Developers

---

## 📋 TABLE OF CONTENTS

1. [Project Vision](#1-project-vision)
2. [Tech Stack (Complete)](#2-tech-stack-complete)
3. [Free APIs Used](#3-free-apis-used)
4. [Folder Structure](#4-folder-structure)
5. [Pages & Routes](#5-pages--routes)
6. [3D Antigravity Animation System](#6-3d-antigravity-animation-system)
7. [Page-by-Page Feature Breakdown](#7-page-by-page-feature-breakdown)
8. [AI Integration Layer](#8-ai-integration-layer)
9. [Backend Architecture](#9-backend-architecture)
10. [Database Schema](#10-database-schema)
11. [Component Library](#11-component-library)
12. [Animation Specs](#12-animation-specs)
13. [API Integration Guide](#13-api-integration-guide)
14. [Color System & Design Tokens](#14-color-system--design-tokens)
15. [Typography System](#15-typography-system)
16. [Deployment Guide](#16-deployment-guide)
17. [Week-by-Week Roadmap](#17-week-by-week-roadmap)
18. [Team Roles](#18-team-roles)

---

## 1. PROJECT VISION

### Concept
> **"You don't just see stock data — you experience it in 3D space, talk to it with AI, and feel gravity bend around price movements."**

NEXUS TRADE is a next-generation stock intelligence platform where:
- Market data **floats in 3D antigravity space** using Three.js WebGL
- An **AI analyst** answers natural language questions about any stock
- Price volatility **physically warps the background** — high volatility = chaotic particle storms
- Everything feels **alive, breathing, and cinematic**

### What Makes It Unforgettable
- Stocks rise = particles float UP (antigravity effect)
- Stocks fall = particles crash DOWN with gravity
- AI chat is embedded directly into the 3D scene
- Market heatmap is a **3D terrain** that rises and falls
- Page transitions feel like traveling through space

---

## 2. TECH STACK (COMPLETE)

### Frontend
```
React 18              → UI framework (Vite for fast builds)
Three.js r160         → 3D WebGL engine (antigravity animations)
GSAP 3.12             → Timeline animations, ScrollTrigger
@react-three/fiber    → React wrapper for Three.js
@react-three/drei     → Three.js helpers (orbit, float, text3d)
Framer Motion 11      → Component-level animations
Lenis                 → Silky smooth inertia scroll
TailwindCSS 3         → Utility-first styling
Recharts / D3.js      → 2D charts (candlestick, area, bar)
Lightweight Charts    → TradingView-quality candlestick charts
Zustand               → Global state management
React Query           → API data fetching + caching
Socket.io-client      → Real-time WebSocket data
Axios                 → HTTP requests
```

### Backend
```
Node.js + Express     → REST API server
Python FastAPI        → AI microservice (sentiment analysis)
Socket.io             → Real-time WebSocket server
Redis                 → Cache live prices (TTL: 5 seconds)
PostgreSQL            → User data, portfolios, watchlists
Prisma ORM            → Database queries
Bull Queue            → Background jobs (alerts, scrapers)
JWT + bcrypt          → Authentication
```

### AI & Intelligence
```
Anthropic Claude API  → Natural language stock analysis (free tier)
Google Gemini API     → Backup AI model (free tier available)
Hugging Face          → Sentiment analysis model (free)
NewsAPI               → Financial news headlines (free)
```

### DevOps
```
Vercel                → Frontend deployment (free)
Railway / Render      → Backend deployment (free tier)
Supabase              → PostgreSQL + Auth (free tier)
Upstash Redis         → Redis cloud (free tier)
GitHub Actions        → CI/CD pipeline
```

---

## 3. FREE APIS USED

### 📈 Market Data APIs

| API | What It Provides | Free Tier Limit | URL |
|-----|-----------------|-----------------|-----|
| **Finnhub** | Real-time stock quotes, WebSocket ticks, company news | 60 calls/min | finnhub.io |
| **Alpha Vantage** | Historical OHLCV, technical indicators (RSI, MACD, BB) | 25 calls/day | alphavantage.co |
| **Polygon.io** | Real-time + historical data, aggregates | 5 calls/min (free) | polygon.io |
| **Yahoo Finance (unofficial)** | Quotes, historical, financials | Unlimited (no key) | via `yahoo-finance2` npm |
| **CoinGecko** | Crypto prices, market cap, charts | 30 calls/min | coingecko.com |

### 📰 News & Sentiment APIs

| API | What It Provides | Free Tier |
|-----|-----------------|-----------|
| **NewsAPI** | Top financial headlines, search by ticker | 100 requests/day |
| **Finnhub News** | Company-specific news by symbol | 60 calls/min |
| **Reddit API** | WSB and investing subreddit sentiment | Free with OAuth |

### 🤖 AI APIs

| API | What It Provides | Free Tier |
|-----|-----------------|-----------|
| **Anthropic Claude** | Natural language analysis, chat | Free credits on signup |
| **Google Gemini** | Stock Q&A, analysis | 60 RPM free |
| **Hugging Face** | FinBERT sentiment model | Free inference API |

### 🌐 Utility APIs

| API | What It Provides | Free Tier |
|-----|-----------------|-----------|
| **ExchangeRate-API** | Currency conversion | 1500/month free |
| **OpenWeatherMap** | Economic weather indicator | 1000 calls/day |
| **IPinfo** | User location for local market | 50k/month free |

### API Key Setup (.env file)
```env
# Market Data
FINNHUB_API_KEY=your_key_here
ALPHA_VANTAGE_KEY=your_key_here
POLYGON_API_KEY=your_key_here

# AI
ANTHROPIC_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
HUGGINGFACE_API_KEY=your_key_here

# News
NEWS_API_KEY=your_key_here

# Database
DATABASE_URL=postgresql://...
REDIS_URL=redis://...

# Auth
JWT_SECRET=your_secret_here
```

---

## 4. FOLDER STRUCTURE

```
nexus-trade/
│
├── frontend/                          # React Application
│   ├── public/
│   │   ├── fonts/                     # Custom font files
│   │   ├── models/                    # 3D GLTF models
│   │   └── textures/                  # Three.js textures
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── 3d/                    # All Three.js components
│   │   │   │   ├── AntiGravityField.jsx    → Main particle engine
│   │   │   │   ├── FloatingStockOrb.jsx    → 3D stock bubbles
│   │   │   │   ├── MarketTerrain.jsx       → 3D heatmap mesh
│   │   │   │   ├── PriceRings.jsx          → Orbiting price rings
│   │   │   │   ├── VolatilityStorm.jsx     → Chaos particles on crash
│   │   │   │   ├── WireframeSphere.jsx     → Background wireframe globe
│   │   │   │   └── DataStream.jsx          → Falling data text (Matrix style)
│   │   │   │
│   │   │   ├── charts/                # Chart components
│   │   │   │   ├── CandlestickChart.jsx    → TradingView lightweight
│   │   │   │   ├── AreaChart.jsx           → Gradient fill chart
│   │   │   │   ├── VolumeChart.jsx         → Volume bars
│   │   │   │   ├── RSIIndicator.jsx        → RSI oscillator
│   │   │   │   ├── MACDChart.jsx           → MACD indicator
│   │   │   │   ├── BollingerBands.jsx      → Bollinger bands overlay
│   │   │   │   ├── HeatmapTerrain.jsx      → 3D D3 heatmap
│   │   │   │   └── RadarChart.jsx          → Stock comparison radar
│   │   │   │
│   │   │   ├── ai/                    # AI feature components
│   │   │   │   ├── AIAnalystChat.jsx       → Main chat panel
│   │   │   │   ├── SentimentGauge.jsx      → Animated sentiment meter
│   │   │   │   ├── PatternDetector.jsx     → AI pattern recognition
│   │   │   │   ├── NewsAnalyzer.jsx        → AI news sentiment feed
│   │   │   │   └── AISignalCard.jsx        → Buy/Sell/Hold signal card
│   │   │   │
│   │   │   ├── ui/                    # Reusable UI components
│   │   │   │   ├── GlitchText.jsx          → Glitch animation text
│   │   │   │   ├── AnimatedCounter.jsx     → Smooth number animation
│   │   │   │   ├── TickerTape.jsx          → Scrolling price tape
│   │   │   │   ├── MagneticButton.jsx      → Cursor-attracted button
│   │   │   │   ├── FloatingCard.jsx        → 3D tilt hover card
│   │   │   │   ├── PulseIndicator.jsx      → Live dot indicator
│   │   │   │   ├── GlowBadge.jsx           → Neon badge component
│   │   │   │   ├── HologramPanel.jsx       → Hologram-style panel
│   │   │   │   ├── ScanlineOverlay.jsx     → CRT scanline effect
│   │   │   │   └── ProgressRing.jsx        → Circular progress SVG
│   │   │   │
│   │   │   └── layout/
│   │   │       ├── Header.jsx              → Sticky navigation
│   │   │       ├── Sidebar.jsx             → Collapsible sidebar
│   │   │       ├── PageTransition.jsx      → GSAP page transitions
│   │   │       └── CommandPalette.jsx      → Ctrl+K search panel
│   │   │
│   │   ├── pages/
│   │   │   ├── Landing.jsx                 → Hero landing page
│   │   │   ├── Dashboard.jsx               → Main trading dashboard
│   │   │   ├── StockDetail.jsx             → Deep dive stock page
│   │   │   ├── Portfolio.jsx               → Portfolio manager
│   │   │   ├── Markets.jsx                 → Market overview + heatmap
│   │   │   ├── Screener.jsx                → Stock screener
│   │   │   ├── AIAdvisor.jsx               → Full AI chat page
│   │   │   ├── Alerts.jsx                  → Smart alerts manager
│   │   │   ├── News.jsx                    → News + sentiment feed
│   │   │   └── Auth/
│   │   │       ├── Login.jsx
│   │   │       └── Register.jsx
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLivePrice.js             → WebSocket price hook
│   │   │   ├── useStockData.js             → Fetch + cache stock data
│   │   │   ├── useAIAnalysis.js            → Claude API hook
│   │   │   ├── useSentiment.js             → News sentiment hook
│   │   │   ├── usePortfolio.js             → Portfolio calculations
│   │   │   ├── useAntiGravity.js           → 3D physics state
│   │   │   └── useTheme.js                 → Dark/light theme
│   │   │
│   │   ├── store/
│   │   │   ├── stockStore.js               → Selected stocks, prices
│   │   │   ├── portfolioStore.js           → Holdings, P&L
│   │   │   ├── uiStore.js                  → Sidebar, panels, modals
│   │   │   └── aiStore.js                  → AI chat history
│   │   │
│   │   ├── services/
│   │   │   ├── finnhubService.js           → Finnhub API calls
│   │   │   ├── alphaVantageService.js      → Alpha Vantage calls
│   │   │   ├── aiService.js                → Claude API service
│   │   │   ├── newsService.js              → NewsAPI service
│   │   │   ├── websocketService.js         → Socket.io client
│   │   │   └── portfolioService.js         → Portfolio backend calls
│   │   │
│   │   ├── utils/
│   │   │   ├── formatters.js               → Price, % formatters
│   │   │   ├── indicators.js               → RSI, MACD calculations
│   │   │   ├── colorUtils.js               → Dynamic color generation
│   │   │   ├── animations.js               → GSAP animation presets
│   │   │   └── antiGravityPhysics.js       → Particle physics engine
│   │   │
│   │   ├── styles/
│   │   │   ├── globals.css                 → CSS variables, resets
│   │   │   ├── animations.css              → Keyframe animations
│   │   │   └── fonts.css                   → Font declarations
│   │   │
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── router.jsx
│   │
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── backend/                           # Node.js API Server
│   ├── src/
│   │   ├── routes/
│   │   │   ├── stocks.js               → /api/stocks/*
│   │   │   ├── portfolio.js            → /api/portfolio/*
│   │   │   ├── alerts.js               → /api/alerts/*
│   │   │   ├── ai.js                   → /api/ai/*
│   │   │   ├── news.js                 → /api/news/*
│   │   │   └── auth.js                 → /api/auth/*
│   │   │
│   │   ├── services/
│   │   │   ├── finnhubService.js
│   │   │   ├── alphaVantageService.js
│   │   │   ├── redisService.js
│   │   │   ├── newsScraperService.js
│   │   │   └── alertService.js
│   │   │
│   │   ├── websocket/
│   │   │   ├── priceSocket.js          → Broadcast live prices
│   │   │   └── alertSocket.js          → Push alert notifications
│   │   │
│   │   ├── jobs/
│   │   │   ├── priceUpdater.js         → Poll + cache prices
│   │   │   ├── newsScraper.js          → Fetch + analyze news
│   │   │   └── alertChecker.js         → Check price conditions
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js                 → JWT verification
│   │   │   ├── rateLimit.js            → API rate limiting
│   │   │   └── cache.js                → Redis cache middleware
│   │   │
│   │   ├── prisma/
│   │   │   └── schema.prisma
│   │   │
│   │   └── app.js
│   │
│   └── package.json
│
├── ai-service/                        # Python FastAPI (optional)
│   ├── main.py
│   ├── sentiment.py                   → FinBERT sentiment analysis
│   ├── patterns.py                    → Chart pattern detection
│   └── requirements.txt
│
└── README.md
```

---

## 5. PAGES & ROUTES

| Route | Page | Description |
|-------|------|-------------|
| `/` | Landing | Cinematic intro with full 3D antigravity hero |
| `/dashboard` | Dashboard | Main trading hub — charts, watchlist, AI panel |
| `/stock/:symbol` | Stock Detail | Deep dive — all indicators + AI analysis |
| `/markets` | Markets | 3D terrain heatmap of all sectors |
| `/portfolio` | Portfolio | Holdings, P&L, risk analysis |
| `/screener` | Screener | Filter stocks by 50+ criteria |
| `/ai` | AI Advisor | Full-page conversational AI analyst |
| `/alerts` | Alerts | Smart price + pattern alerts |
| `/news` | News | Sentiment-tagged news feed |
| `/login` | Auth | Login with animated 3D background |
| `/register` | Auth | Registration page |

---

## 6. 3D ANTIGRAVITY ANIMATION SYSTEM

### Core Concept
The **AntiGravity Engine** is the heart of the website. It's a Three.js particle system where:

- **Each particle** = a floating data point in 3D space
- **Rising stocks** = particles defy gravity (float UP with acceleration)
- **Falling stocks** = particles obey gravity (crash DOWN with weight)
- **High volatility** = particles move chaotically in all directions
- **Market crash** = particle storm — everything explodes outward

### Physics Parameters
```javascript
// antiGravityPhysics.js

const PHYSICS_CONFIG = {
  // Base particle count
  PARTICLE_COUNT: 150,

  // Antigravity force (positive = upward lift)
  BASE_LIFT: 0.008,

  // How much price change affects gravity
  PRICE_GRAVITY_MULTIPLIER: 0.05,

  // Max float height before reset
  MAX_HEIGHT: 30,
  MIN_HEIGHT: -30,

  // Sinusoidal drift (breathing motion)
  DRIFT_AMPLITUDE: 3.5,
  DRIFT_SPEED: 0.008,

  // Connection line max distance
  CONNECTION_DISTANCE: 12,

  // Volatility explosion radius
  VOLATILITY_BURST_RADIUS: 20,
};

// Gravity mode based on price change
function getGravityMode(priceChangePct) {
  if (priceChangePct > 3)  return "ANTIGRAVITY_STRONG";  // Float up fast
  if (priceChangePct > 1)  return "ANTIGRAVITY_MILD";    // Float up slow
  if (priceChangePct > -1) return "NEUTRAL";             // Gentle drift
  if (priceChangePct > -3) return "GRAVITY_MILD";        // Sink slowly
  return "GRAVITY_STRONG";                               // Crash down
}
```

### Three.js Scene Layers
```
Layer 0: Background (farthest)
  └── WireframeSphere          → Rotating globe wireframe
  └── StarField                → 500 tiny distant stars

Layer 1: Particle Field
  └── AntiGravityParticles     → 150 floating spheres
  └── ConnectionLines          → Dynamic neural network lines
  └── DataStreams               → Vertical falling text columns

Layer 2: Mid-ground
  └── FloatingStockOrbs        → Large glowing stock bubbles
  └── PriceRings               → Torus rings orbiting orbs
  └── VolatilityStorm          → Burst particles on price spike

Layer 3: Foreground
  └── UIPlane                  → React UI overlay
  └── CursorRipple             → 3D ripple on mouse click
```

### Animation Timeline (GSAP)
```javascript
// Page load sequence
const masterTimeline = gsap.timeline();

masterTimeline
  .from(".logo", { duration: 1.2, opacity: 0, y: -40, ease: "power3.out" })
  .from(".ticker-tape", { duration: 0.8, opacity: 0, ease: "power2.out" }, "-=0.4")
  .from(".stock-cards", { duration: 1, opacity: 0, y: 30, stagger: 0.1, ease: "back.out(1.7)" }, "-=0.3")
  .from(".price-hero", { duration: 1.2, opacity: 0, scale: 0.95, ease: "power4.out" }, "-=0.6")
  .from(".chart-container", { duration: 0.8, opacity: 0, x: 20, ease: "power2.out" }, "-=0.4")
  .from(".ai-panel", { duration: 0.8, opacity: 0, x: -20, ease: "power2.out" }, "-=0.6");
```

### Antigravity Particle Code Template
```javascript
// AntiGravityField.jsx — Main Three.js Component

import { useRef, useEffect } from "react";
import * as THREE from "three";

export function AntiGravityField({ priceChangePct = 0, volatility = 0.5 }) {
  const mountRef = useRef();

  useEffect(() => {
    // Scene setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 45;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    mountRef.current.appendChild(renderer.domElement);

    // Determine gravity mode
    const gravityMode = getGravityMode(priceChangePct);
    const gravityForce = {
      ANTIGRAVITY_STRONG: -0.025,
      ANTIGRAVITY_MILD:   -0.010,
      NEUTRAL:             0.000,
      GRAVITY_MILD:       +0.010,
      GRAVITY_STRONG:     +0.030,
    }[gravityMode];

    // Create particles
    const particles = createParticles(scene, 150);

    // Add ambient + point lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.3));
    const pointLight = new THREE.PointLight(0x00ffcc, 2, 80);
    scene.add(pointLight);

    // Wireframe sphere background
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(28, 24, 24),
      new THREE.MeshBasicMaterial({ color: 0x00ffcc, wireframe: true, opacity: 0.04, transparent: true })
    );
    scene.add(sphere);

    // Animation loop
    let t = 0;
    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      t += 0.01;

      particles.forEach(p => {
        // Antigravity: apply gravity force
        p.userData.vy -= gravityForce;
        p.userData.vy *= 0.98; // damping

        // Sinusoidal horizontal drift
        p.position.x = p.userData.ox + Math.sin(t * p.userData.speed + p.userData.phase) * 3;
        p.position.y += p.userData.vy;
        p.position.z = p.userData.oz + Math.cos(t * p.userData.speed * 0.7 + p.userData.phase) * 1.5;

        // Wrap vertically
        if (p.position.y > 30) { p.position.y = -30; p.userData.vy = 0; }
        if (p.position.y < -30) { p.position.y = 30; p.userData.vy = 0; }

        // Volatility: add random shake
        if (volatility > 0.7) {
          p.position.x += (Math.random() - 0.5) * volatility * 0.5;
          p.position.y += (Math.random() - 0.5) * volatility * 0.3;
        }

        p.rotation.x += 0.005;
        p.rotation.y += 0.003;
      });

      // Rotate background sphere slowly
      sphere.rotation.y = t * 0.05;
      sphere.rotation.x = Math.sin(t * 0.03) * 0.2;

      // Orbit point light
      pointLight.position.set(
        Math.cos(t * 0.4) * 25,
        Math.sin(t * 0.3) * 20,
        15
      );

      renderer.render(scene, camera);
    };

    animate();
    return () => { cancelAnimationFrame(animId); renderer.dispose(); };
  }, [priceChangePct, volatility]);

  return <div ref={mountRef} style={{ position: "fixed", inset: 0, zIndex: 0 }} />;
}
```

---

## 7. PAGE-BY-PAGE FEATURE BREAKDOWN

---

### 🏠 PAGE 1: LANDING PAGE (`/`)

#### Purpose
First impression. Must be jaw-dropping. 10-second attention hook.

#### Sections
```
Section 1: HERO (full screen)
  ├── Full 3D antigravity particle field (background)
  ├── Animated logo with glitch effect
  ├── Headline: "Trade at the Speed of Intelligence"
  ├── Subtitle types itself character by character
  ├── Two CTA buttons with magnetic hover effect
  ├── Live market ticker tape overlay
  └── Scroll indicator (bouncing arrow)

Section 2: STATS COUNTER (scroll-triggered)
  ├── "$2.4T" — Total market cap tracked
  ├── "847K" — Active traders
  ├── "99.9%" — Uptime
  └── "12ms" — Latency
  (Numbers count up from 0 when scrolled into view)

Section 3: FEATURE SHOWCASE (3 columns)
  ├── 3D animated icon for each feature
  ├── "AI-Powered Analysis" — rotating brain model
  ├── "Real-Time Data" — live price feed preview
  └── "Antigravity Interface" — mini particle demo

Section 4: LIVE MARKET PREVIEW
  ├── Actual live chart (Finnhub API)
  ├── Floating stock cards with real prices
  └── "Start Trading Free →" CTA

Section 5: FOOTER
  ├── Logo + tagline
  ├── Navigation links
  └── Social links
```

#### Key Animations
- **Hero entrance:** GSAP timeline with staggered text reveals
- **Parallax layers:** Particles move at different speeds on scroll
- **Stats:** CountUp.js or custom counter with easing
- **Feature cards:** Flip in from below on ScrollTrigger
- **Cursor:** Custom cursor morphs between default / link / drag states

---

### 📊 PAGE 2: DASHBOARD (`/dashboard`)

#### Layout
```
┌─────────────────────────────────────────────────────────────┐
│  HEADER (sticky, glassmorphism, live market indices)         │
├──────────────┬──────────────────────────────┬───────────────┤
│              │                              │               │
│  WATCHLIST   │     MAIN CHART AREA          │  ORDER PANEL  │
│  (8 stocks)  │  (candlestick + indicators)  │  + AI CHAT    │
│              │                              │               │
│  FloatingCard│  PriceChart                  │  OrderForm    │
│  x8          │  VolumeChart                 │  AIAnalyst    │
│              │  RSI / MACD                  │               │
│              │                              │  RecentOrders │
├──────────────┴──────────────────────────────┴───────────────┤
│  BOTTOM BAR: News Feed (auto-scrolling) + Sentiment Meter    │
└─────────────────────────────────────────────────────────────┘
```

#### Features
- **Price Hero:** Animated price display — pulses on every tick
- **Chart Switcher:** Line / Area / Candlestick / Heatmap tabs
- **Time Range:** 1D / 5D / 1M / 3M / 6M / 1Y / 5Y
- **Indicators Overlay:** Toggle RSI, MACD, Bollinger Bands
- **Order Book:** Animated bid/ask depth bars
- **AI Panel:** Quick chat inline — ask about selected stock
- **Volume:** Color-coded bars (green up-day, red down-day)

#### Live Data Flow
```
Finnhub WebSocket → Redis Cache (5s TTL)
    ↓
Socket.io Server → Socket.io Client
    ↓
React useLivePrice() hook → Zustand store
    ↓
Price components rerender with animation
```

---

### 🔬 PAGE 3: STOCK DETAIL (`/stock/:symbol`)

#### Sections
```
Header: Full-width stock name + live price + % change

Section 1: CHART LAB
  ├── Professional candlestick chart (TradingView Lightweight Charts)
  ├── All technical indicators (RSI, MACD, Stoch, ATR, OBV)
  ├── Drawing tools (trendlines, fib levels)
  └── Compare mode (overlay multiple stocks)

Section 2: AI DEEP ANALYSIS
  ├── Full AI analyst panel
  ├── Automated analysis card: "NVDA shows bullish divergence..."
  ├── Pattern recognition: detected patterns shown on chart
  └── Price target range (AI-generated)

Section 3: FUNDAMENTALS
  ├── P/E, EPS, Revenue, Market Cap cards
  ├── Animated bar charts comparing to sector average
  └── Financial health score (circular progress ring)

Section 4: NEWS SENTIMENT
  ├── Last 20 news articles
  ├── Each tagged: Bullish / Bearish / Neutral
  ├── Aggregate sentiment score (animated gauge)
  └── AI one-liner summary per article

Section 5: PEER COMPARISON
  ├── Radar chart comparing vs 5 competitors
  ├── Metric: P/E, Growth, Margin, Volume, Momentum
  └── Animated on scroll

Section 6: OPTIONS CHAIN (if available)
  └── Calls/Puts table with heat coloring
```

---

### 🌍 PAGE 4: MARKETS (`/markets`)

#### The 3D Heatmap Terrain
This is the most impressive visual in the app:

```javascript
// MarketTerrain.jsx — 3D D3 Heatmap

// Concept:
// - Create a 3D grid mesh in Three.js
// - Each grid cell = one sector (Tech, Finance, Energy, etc.)
// - Height of cell = market cap weight
// - Color of cell = % price change (red → green gradient)
// - Cells animate up/down as prices change in real time
// - Camera slowly orbits the terrain (OrbitControls)
// - Click a cell → fly camera to that sector
// - Hover → show sector stats tooltip

const SECTORS = [
  { name: "Technology",  stocks: ["AAPL","MSFT","NVDA","GOOGL"], x: 0, z: 0 },
  { name: "Finance",     stocks: ["JPM","BAC","GS","MS"],         x: 2, z: 0 },
  { name: "Healthcare",  stocks: ["JNJ","PFE","UNH","ABBV"],      x: 4, z: 0 },
  { name: "Energy",      stocks: ["XOM","CVX","COP","SLB"],       x: 0, z: 2 },
  { name: "Consumer",    stocks: ["AMZN","TSLA","HD","MCD"],      x: 2, z: 2 },
  { name: "Industrial",  stocks: ["CAT","DE","BA","GE"],           x: 4, z: 2 },
];
```

#### Other Markets Page Features
- **Indices Overview:** S&P 500, Dow, NASDAQ, Russell animated cards
- **Sector Rotation Chart:** Animated bubble chart (size = volume)
- **Fear & Greed Index:** Large animated gauge
- **Most Active / Gainers / Losers:** Three animated tables

---

### 💼 PAGE 5: PORTFOLIO (`/portfolio`)

#### Layout
```
Top: Portfolio value hero — animated counter + P&L

Left Column:
  ├── Donut chart (allocation by sector/stock)
  ├── Risk score meter
  └── Diversification heatmap

Center Column:
  ├── Holdings table (live prices update)
  ├── Drag to reorder holdings
  ├── Add/remove stocks
  └── Cost basis vs current price bars

Right Column:
  ├── AI Portfolio Review
  ├── "Your portfolio has 72% tech exposure — consider diversifying"
  ├── What-if simulator slider
  └── Performance vs S&P 500 comparison chart
```

#### AI Portfolio Features
```javascript
// AI generates personalized insights:
const portfolioPrompt = `
  Analyze this portfolio: ${JSON.stringify(holdings)}
  Total value: $${totalValue}
  Risk tolerance: ${userRiskProfile}

  Provide:
  1. Overall risk score (1-10)
  2. Top 3 concerns
  3. One specific rebalancing suggestion
  Keep response under 100 words.
`;
```

---

### 🔍 PAGE 6: SCREENER (`/screener`)

#### Filter Categories
```
Price Filters:
  ├── Price range slider
  ├── % change today (min/max)
  └── 52-week range position

Volume Filters:
  ├── Average volume
  └── Relative volume (vs 30-day avg)

Fundamental Filters:
  ├── Market cap (Nano / Micro / Small / Mid / Large / Mega)
  ├── P/E ratio range
  ├── EPS growth
  ├── Revenue growth
  └── Profit margin

Technical Filters:
  ├── RSI range (oversold < 30, overbought > 70)
  ├── Above/below 50/200 MA
  ├── MACD crossover (last N days)
  └── Bollinger band position

AI Filter (unique feature!):
  └── Text box: "Find me undervalued tech stocks with high momentum"
      → AI converts to filter parameters automatically
```

---

### 🤖 PAGE 7: AI ADVISOR (`/ai`)

#### Full-Page AI Chat Interface
```
Layout:
  Left: Chat history (scrollable)
  Right: Context panel (current stock data, charts)

Features:
  ├── Natural language stock questions
  ├── AI generates charts inline in chat
  ├── Voice input (Web Speech API)
  ├── Suggested questions panel
  ├── AI memory across session
  └── Export chat as PDF report

Example Conversations:
  User: "What's the outlook for NVDA this month?"
  AI: "NVDA shows strong momentum... [with inline mini chart]"

  User: "Compare AAPL vs MSFT for long-term investment"
  AI: "Here's a comparison: [renders radar chart inline]"

  User: "Build me a balanced portfolio with $10,000"
  AI: "Based on current market conditions... [shows allocation table]"
```

---

### 🔔 PAGE 8: ALERTS (`/alerts`)

#### Alert Types
```
Price Alerts:
  ├── Price above / below threshold
  ├── % change in X hours
  └── New 52-week high/low

Technical Alerts:
  ├── RSI crosses 30 or 70
  ├── MACD crossover signal
  ├── Golden cross / Death cross
  └── Bollinger band breakout

AI Pattern Alerts:
  ├── "Head & Shoulders forming on MSFT"
  ├── "Unusual volume spike detected in TSLA"
  └── "Earnings report in 3 days — volatility expected"

Notification Channels:
  ├── Browser push notification
  ├── Email (Nodemailer / Resend.com free tier)
  └── In-app notification center
```

---

## 8. AI INTEGRATION LAYER

### Claude API Setup (Frontend)
```javascript
// services/aiService.js

const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";

export async function analyzeStock(symbol, price, question, history = []) {
  const systemPrompt = `
    You are NEXUS AI, a professional stock market analyst.
    Be concise, specific, and data-driven.
    Current context: Analyzing ${symbol} at $${price}.
    Format: Use plain text. Max 3 sentences unless asked for more.
    Never give financial advice — provide analysis only.
  `;

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: [
        ...history,
        { role: "user", content: question }
      ]
    })
  });

  const data = await response.json();
  return data.content[0].text;
}
```

### Sentiment Analysis (Hugging Face FinBERT)
```javascript
// services/sentimentService.js

const HF_API = "https://api-inference.huggingface.co/models/ProsusAI/finbert";

export async function analyzeSentiment(text) {
  const response = await fetch(HF_API, {
    method: "POST",
    headers: { Authorization: `Bearer ${HF_KEY}` },
    body: JSON.stringify({ inputs: text })
  });

  const result = await response.json();
  // Returns: [{ label: "positive"/"negative"/"neutral", score: 0.98 }]
  return result[0];
}

// Use for each news headline
export async function analyzeNewsFeed(headlines) {
  const sentiments = await Promise.all(
    headlines.map(h => analyzeSentiment(h.title))
  );
  return headlines.map((h, i) => ({
    ...h,
    sentiment: sentiments[i].label,
    confidence: sentiments[i].score
  }));
}
```

### AI Pattern Recognition
```javascript
// Prompt template for chart pattern detection
export async function detectPatterns(priceData, symbol) {
  const prices = priceData.slice(-30).map(d => d.close).join(", ");

  const prompt = `
    Analyze these last 30 closing prices for ${symbol}:
    [${prices}]

    Identify:
    1. Any classic chart pattern (Head & Shoulders, Double Top/Bottom,
       Triangle, Flag, Cup & Handle, etc.)
    2. Key support and resistance levels
    3. Trend direction (bullish/bearish/neutral)

    Respond in JSON format:
    {
      "pattern": "pattern name or null",
      "confidence": 0-100,
      "support": price,
      "resistance": price,
      "trend": "bullish/bearish/neutral",
      "summary": "one sentence"
    }
  `;

  const result = await analyzeStock(symbol, priceData.at(-1).close, prompt);
  return JSON.parse(result);
}
```

---

## 9. BACKEND ARCHITECTURE

### Express API Routes
```javascript
// Routes overview

// Stock Data
GET  /api/stocks/quote/:symbol          → Live quote
GET  /api/stocks/history/:symbol        → OHLCV history
GET  /api/stocks/indicators/:symbol     → RSI, MACD, BB
GET  /api/stocks/search?q=apple        → Symbol search
GET  /api/stocks/gainers               → Top gainers today
GET  /api/stocks/losers                → Top losers today
GET  /api/stocks/movers                → Most active

// Portfolio
GET  /api/portfolio                    → User's portfolio
POST /api/portfolio/add                → Add holding
PUT  /api/portfolio/:id                → Update holding
DELETE /api/portfolio/:id              → Remove holding
GET  /api/portfolio/performance        → P&L history

// AI
POST /api/ai/analyze                   → Proxy Claude API
POST /api/ai/sentiment                 → News sentiment
POST /api/ai/patterns                  → Pattern detection
GET  /api/ai/signals/:symbol           → AI buy/sell signals

// Alerts
GET  /api/alerts                       → User's alerts
POST /api/alerts                       → Create alert
DELETE /api/alerts/:id                 → Remove alert

// News
GET  /api/news?symbol=AAPL            → Stock-specific news
GET  /api/news/trending               → Trending market news
```

### Redis Caching Strategy
```javascript
// Cache keys and TTLs

const CACHE = {
  // Live quotes (update every 5 seconds)
  quote: (sym) => ({ key: `quote:${sym}`,    ttl: 5 }),

  // Historical data (daily candles don't change often)
  history: (sym) => ({ key: `hist:${sym}`,   ttl: 300 }),

  // Indicators (calculated, cache 1 min)
  indicators: (sym) => ({ key: `ind:${sym}`, ttl: 60 }),

  // News (refresh every 15 min)
  news: (sym) => ({ key: `news:${sym}`,      ttl: 900 }),

  // Gainers/Losers (refresh every 5 min)
  gainers: { key: "gainers",                  ttl: 300 },
};
```

### WebSocket Events
```javascript
// Server → Client events
socket.emit("price:update", { symbol, price, change, volume });
socket.emit("alert:triggered", { alertId, symbol, message });
socket.emit("news:breaking", { headline, sentiment, symbol });

// Client → Server events
socket.on("subscribe:stock", (symbol) => { /* join room */ });
socket.on("unsubscribe:stock", (symbol) => { /* leave room */ });
socket.on("portfolio:watch", (symbols) => { /* watch multiple */ });
```

---

## 10. DATABASE SCHEMA

```prisma
// prisma/schema.prisma

model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  name        String?
  createdAt   DateTime @default(now())
  portfolio   Holding[]
  alerts      Alert[]
  watchlist   WatchlistItem[]
}

model Holding {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  symbol      String
  quantity    Float
  avgCost     Float
  purchasedAt DateTime @default(now())
}

model Alert {
  id          String      @id @default(cuid())
  userId      String
  user        User        @relation(fields: [userId], references: [id])
  symbol      String
  type        AlertType   // PRICE_ABOVE, PRICE_BELOW, RSI_OB, etc.
  threshold   Float
  triggered   Boolean     @default(false)
  createdAt   DateTime    @default(now())
}

model WatchlistItem {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  symbol    String
  addedAt   DateTime @default(now())
}

enum AlertType {
  PRICE_ABOVE
  PRICE_BELOW
  PCT_CHANGE
  RSI_OVERBOUGHT
  RSI_OVERSOLD
  MACD_CROSS
  VOLUME_SPIKE
}
```

---

## 11. COMPONENT LIBRARY

### GlitchText Component
```jsx
// components/ui/GlitchText.jsx
// Usage: <GlitchText text="NEXUS TRADE" interval={4000} />

// Effect: Every N seconds, text briefly splits into
// red and cyan offset copies (like a broken CRT screen)
```

### AnimatedCounter Component
```jsx
// components/ui/AnimatedCounter.jsx
// Usage: <AnimatedCounter from={0} to={189.42} prefix="$" decimals={2} duration={1.5} />

// Effect: Number smoothly counts from start to end value
// Uses requestAnimationFrame for smooth easing
// Re-triggers whenever "to" prop changes
```

### MagneticButton Component
```jsx
// components/ui/MagneticButton.jsx
// Usage: <MagneticButton strength={0.4}>Click Me</MagneticButton>

// Effect: Button physically moves toward the cursor
// within a 100px radius using mouse position tracking
// Returns to center when cursor leaves
```

### FloatingCard Component
```jsx
// components/ui/FloatingCard.jsx
// Usage: <FloatingCard depth={20}><StockInfo/></FloatingCard>

// Effect: Card tilts in 3D toward cursor using CSS
// perspective + rotateX/Y transforms
// Creates illusion of a physical 3D card
```

### HologramPanel Component
```jsx
// components/ui/HologramPanel.jsx
// Effect: Panel has animated scan lines, corner brackets,
// subtle flicker, and blue tinted glass background
// Looks like a holographic display from sci-fi
```

### PriceRing Component (Three.js)
```jsx
// components/3d/PriceRings.jsx
// Renders torus rings orbiting around a stock orb
// Ring color = green (up) or red (down)
// Ring speed = proportional to volume
// Ring size = proportional to market cap
```

---

## 12. ANIMATION SPECS

### CSS Keyframes Required
```css
/* animations.css */

/* Particle pulse glow */
@keyframes particle-pulse {
  0%, 100% { opacity: 0.6; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.4); }
}

/* Ticker tape scroll */
@keyframes ticker-scroll {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

/* Glitch effect */
@keyframes glitch-1 {
  0%, 90%, 100% { clip-path: inset(0 0 100% 0); }
  91% { clip-path: inset(30% 0 50% 0); transform: translate(-2px, 0); }
  93% { clip-path: inset(70% 0 10% 0); transform: translate(2px, 0); }
}

/* Scanline sweep */
@keyframes scanline {
  from { top: -3px; }
  to { top: 100vh; }
}

/* Float up/down breathing */
@keyframes float-breath {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-8px); }
}

/* Price flash on update */
@keyframes price-flash {
  0% { background: transparent; }
  30% { background: rgba(0, 255, 204, 0.2); }
  100% { background: transparent; }
}

/* Number counting */
@keyframes count-up {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Radar chart draw */
@keyframes radar-draw {
  from { stroke-dashoffset: 1000; }
  to { stroke-dashoffset: 0; }
}

/* Bar chart grow */
@keyframes bar-grow {
  from { transform: scaleY(0); transform-origin: bottom; }
  to { transform: scaleY(1); transform-origin: bottom; }
}

/* Blink cursor */
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Orbit ring */
@keyframes orbit {
  from { transform: rotate(0deg) translateX(var(--orbit-radius)) rotate(0deg); }
  to { transform: rotate(360deg) translateX(var(--orbit-radius)) rotate(-360deg); }
}

/* Page transition wipe */
@keyframes page-wipe-out {
  from { clip-path: inset(0 0 0 0); }
  to { clip-path: inset(0 0 100% 0); }
}

@keyframes page-wipe-in {
  from { clip-path: inset(100% 0 0 0); }
  to { clip-path: inset(0 0 0 0); }
}
```

### Three.js Animation Parameters
```javascript
// Recommended values for smooth antigravity feel

PARTICLE_DRIFT_SPEED     = 0.008   // How fast particles sway
PARTICLE_AMPLITUDE       = 3.5     // How far they sway
SPHERE_ROTATION_SPEED    = 0.05    // Background sphere spin
LIGHT_ORBIT_SPEED        = 0.4     // Point light rotation
TORUS_ROTATION_SPEED     = 0.15    // Torus ring spin
CAMERA_FOV               = 60      // Field of view
DAMPING_FACTOR           = 0.98    // Velocity damping
CONNECTION_OPACITY       = 0.06    // Neural lines opacity
VOLATILITY_THRESHOLD     = 0.7     // When chaos starts
```

---

## 13. API INTEGRATION GUIDE

### Finnhub WebSocket (Real-Time Prices)
```javascript
// websocketService.js

const socket = new WebSocket("wss://ws.finnhub.io?token=YOUR_KEY");

socket.onopen = () => {
  symbols.forEach(sym => {
    socket.send(JSON.stringify({ type: "subscribe", symbol: sym }));
  });
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === "trade") {
    data.data.forEach(trade => {
      // { s: "AAPL", p: 189.45, t: 1234567890, v: 500 }
      updatePrice(trade.s, trade.p, trade.v);
    });
  }
};
```

### Alpha Vantage (Historical + Indicators)
```javascript
// Base URL: https://www.alphavantage.co/query

// Daily OHLCV
GET ?function=TIME_SERIES_DAILY&symbol=AAPL&apikey=KEY

// RSI
GET ?function=RSI&symbol=AAPL&interval=daily&time_period=14&series_type=close&apikey=KEY

// MACD
GET ?function=MACD&symbol=AAPL&interval=daily&series_type=close&apikey=KEY

// Bollinger Bands
GET ?function=BBANDS&symbol=AAPL&interval=daily&time_period=20&series_type=close&apikey=KEY
```

### NewsAPI (Financial News)
```javascript
// Top business headlines
GET https://newsapi.org/v2/top-headlines?category=business&apiKey=KEY

// Stock-specific news
GET https://newsapi.org/v2/everything?q=AAPL+stock&sortBy=publishedAt&apiKey=KEY
```

### Polygon.io (Aggregates + Snapshot)
```javascript
// Previous day OHLCV for all tickers
GET https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/2024-01-15?apiKey=KEY

// Real-time snapshot
GET https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers?tickers=AAPL,TSLA&apiKey=KEY
```

### Yahoo Finance (No Key Required)
```javascript
// Install: npm install yahoo-finance2

import yahooFinance from "yahoo-finance2";

// Get quote
const quote = await yahooFinance.quote("AAPL");

// Historical data
const historical = await yahooFinance.historical("AAPL", {
  period1: "2024-01-01",
  period2: "2024-12-31",
  interval: "1d"
});

// Trending symbols
const trending = await yahooFinance.trendingSymbols("US");
```

---

## 14. COLOR SYSTEM & DESIGN TOKENS

```css
/* globals.css — Design Tokens */

:root {
  /* ── Primary Colors ── */
  --color-bg-deep:        #02040c;    /* Deepest background */
  --color-bg-dark:        #030810;    /* Main background */
  --color-bg-card:        rgba(2, 6, 20, 0.82);
  --color-bg-hover:       rgba(0, 255, 204, 0.06);

  /* ── Accent Colors ── */
  --color-neon-green:     #00ffcc;    /* Primary accent */
  --color-neon-blue:      #0088cc;    /* Secondary accent */
  --color-neon-purple:    #7b61ff;    /* Tertiary accent */
  --color-neon-orange:    #ff6b35;    /* Warning / Tesla */
  --color-neon-yellow:    #f5a623;    /* Caution */

  /* ── Semantic Colors ── */
  --color-bull:           #00ffcc;    /* Price up */
  --color-bear:           #ff4455;    /* Price down */
  --color-neutral:        #667788;    /* No change */

  /* ── Stock Colors ── */
  --color-aapl:           #00ffcc;
  --color-tsla:           #ff6b35;
  --color-nvda:           #76b900;
  --color-googl:          #4285f4;
  --color-msft:           #00a4ef;
  --color-meta:           #0668e1;
  --color-amzn:           #ff9900;

  /* ── Text Colors ── */
  --color-text-primary:   #ccddee;
  --color-text-secondary: #778899;
  --color-text-muted:     #445566;
  --color-text-disabled:  #334455;

  /* ── Border Colors ── */
  --color-border-subtle:  rgba(0, 255, 204, 0.1);
  --color-border-active:  rgba(0, 255, 204, 0.4);

  /* ── Glow Effects ── */
  --glow-green:   0 0 20px rgba(0, 255, 204, 0.4);
  --glow-blue:    0 0 20px rgba(0, 136, 204, 0.4);
  --glow-red:     0 0 20px rgba(255, 68, 85, 0.4);

  /* ── Spacing ── */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  --space-lg: 24px;
  --space-xl: 40px;

  /* ── Border Radius ── */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 16px;
  --radius-xl: 24px;

  /* ── Glassmorphism ── */
  --glass-bg:       rgba(2, 6, 20, 0.82);
  --glass-blur:     16px;
  --glass-border:   rgba(0, 255, 204, 0.1);

  /* ── Z-Index Layers ── */
  --z-bg:           0;    /* Three.js canvas */
  --z-effects:      1;    /* Scanlines, overlays */
  --z-content:      2;    /* Main UI */
  --z-sidebar:      10;   /* Navigation */
  --z-modal:        50;   /* Modals */
  --z-toast:        100;  /* Notifications */
  --z-cursor:       999;  /* Custom cursor */
}
```

---

## 15. TYPOGRAPHY SYSTEM

```css
/* fonts.css */

/* Display / Logo font — Futuristic */
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&display=swap');

/* Monospace — Data & prices */
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&display=swap');

/* Body text — Clean reading */
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap');

/* Usage Rules: */
.font-display    { font-family: "Orbitron", monospace; }    /* Logo, headings, symbols */
.font-data       { font-family: "IBM Plex Mono", monospace; } /* Prices, numbers, code */
.font-body       { font-family: "DM Sans", sans-serif; }    /* Body text, descriptions */

/* Type Scale */
--text-xs:   10px;  /* Labels, badges, captions */
--text-sm:   12px;  /* Secondary info */
--text-base: 14px;  /* Body text */
--text-md:   16px;  /* Subheadings */
--text-lg:   20px;  /* Section titles */
--text-xl:   28px;  /* Page titles */
--text-2xl:  36px;  /* Hero numbers */
--text-3xl:  48px;  /* Price display */
--text-4xl:  64px;  /* Landing headline */
```

---

## 16. DEPLOYMENT GUIDE

### Frontend (Vercel — Free)
```bash
# Install Vercel CLI
npm install -g vercel

# Build
cd frontend
npm run build

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard:
# VITE_FINNHUB_KEY, VITE_ANTHROPIC_KEY, VITE_API_URL
```

### Backend (Railway — Free Tier)
```bash
# Push to GitHub
git push origin main

# Railway auto-deploys from GitHub
# Set env vars in Railway dashboard
# Connect Supabase PostgreSQL URL
# Connect Upstash Redis URL
```

### Database (Supabase — Free)
```bash
# Create project at supabase.com
# Copy DATABASE_URL from settings
# Run migrations:
npx prisma migrate deploy
```

### Redis (Upstash — Free)
```bash
# Create database at upstash.com
# Copy REDIS_URL (redis://...)
# Used for: price caching, WebSocket rooms, rate limiting
```

### Domain (Freenom or Cloudflare)
```
1. Register free .tk domain at freenom.com
2. Point DNS to Vercel
3. Add custom domain in Vercel dashboard
4. SSL auto-provisioned by Vercel
```

---

## 17. WEEK-BY-WEEK ROADMAP

```
WEEK 1 — Foundation
  ✓ Set up React + Vite + Tailwind + Three.js
  ✓ Build routing (React Router)
  ✓ Create design token system (CSS variables)
  ✓ Build Header + Navigation component
  ✓ Connect Finnhub API (static quotes)
  ✓ Deploy skeleton to Vercel

WEEK 2 — 3D Antigravity Engine
  ✓ AntiGravityField.jsx (Three.js particle system)
  ✓ Gravity mode logic (up/down based on price)
  ✓ WireframeSphere background
  ✓ Connection lines neural network
  ✓ Landing page hero section with 3D background

WEEK 3 — Dashboard Core
  ✓ Candlestick chart (TradingView Lightweight Charts)
  ✓ FloatingCard stock watchlist
  ✓ Live price with AnimatedCounter
  ✓ Volume chart
  ✓ TickerTape component

WEEK 4 — Live Data & WebSocket
  ✓ Backend: Express + Socket.io server
  ✓ Finnhub WebSocket integration
  ✓ Redis price caching
  ✓ useLivePrice React hook
  ✓ Real-time dashboard updates

WEEK 5 — AI Integration
  ✓ Claude API connection (backend proxy)
  ✓ AIAnalystChat component
  ✓ Sentiment analysis (FinBERT via HuggingFace)
  ✓ News feed with sentiment tags
  ✓ Pattern detection prompts

WEEK 6 — Technical Indicators
  ✓ Alpha Vantage integration (RSI, MACD, BB)
  ✓ Indicator chart overlays
  ✓ Stock Detail page (/stock/:symbol)
  ✓ Peer comparison radar chart

WEEK 7 — Portfolio & Markets
  ✓ Portfolio CRUD (backend + frontend)
  ✓ P&L calculations
  ✓ 3D Market Terrain heatmap
  ✓ AI portfolio review
  ✓ User authentication (JWT)

WEEK 8 — Alerts & Screener
  ✓ Alert creation UI
  ✓ Alert checker background job (Bull Queue)
  ✓ Stock screener with filters
  ✓ AI natural language screener
  ✓ Push notifications

WEEK 9 — Polish & Animations
  ✓ GSAP page transitions
  ✓ Scroll-triggered animations (ScrollTrigger)
  ✓ Custom magnetic cursor
  ✓ Mobile responsive layout
  ✓ Loading states and skeleton screens
  ✓ Error boundaries

WEEK 10 — Launch
  ✓ Performance optimization (lazy loading, code splitting)
  ✓ SEO meta tags
  ✓ Demo data for portfolio showcase
  ✓ Screen recording for demo video
  ✓ Final deployment + custom domain
  ✓ README documentation
```

---

## 18. TEAM ROLES

### 4-Person Team Split

| Person | Role | Responsibilities |
|--------|------|-----------------|
| **Dev 1** | 3D / Animation Lead | Three.js engine, GSAP animations, particle system, page transitions |
| **Dev 2** | Frontend UI | Charts, Dashboard, Portfolio, Stock Detail pages, responsive CSS |
| **Dev 3** | Backend Engineer | Express API, WebSockets, Redis cache, database, authentication |
| **Dev 4** | AI / Data Engineer | Claude integration, FinBERT sentiment, news scraper, alerts system |

### Solo Developer Path
```
Month 1: Backend + Data layer (APIs, WebSocket, DB)
Month 2: Core Frontend (Dashboard, Charts, Live data)
Month 3: AI Features + 3D Animations + Polish
```

---

## 💡 QUICK WINS FOR MAXIMUM IMPACT

These 5 things take <1 day each but make the biggest visual impression:

1. **Ticker Tape** — scrolling price tape at top: 2 hours, looks ultra professional
2. **Price Flash** — green/red background flash on price update: 30 minutes, feels Bloomberg-level
3. **Magnetic Buttons** — cursor-attracted buttons: 1 hour, jaw-dropping interaction
4. **Glitch Text Logo** — occasional CRT glitch on logo: 1 hour, looks elite
5. **3D Tilt Cards** — mouse-follow 3D tilt on stock cards: 2 hours, unforgettable

---

## 🎯 JUDGING CRITERIA THIS PROJECT ACES

| Criteria | How This Project Wins |
|----------|----------------------|
| **Innovation** | Antigravity physics + AI in the same app |
| **Technical Depth** | WebGL + WebSocket + AI APIs + Full-stack |
| **Visual Impact** | Award-worthy 3D animations |
| **Real-World Value** | Actual usable trading tool |
| **Code Quality** | Modular architecture, clean separation |
| **Scalability** | Redis cache, queue jobs, optimized API calls |

---

*Blueprint Version 1.0 — NEXUS TRADE*  
*Build it. Ship it. Get hired.*
