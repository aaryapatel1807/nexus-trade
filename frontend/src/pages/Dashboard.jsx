import { useState, useEffect } from 'react'
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts'
import { DashboardLayout, CompanyLogo } from '../components/layout/DashboardLayout'
import { TrendingUp, TrendingDown, Maximize2, Activity, Zap, Newspaper, ExternalLink } from 'lucide-react'
import { TradeTerminal } from '../components/trading/TradeTerminal'
import { apiFetch } from '../lib/api'

// Placeholder for smaller components
const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-surface/60 backdrop-blur-lg border border-white/5 rounded-2xl shadow-xl p-6 ${className}`}>
        {children}
    </div>
)

// News source favicon with Newspaper fallback
const NewsSourceIcon = ({ url }) => {
    const [err, setErr] = useState(false)
    let domain = ''
    try { domain = new URL(url).hostname } catch { }
    if (!domain || err) return <Newspaper size={18} className="text-primary" />
    return (
        <img
            src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
            alt={domain}
            className="w-7 h-7 rounded object-contain"
            onError={() => setErr(true)}
        />
    )
}

// Removed static mockChartData

export function Dashboard() {
    const [watchlist, setWatchlist] = useState([]);
    const [activeStock, setActiveStock] = useState(null);
    const [chartData, setChartData] = useState([]);
    const [activeChartTimeframe, setActiveChartTimeframe] = useState('1M');
    const [isChartLoading, setIsChartLoading] = useState(false);
    const [scannerData, setScannerData] = useState([]);
    const [scannerLoading, setScannerLoading] = useState(true);
    const [news, setNews] = useState([]);
    const [newsLoading, setNewsLoading] = useState(true);

    // Fetch chart data when activeStock or timeframe changes
    useEffect(() => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 12000) // 12s max

        const fetchChartData = async () => {
            let sym = 'RELIANCE.NS'
            if (activeStock && activeStock.sym) {
                sym = activeStock.sym.includes('.NS') ? activeStock.sym : `${activeStock.sym}.NS`
            }
            setIsChartLoading(true)
            try {
                const res = await apiFetch(
                    `/api/stocks/history?symbol=${sym}&period=${activeChartTimeframe.toLowerCase()}`,
                    { signal: controller.signal }
                )
                const data = await res.json()
                if (data && Array.isArray(data)) setChartData(data)
            } catch (err) {
                if (err.name !== 'AbortError') console.error('Chart fetch failed:', err)
            } finally {
                clearTimeout(timeout)
                setIsChartLoading(false)
            }
        }
        fetchChartData()
        return () => { controller.abort(); clearTimeout(timeout) }
    }, [activeStock, activeChartTimeframe]);

    useEffect(() => {
        const fetchWatchlist = async () => {
            try {
                const res = await apiFetch('/api/stocks?symbols=RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,SBIN.NS')
                const data = await res.json()
                if (data && data.length > 0) {
                    setWatchlist(data.map(d => ({
                        sym: d.sym.replace('.NS', ''),
                        name: d.name,
                        price: (d.price || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                        change: `${d.change >= 0 ? '+' : ''}${(d.change || 0).toFixed(2)}%`,
                        up: d.change >= 0
                    })))
                }
            } catch (err) {
                console.error("Failed to fetch watchlist", err)
            }
        }
        fetchWatchlist()
        const interval = setInterval(fetchWatchlist, 60000)
        return () => clearInterval(interval)
    }, [])

    // Scanner Data
    useEffect(() => {
        const fetchScanner = async () => {
            setScannerLoading(true)
            try {
                const res = await apiFetch('/api/scanner')
                const data = await res.json()
                if (Array.isArray(data)) {
                    // Sort by absolute change to get top movers
                    const sorted = [...data].sort((a, b) => Math.abs(b.change) - Math.abs(a.change))
                    setScannerData(sorted)
                }
            } catch (err) { console.error('Scanner error:', err) }
            finally { setScannerLoading(false) }
        }
        fetchScanner()
        const interval = setInterval(fetchScanner, 60000)
        return () => clearInterval(interval)
    }, [])

    // News Feed
    useEffect(() => {
        const fetchNews = async () => {
            setNewsLoading(true)
            try {
                const res = await apiFetch('/api/news')
                const data = await res.json()
                if (Array.isArray(data)) setNews(data.slice(0, 8))
            } catch (err) { console.error('News error:', err) }
            finally { setNewsLoading(false) }
        }
        fetchNews()
        // Auto-refresh news every 15 minutes
        const interval = setInterval(fetchNews, 900000)
        return () => clearInterval(interval)
    }, [])

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto">

                {/* TOP ROW: Price Hero & Actions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Main Price Display */}
                    <GlassCard className="lg:col-span-2 relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                        <div className="flex items-start justify-between">
                            <div>
                                <h2 className="text-sm font-medium text-text-muted flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                                    {activeStock ? `${activeStock.name} (${activeStock.sym})` : 'LIVE MARKET DATA'}
                                </h2>
                                <div className="mt-4 flex items-end gap-3">
                                    <h1 className="text-5xl font-mono font-bold tracking-tight">
                                        {activeStock ? `₹${activeStock.price}` : (watchlist[0] ? `₹${watchlist[0].price}` : '---')}
                                    </h1>
                                    <span className={`text-xl font-medium mb-1 flex items-center ${(activeStock ? activeStock.up : watchlist[0]?.up) ? 'text-success' : 'text-danger'}`}>
                                        {(activeStock ? activeStock.up : watchlist[0]?.up) ? <TrendingUp size={24} className="mr-1" /> : <TrendingDown size={24} className="mr-1" />}
                                        {activeStock ? activeStock.change : (watchlist[0] ? watchlist[0].change : '---')}
                                    </span>
                                </div>
                                <p className="text-text-muted mt-2 text-sm">{activeStock ? `Viewing historical chart for ${activeStock.sym}` : 'Select an asset from your watchlist to view live data.'}</p>
                            </div>

                            <div className="flex gap-2">
                                {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((tf) => (
                                    <button
                                        key={tf}
                                        onClick={() => setActiveChartTimeframe(tf)}
                                        className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${activeChartTimeframe === tf ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                                    >
                                        {tf}
                                    </button>
                                ))}
                                <button className="ml-2 p-1.5 rounded-md text-text-muted hover:text-white hover:bg-white/5 bg-transparent">
                                    <Maximize2 size={16} />
                                </button>
                            </div>
                        </div>

                        {/* Interactive Chart */}
                        <div className="h-[300px] w-full mt-6 pl-[-20px] relative">
                            {isChartLoading && (
                                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-xl">
                                    <span className="text-primary font-mono animate-pulse">LOADING CHART DATA...</span>
                                </div>
                            )}
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData}>
                                    <XAxis dataKey="time" stroke="#8f9bb3" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis domain={['auto', 'auto']} stroke="#8f9bb3" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#1A1D2D', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff' }}
                                        itemStyle={{ color: '#00ffcc' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#00ffcc" strokeWidth={3} dot={false} activeDot={{ r: 8, fill: '#00ffcc' }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </GlassCard>

                    {/* Watchlist / Trade Terminal Dynamic View */}
                    <GlassCard className="flex flex-col h-[460px] p-4 lg:p-6 overflow-hidden relative">
                        {activeStock ? (
                            <TradeTerminal stock={activeStock} onCancel={() => setActiveStock(null)} />
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-medium inline-flex items-center gap-2"><Activity size={18} className="text-primary" /> Market Watch</h3>
                                    <button className="text-sm text-primary hover:text-glow-primary transition-all">View All</button>
                                </div>

                                <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-3">
                                    {watchlist.map((stock) => (
                                        <div key={stock.sym} onClick={() => setActiveStock(stock)} className="flex items-center justify-between p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group">
                                            <div className="flex items-center gap-3">
                                                <CompanyLogo sym={stock.sym} name={stock.name} size={40} />
                                                <div>
                                                    <div className="font-medium text-sm group-hover:text-primary transition-colors">{stock.sym}</div>
                                                    <div className="text-xs text-text-muted">{stock.name}</div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-mono text-sm">${stock.price}</div>
                                                <div className={`text-xs font-medium flex items-center justify-end gap-1 ${stock.up ? 'text-success' : 'text-danger'}`}>
                                                    {stock.up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                    {stock.change}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </GlassCard>
                </div>

                {/* BOTTOM ROW: AI Scanner & Live News */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* AI Scanner - Live NSE Top Movers */}
                    <GlassCard className="lg:col-span-1 flex flex-col relative overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-secondary to-primary"></div>

                        <h3 className="font-medium flex items-center gap-2 mb-4">
                            <div className="w-2 h-2 bg-secondary rounded-full shadow-[0_0_8px_#7000ff] animate-pulse"></div>
                            AI Scanner Analysis
                            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-mono">● LIVE</span>
                        </h3>

                        {
                            scannerLoading ? (
                                <div className="flex-1 bg-black/20 rounded-xl p-4 border border-white/5 font-mono text-sm flex items-center justify-center">
                                    <span className="text-primary animate-pulse">SCANNING NSE MARKET...</span>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col gap-2 overflow-y-auto">
                                    {scannerData.slice(0, 7).map((stock, i) => (
                                        <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-white/[0.02] border border-white/5 hover:bg-white/5 transition-colors cursor-pointer">
                                            <CompanyLogo sym={stock.sym} name={stock.name} size={32} />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="font-bold text-sm font-mono text-white">{stock.sym}</span>
                                                    <span className={`text-xs font-semibold flex items-center gap-0.5 ${stock.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {stock.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {stock.change >= 0 ? '+' : ''}{(stock.change || 0).toFixed(2)}%
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between mt-0.5">
                                                    <span className="text-xs text-text-muted truncate max-w-[90px]">{stock.name?.split(' ')[0]}</span>
                                                    <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${stock.signal?.includes('Strong Buy') ? 'bg-success/20 text-success' :
                                                        stock.signal?.includes('Buy') ? 'bg-success/10 text-success' :
                                                            stock.signal?.includes('Sell') ? 'bg-danger/10 text-danger' :
                                                                'bg-white/10 text-text-muted'
                                                        }`}>{stock.signal}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )
                        }
                    </GlassCard >

                    {/* Live News Feed */}
                    < GlassCard className="lg:col-span-2" >
                        <h3 className="font-medium mb-4 flex items-center gap-2">
                            <Newspaper size={16} className="text-primary" />
                            Market News Feed
                            <span className="ml-auto text-xs px-2 py-0.5 rounded bg-success/10 text-success border border-success/20 font-mono">● LIVE</span>
                        </h3>
                        {
                            newsLoading ? (
                                <div className="text-center py-8 text-text-muted text-sm font-mono animate-pulse">LOADING NEWS...</div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {news.map((article, i) => (
                                        <a
                                            key={i}
                                            href={article.link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex gap-3 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 hover:border-primary/20 transition-all group cursor-pointer"
                                        >
                                            <div className="w-12 h-12 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                                                <NewsSourceIcon url={article.link} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-medium line-clamp-2 leading-tight mb-1 text-white/90 group-hover:text-primary transition-colors">{article.title}</h4>
                                                <p className="text-xs text-text-muted flex items-center gap-2">
                                                    <span className="truncate max-w-[100px]">{article.source?.replace(' - Latest News', '').replace(' RSS Feed', '')}</span>
                                                    <span>•</span>
                                                    <span>{new Date(article.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    <ExternalLink size={10} className="ml-auto opacity-0 group-hover:opacity-100" />
                                                </p>
                                            </div>
                                        </a>
                                    ))}
                                    {news.length === 0 && (
                                        <p className="col-span-2 text-center text-text-muted text-sm py-6">No news available right now.</p>
                                    )}
                                </div>
                            )
                        }
                    </GlassCard >

                </div >

            </div >
        </DashboardLayout >
    )
}
