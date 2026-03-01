import { useEffect, useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { MarketGalaxy } from '../components/3d/MarketGalaxy'
import { TrendingUp, TrendingDown, Clock, Activity, ExternalLink, Newspaper } from 'lucide-react'

// News source favicon with fallback
const SourceFavicon = ({ url }) => {
    const [err, setErr] = useState(false)
    let domain = ''
    try { domain = new URL(url).hostname } catch { }
    if (!domain || err) return <Newspaper size={16} className="text-primary" />
    return (
        <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt={domain}
            className="w-6 h-6 rounded object-contain"
            onError={() => setErr(true)}
        />
    )
}

// Placeholder for smaller components
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-surface/60 backdrop-blur-lg border border-white/5 rounded-2xl shadow-xl p-6 ${className}`}>
        {children}
    </div>
)

export function Markets() {
    const [indices, setIndices] = useState([
        { label: 'NIFTY 50', val: 'Loading...', change: '0.00%', up: true, points: '0.00' },
        { label: 'SENSEX', val: 'Loading...', change: '0.00%', up: true, points: '0.00' },
        { label: 'NIFTY BANK', val: 'Loading...', change: '0.00%', up: true, points: '0.00' },
        { label: 'NIFTY IT', val: 'Loading...', change: '0.00%', up: true, points: '0.00' },
    ])
    const [news, setNews] = useState([])
    const [newsLoading, setNewsLoading] = useState(true)
    const [topMovers, setTopMovers] = useState([])
    const [marketBreadth, setMarketBreadth] = useState({ advancing: 0, declining: 0 })
    const [fearGreed, setFearGreed] = useState(50)
    const [heatmapTab, setHeatmapTab] = useState('All')

    useEffect(() => {
        let isMounted = true;
        const fetchIndices = async () => {
            try {
                // Testing specific index symbols that work cleanly with Yahoo Finance India
                const res = await fetch(`/api/stocks?symbols=${encodeURIComponent('^NSEI,^BSESN,^NSEBANK,^CNXIT')}`)
                const data = await res.json()

                if (data && data.length > 0 && isMounted) {
                    setIndices(prev => {
                        const newIndices = [...prev];

                        data.forEach(d => {
                            const isUp = d.change >= 0;
                            const formattedPrice = (d.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                            const formattedChange = `${isUp ? '+' : ''}${(d.change || 0).toFixed(2)}%`;
                            const points = Math.abs((d.price || 0) * ((d.change || 0) / 100)).toFixed(2);

                            if (d.sym === '^NSEI') {
                                newIndices[0] = { label: 'NIFTY 50', val: formattedPrice, change: formattedChange, up: isUp, points };
                            } else if (d.sym === '^BSESN') {
                                newIndices[1] = { label: 'SENSEX', val: formattedPrice, change: formattedChange, up: isUp, points };
                            } else if (d.sym === '^NSEBANK') {
                                newIndices[2] = { label: 'NIFTY BANK', val: formattedPrice, change: formattedChange, up: isUp, points };
                            } else if (d.sym === '^CNXIT') {
                                newIndices[3] = { label: 'NIFTY IT', val: formattedPrice, change: formattedChange, up: isUp, points };
                            }
                        });

                        return newIndices;
                    });
                }
            } catch (err) {
                console.error("Failed to fetch indices", err)
            }
        }

        fetchIndices()
        const interval = setInterval(fetchIndices, 60000)
        return () => {
            isMounted = false;
            clearInterval(interval);
        }
    }, [])

    // Fetch News
    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true)
            try {
                const res = await fetch('/api/news')
                const data = await res.json()
                if (Array.isArray(data)) setNews(data)
            } catch (err) {
                console.error('News error:', err)
            } finally {
                setNewsLoading(false)
            }
        }
        fetchNews()
        const newsInterval = setInterval(fetchNews, 60000) // refresh every minute
        return () => clearInterval(newsInterval)
    }, [])

    // Fetch Top Movers
    useEffect(() => {
        const fetchMovers = async () => {
            try {
                const res = await fetch('/api/scanner')
                const data = await res.json()
                if (Array.isArray(data)) {
                    const sorted = [...data].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                    setTopMovers(sorted.slice(0, 6))

                    // Calc dynamic Market Breadth
                    const adv = data.filter(d => d.change > 0).length
                    const dec = data.filter(d => d.change < 0).length
                    setMarketBreadth({ advancing: adv, declining: dec })

                    // Basic Fear & Greed Heuristic based on scanner momentum
                    if (data.length > 0) {
                        const ratio = adv / data.length
                        const newFg = Math.min(Math.max(Math.round(ratio * 100), 10), 90)
                        setFearGreed(newFg)
                    }
                }
            } catch (err) {
                console.error('Movers error:', err)
            }
        }
        fetchMovers()
    }, [])

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-8">

                {/* TOP ROW: Indices Overview */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 flex-shrink-0">
                    {indices.map((index, i) => (
                        <GlassCard key={i} className="p-4 flex flex-col justify-between h-28 hover:bg-white/5 transition-colors cursor-pointer group">
                            <div className="flex justify-between items-start">
                                <span className="text-sm font-medium text-text-muted">{index.label}</span>
                                <div className={`p-1.5 rounded-md ${index.up ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                    {index.up ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                </div>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xl font-bold font-mono">{index.val}</span>
                                <div className="flex items-center gap-2 text-xs font-medium">
                                    <span className={index.up ? 'text-success' : 'text-danger'}>{index.change}</span>
                                    <span className="text-text-muted">({index.up ? '+' : ''}{index.points})</span>
                                </div>
                            </div>
                        </GlassCard>
                    ))}
                </div>

                {/* MIDDLE SECTION: 3D Heatmap & Info */}
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

                    {/* Main 3D Heatmap Display */}
                    <GlassCard className="lg:col-span-3 relative p-0 overflow-hidden flex flex-col group border-white/10 hover:border-primary/30 transition-colors">
                        {/* Header Overlay */}
                        <div className="absolute top-0 left-0 right-0 z-10 flex justify-between items-center p-6 pointer-events-none">
                            <div>
                                <h2 className="text-xl font-bold font-display tracking-tight text-white flex items-center gap-2">
                                    GLOBAL SECTOR HEATMAP
                                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_#00ffcc]"></div>
                                </h2>
                                <p className="text-sm text-text-muted mt-1">Real-time market cap visualization</p>
                            </div>
                            <div className="flex gap-2 pointer-events-auto shadow-xl">
                                <button onClick={() => setHeatmapTab('Tech')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${heatmapTab === 'Tech' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface border-white/10 hover:bg-white/10'}`}>Tech</button>
                                <button onClick={() => setHeatmapTab('Finance')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${heatmapTab === 'Finance' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface border-white/10 hover:bg-white/10'}`}>Finance</button>
                                <button onClick={() => setHeatmapTab('All')} className={`px-3 py-1.5 rounded-lg border text-sm font-medium transition-colors ${heatmapTab === 'All' ? 'bg-primary/20 border-primary/50 text-primary' : 'bg-surface border-white/10 hover:bg-white/10'}`}>All</button>
                            </div>
                        </div>

                        {/* 3D Canvas Container */}
                        <div className="w-full p-4 pt-20 pb-14">
                            <MarketGalaxy activeTab={heatmapTab} />
                        </div>

                        {/* Footer Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 border-t border-white/5 bg-surface/50 backdrop-blur-md flex justify-between items-center text-xs text-text-muted font-mono">
                            <div className="flex gap-4">
                                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-success rounded-full"></div> Advancing: {marketBreadth.advancing}</span>
                                <span className="flex items-center gap-2"><div className="w-2 h-2 bg-danger rounded-full"></div> Declining: {marketBreadth.declining}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Clock size={12} /> Last updated: LIVE
                            </div>
                        </div>
                    </GlassCard>

                    {/* Right Info Column */}
                    <div className="flex flex-col gap-6">

                        <GlassCard className="flex flex-col flex-shrink-0">
                            <h3 className="font-medium mb-4 flex items-center gap-2">
                                <Activity size={18} className="text-primary" /> Market Sentiment
                            </h3>

                            {/* Fear & Greed Meter Placeholder */}
                            <div className="relative h-32 flex items-center justify-center mb-4">
                                <div className="w-full h-full max-w-[120px] max-h-[120px] rounded-[100px_100px_0_0] border-[12px] border-b-0 border-primary/20 relative overflow-hidden flex items-end justify-center pb-2">
                                    <div className="absolute inset-x-0 bottom-0 h-full border-[12px] border-b-0 border-success rounded-[100px_100px_0_0]" style={{ clipPath: `polygon(0 0, ${fearGreed}% 0, ${fearGreed}% 100%, 0 100%)` }}></div>
                                    <div className="w-2 h-16 origin-bottom bg-white absolute bottom-0 left-[calc(50%-4px)] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-transform duration-1000 ease-out"
                                        style={{ transform: `rotate(${(fearGreed / 100) * 180 - 90}deg)` }}></div>
                                    <span className={`font-bold text-2xl z-10 bg-surface/80 px-2 rounded backdrop-blur ${fearGreed > 60 ? 'text-success' : fearGreed < 40 ? 'text-danger' : 'text-warning'}`}>{fearGreed}</span>
                                </div>
                            </div>
                            <div className="text-center">
                                <span className={`font-bold tracking-widest text-sm text-glow flex justify-center uppercase ${fearGreed > 60 ? 'text-success' : fearGreed < 40 ? 'text-danger' : 'text-warning'}`}>
                                    {fearGreed > 75 ? 'Extreme Greed' : fearGreed > 55 ? 'Greed' : fearGreed < 25 ? 'Extreme Fear' : fearGreed < 45 ? 'Fear' : 'Neutral'}
                                </span>
                            </div>
                        </GlassCard>

                        <GlassCard className="flex-1 flex flex-col min-h-[250px]">
                            <h3 className="font-medium mb-4 flex items-center justify-between">
                                <span>Top Movers</span>
                                <span className="text-xs px-2 py-1 rounded bg-white/5 text-text-muted">Today</span>
                            </h3>
                            <div className="flex flex-col gap-1 overflow-y-auto">
                                {topMovers.length > 0 ? topMovers.map((t, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                                        <div>
                                            <span className="font-medium font-mono text-sm">{t.sym}</span>
                                            <div className="text-xs text-text-muted truncate max-w-[90px]">{t.name?.split(' ').slice(0, 2).join(' ')}</div>
                                        </div>
                                        <span className={`text-sm font-medium ${t.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                            {t.change >= 0 ? '+' : ''}{(t.change || 0).toFixed(2)}%
                                        </span>
                                    </div>
                                )) : [
                                    { sym: 'RELIANCE', change: '+1.42%', up: true },
                                    { sym: 'TCS', change: '+0.8%', up: true },
                                    { sym: 'HDFCBANK', change: '-1.12%', up: false },
                                    { sym: 'INFY', change: '+0.88%', up: true },
                                ].map((t, i) => (
                                    <div key={i} className="flex justify-between items-center p-2 rounded hover:bg-white/5 transition-colors cursor-pointer border-b border-white/5 last:border-0">
                                        <span className="font-medium font-mono text-sm">{t.sym}</span>
                                        <span className={`text-sm font-medium ${t.up ? 'text-success' : 'text-danger'}`}>{t.change}</span>
                                    </div>
                                ))}
                            </div>
                        </GlassCard>

                    </div>

                </div>
                {/* BOTTOM: Live News Feed */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    <div className="xl:col-span-3">
                        <GlassCard className="p-5">
                            <h3 className="font-medium mb-4 flex items-center gap-2">
                                <Newspaper size={16} className="text-primary" />
                                <span>Market News Feed</span>
                                <span className="ml-auto text-xs px-2 py-1 rounded bg-success/10 text-success border border-success/20 font-mono">● LIVE</span>
                            </h3>
                            {newsLoading ? (
                                <div className="text-center py-6 text-text-muted text-sm font-mono animate-pulse">LOADING NEWS FEED...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {news.map((article, i) => (
                                        <a
                                            key={i}
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-primary/20 transition-all group"
                                        >
                                            <div className="w-10 h-10 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                                                <SourceFavicon url={article.link} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-white line-clamp-2 group-hover:text-primary transition-colors">{article.title}</p>
                                                <div className="flex items-center gap-2 mt-1.5 text-xs text-text-muted">
                                                    <span className="font-medium truncate max-w-[120px]">{article.source?.replace(' - Latest News', '').replace(' RSS Feed', '')}</span>
                                                    <span>•</span>
                                                    <span>{new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                                                </div>
                                            </div>
                                        </a>
                                    ))}
                                    {news.length === 0 && (
                                        <p className="text-text-muted text-sm col-span-2 text-center py-4">No news articles available right now. Try refreshing the page.</p>
                                    )}
                                </div>
                            )}
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
