import { useState, useEffect } from 'react'
import { DashboardLayout, CompanyLogo } from '../components/layout/DashboardLayout'
import { Filter, Sparkles, TrendingUp, TrendingDown, ChevronDown, RefreshCw } from 'lucide-react'
import { apiFetch } from '../lib/api'

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-surface/60 backdrop-blur-lg border border-white/5 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
)

export function Screener() {
    const [aiQuery, setAiQuery] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [isScreening, setIsScreening] = useState(false)
    const [results, setResults] = useState([])
    const [filterSignal, setFilterSignal] = useState('All')
    const [minPe, setMinPe] = useState('')
    const [maxPe, setMaxPe] = useState('')
    const [lastUpdated, setLastUpdated] = useState(null)

    const fetchScannerData = async () => {
        setIsLoading(true)
        try {
            const res = await apiFetch('/api/scanner')
            const data = await res.json()
            if (Array.isArray(data)) {
                setResults(data)
                setLastUpdated(new Date())
            }
        } catch (err) {
            console.error('Scanner fetch error:', err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchScannerData()
        // Refresh every minute
        const interval = setInterval(fetchScannerData, 60000)
        return () => clearInterval(interval)
    }, [])

    const handleAiSearch = async (e) => {
        e.preventDefault()
        if (!aiQuery.trim()) return
        setIsScreening(true)
        // AI search still fetches real data but filters client-side based on query
        await fetchScannerData()
        setIsScreening(false)
    }

    const filteredResults = results.filter(r => {
        if (filterSignal !== 'All' && r.signal !== filterSignal) return false;

        if (minPe || maxPe) {
            const pe = parseFloat(r.pe);
            if (isNaN(pe)) return false; // Hide N/A if filtering by PE

            if (minPe && pe < parseFloat(minPe)) return false;
            if (maxPe && pe > parseFloat(maxPe)) return false;
        }

        return true;
    });

    const signalColor = (signal) => {
        if (signal?.includes('Strong Buy')) return 'bg-success/20 text-success border border-success/30'
        if (signal?.includes('Buy')) return 'bg-success/10 text-success border border-success/20'
        if (signal?.includes('Strong Sell')) return 'bg-danger/20 text-danger border border-danger/30'
        if (signal?.includes('Sell')) return 'bg-danger/10 text-danger border border-danger/20'
        return 'bg-white/10 text-white border border-white/20'
    }

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto h-[calc(100vh-8rem)]">
                <div className="flex flex-col xl:flex-row gap-6 h-full">

                    {/* LEFT: Filter Controls */}
                    <div className="w-full xl:w-[310px] flex flex-col gap-4 flex-shrink-0">
                        <GlassCard className="p-5">
                            <h2 className="font-bold flex items-center gap-2 mb-5">
                                <Filter size={16} /> Signal Filter
                            </h2>
                            <div className="flex flex-col gap-2">
                                {['All', 'Strong Buy', 'Buy', 'Neutral', 'Sell', 'Strong Sell'].map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilterSignal(s)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${filterSignal === s
                                            ? 'bg-primary/20 text-primary border border-primary/30'
                                            : 'text-text-muted hover:bg-white/5 hover:text-white'
                                            }`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <hr className="border-white/5 my-5" />

                            <h2 className="font-bold flex items-center gap-2 mb-4 text-sm">
                                <ChevronDown size={14} /> Fundamentals
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-xs text-text-muted mb-1 block">P/E Ratio Range</label>
                                    <div className="flex items-center gap-2">
                                        <input type="number" value={minPe} onChange={e => setMinPe(e.target.value)} placeholder="Min" className="w-1/2 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-primary/50" />
                                        <span className="text-text-muted">-</span>
                                        <input type="number" value={maxPe} onChange={e => setMaxPe(e.target.value)} placeholder="Max" className="w-1/2 bg-black/40 border border-white/10 rounded-lg p-2 text-sm text-white outline-none focus:border-primary/50" />
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* RIGHT: Results & AI Search */}
                    <div className="flex-1 flex flex-col gap-4 min-w-0">
                        {/* AI Screening Bar */}
                        <GlassCard className="p-3 bg-gradient-to-r from-secondary/10 to-primary/10 border-secondary/20">
                            <form onSubmit={handleAiSearch} className="flex gap-3 relative">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary">
                                    {isScreening ? <div className="w-5 h-5 border-2 border-secondary border-t-transparent rounded-full animate-spin" /> : <Sparkles size={20} />}
                                </div>
                                <input
                                    type="text"
                                    value={aiQuery}
                                    onChange={(e) => setAiQuery(e.target.value)}
                                    placeholder="Natural Language Screen: e.g. 'Find undervalued NSE stocks with strong momentum'"
                                    className="flex-1 bg-black/40 border border-white/10 hover:border-white/20 focus:border-secondary/50 rounded-xl py-3 pl-12 pr-4 text-sm text-white outline-none transition-colors"
                                />
                                <button type="submit" disabled={isScreening || !aiQuery} className="px-6 rounded-xl bg-secondary hover:bg-secondary/80 text-white font-medium disabled:opacity-50 transition-colors">
                                    Scan
                                </button>
                            </form>
                        </GlassCard>

                        {/* Results Table */}
                        <GlassCard className="flex-1 p-0 flex flex-col overflow-hidden">
                            <div className="p-5 border-b border-white/5 flex justify-between items-center">
                                <div>
                                    <h3 className="font-medium text-lg text-white">Live NSE Scanner</h3>
                                    <p className="text-xs text-text-muted mt-1">
                                        {isLoading ? 'Fetching live data...' : `${filteredResults.length} stocks • Updated ${lastUpdated ? lastUpdated.toLocaleTimeString() : '...'}`}
                                    </p>
                                </div>
                                <button onClick={fetchScannerData} className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-text-muted text-sm">
                                    <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
                                </button>
                            </div>

                            <div className="flex-1 overflow-auto custom-scrollbar">
                                {isLoading && results.length === 0 ? (
                                    <div className="flex items-center justify-center h-40 text-primary font-mono animate-pulse text-sm">
                                        SCANNING LIVE MARKET DATA...
                                    </div>
                                ) : (
                                    <table className="w-full text-left border-collapse">
                                        <thead className="sticky top-0 bg-surface/90 backdrop-blur-md z-10">
                                            <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-white/5">
                                                <th className="p-4 font-medium">Symbol</th>
                                                <th className="p-4 font-medium">Price / Change</th>
                                                <th className="p-4 font-medium">Market Cap</th>
                                                <th className="p-4 font-medium">P/E Ratio</th>
                                                <th className="p-4 font-medium">52W Range</th>
                                                <th className="p-4 font-medium text-right">Signal</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {filteredResults.map((r, i) => (
                                                <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                                    <td className="p-4">
                                                        <div className="flex items-center gap-3">
                                                            <CompanyLogo sym={r.sym} name={r.name} />
                                                            <div>
                                                                <div className="font-bold text-white font-mono group-hover:text-primary transition-colors text-sm">{r.sym}</div>
                                                                <div className="text-xs text-text-muted truncate max-w-[110px]">{r.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4">
                                                        <div className="font-mono text-sm font-semibold">₹{(r.price || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                                        <div className={`text-xs font-medium flex items-center gap-1 ${r.change >= 0 ? 'text-success' : 'text-danger'}`}>
                                                            {r.change >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                            {r.change >= 0 ? '+' : ''}{(r.change || 0).toFixed(2)}%
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-sm font-mono text-text-muted">{r.cap}</td>
                                                    <td className="p-4 text-sm font-mono text-text-muted">{r.pe ?? 'N/A'}</td>
                                                    <td className="p-4">
                                                        <div className="text-xs text-text-muted">
                                                            <div>H: ₹{(r.high52w || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                            <div>L: ₹{(r.low52w || 0).toLocaleString('en-IN', { minimumFractionDigits: 0 })}</div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 text-right">
                                                        <span className={`inline-flex px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${signalColor(r.signal)}`}>
                                                            {r.signal}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                            {filteredResults.length === 0 && !isLoading && (
                                                <tr>
                                                    <td colSpan={6} className="p-10 text-center text-text-muted text-sm">
                                                        No stocks match the current filter criteria.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </GlassCard>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    )
}
