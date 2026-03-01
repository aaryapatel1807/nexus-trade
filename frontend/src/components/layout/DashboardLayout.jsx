import { useState, useEffect, useRef, useCallback } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { LineChart, PieChart, Activity, Globe, Bell, Settings, Command, Search, User, LogOut, X, TrendingUp, TrendingDown, Building2, Users, Globe2, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

// ─── Universal Stock Logo Component (Clearbit + Google Favicon fallback) ───
const DOMAIN_MAP = {
    RELIANCE: 'ril.com', TCS: 'tcs.com', HDFCBANK: 'hdfcbank.com',
    INFY: 'infosys.com', SBIN: 'sbi.co.in', ICICIBANK: 'icicibank.com',
    HINDUNILVR: 'hul.co.in', BHARTIARTL: 'airtel.in', ITC: 'itcportal.com',
    KOTAKBANK: 'kotak.com', LT: 'larsentoubro.com', AXISBANK: 'axisbank.com',
    ASIANPAINT: 'asianpaints.com', MARUTI: 'marutisuzuki.com', SUNPHARMA: 'sunpharma.com',
    WIPRO: 'wipro.com', TATAMOTORS: 'tatamotors.com', TATASTEEL: 'tatasteel.com',
    NTPC: 'ntpc.co.in', POWERGRID: 'powergridindia.com', BAJFINANCE: 'bajajfinserv.in',
    NESTLEIND: 'nestle.in', ULTRACEMCO: 'ultratechcement.com', ADANIENT: 'adani.com',
    ONGC: 'ongcindia.com', COALINDIA: 'coalindia.in', HCLTECH: 'hcltech.com',
    TECHM: 'techmahindra.com', DRREDDY: 'drreddys.com', DIVISLAB: 'divislaboratories.com',
    // Extended additions for top movers
    TITAN: 'titancompany.in', MPEHL: 'mphasis.com', HDFCLIFE: 'hdfclife.com',
    TRENT: 'trentlimited.com', GRASIM: 'grasim.com', BAJAJFINSV: 'bajajfinserv.in',
    EICHERMOT: 'eichermotors.com', HEROMOTOCO: 'heromotocorp.com', JSWSTEEL: 'jsw.in',
    CIPLA: 'cipla.com', MABM: 'mabm.com', TATACONSUM: 'tataconsumer.com',
    APOLLOHOSP: 'apollohospitals.com', BRITANNIA: 'britannia.co.in', M_M: 'mahindra.com'
}

export const CompanyLogo = ({ sym, name, website, size = 36 }) => {
    const [imgErr, setImgErr] = useState(false)

    // Reset error state if the symbol changes (fixes sticky broken logos)
    useEffect(() => {
        setImgErr(false)
    }, [sym])

    const cleanSym = sym?.replace('.NS', '') || ''
    const initials = cleanSym.slice(0, 2) || '??'

    // Priority: website domain → known domain map → initials fallback
    let domain = null
    if (website) { try { domain = new URL(website).hostname } catch { } }
    if (!domain) domain = DOMAIN_MAP[cleanSym] || null

    if (!domain || imgErr) {
        return (
            <div
                className="rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 border border-white/10 flex items-center justify-center flex-shrink-0 font-bold text-xs text-white"
                style={{ width: size, height: size }}
            >
                {initials}
            </div>
        )
    }
    return (
        <img
            src={`https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=http://${domain}&size=128`}
            alt={name || sym}
            className="rounded-xl object-contain bg-white flex-shrink-0"
            style={{ width: size, height: size, padding: 4 }}
            onError={() => setImgErr(true)}
        />
    )
}

// ─── Stock Detail Modal ───────────────────────────────────────────────────────
function StockDetailModal({ stock, onClose }) {
    const [details, setDetails] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchDetails = async () => {
            setLoading(true)
            try {
                const res = await fetch(`/api/stock/${stock.rawSym || stock.sym}`)
                const data = await res.json()
                setDetails(data)
            } catch { }
            finally { setLoading(false) }
        }
        fetchDetails()
    }, [stock.sym])

    const fmt = (n) => n ? `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'
    const fmtN = (n, suffix = '') => n ? `${Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 })}${suffix}` : '—'
    const fmtCap = (n) => {
        if (!n) return '—'
        if (n >= 1e12) return `₹${(n / 1e12).toFixed(2)}T`
        if (n >= 1e7) return `₹${(n / 1e7).toFixed(0)} Cr`
        return `₹${n.toLocaleString()}`
    }
    const d = details

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-2xl bg-[#0D0F1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center gap-4 p-6 border-b border-white/5 sticky top-0 bg-[#0D0F1E] z-10">
                    <CompanyLogo sym={d?.sym || stock.sym} name={d?.name || stock.name} website={d?.website} size={52} />
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-white">{d?.name || stock.name}</h2>
                            <span className="text-xs px-2 py-0.5 rounded bg-primary/20 text-primary border border-primary/30 font-mono">{d?.sym || stock.sym}</span>
                        </div>
                        <div className="text-xs text-text-muted mt-0.5">{d?.sector} {d?.sector && d?.industry ? '•' : ''} {d?.industry}</div>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-text-muted hover:text-white transition-colors">
                        <X size={20} />
                    </button>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-primary font-mono animate-pulse">LOADING STOCK DATA...</div>
                ) : (
                    <div className="p-6 space-y-6">
                        {/* Price */}
                        <div className="flex items-end gap-4">
                            <span className="text-4xl font-bold font-mono text-white">{fmt(d?.price)}</span>
                            <span className={`text-lg font-semibold mb-1 flex items-center gap-1 ${d?.changePct >= 0 ? 'text-success' : 'text-danger'}`}>
                                {d?.changePct >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                                {d?.changePct >= 0 ? '+' : ''}{fmtN(d?.changePct, '%')} ({fmt(d?.change)})
                            </span>
                        </div>

                        {/* Key Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { label: 'Open', value: fmt(d?.open) },
                                { label: 'Day High', value: fmt(d?.high) },
                                { label: 'Day Low', value: fmt(d?.low) },
                                { label: 'Volume', value: fmtN(d?.volume) },
                                { label: 'Avg Volume', value: fmtN(d?.avgVolume) },
                                { label: 'Market Cap', value: fmtCap(d?.marketCap) },
                                { label: '52W High', value: fmt(d?.high52w) },
                                { label: '52W Low', value: fmt(d?.low52w) },
                                { label: 'P/E Ratio', value: fmtN(d?.pe) },
                                { label: 'EPS', value: fmtN(d?.eps) },
                                { label: 'Div Yield', value: d?.dividendYield ? `${(d.dividendYield * 100).toFixed(2)}%` : '—' },
                                { label: 'Beta', value: fmtN(d?.beta) },
                            ].map(m => (
                                <div key={m.label} className="bg-white/[0.03] border border-white/5 rounded-xl p-3">
                                    <div className="text-xs text-text-muted mb-1">{m.label}</div>
                                    <div className="font-mono text-sm font-semibold text-white">{m.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Company Info */}
                        {(d?.employees || d?.website) && (
                            <div className="flex flex-wrap gap-4 text-sm">
                                {d?.employees && (
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <Users size={14} /> {Number(d.employees).toLocaleString()} Employees
                                    </div>
                                )}
                                {d?.exchange && (
                                    <div className="flex items-center gap-2 text-text-muted">
                                        <Building2 size={14} /> {d.exchange}
                                    </div>
                                )}
                                {d?.website && (
                                    <a href={d.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                                        <Globe2 size={14} /> {new URL(d.website).hostname}
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        )}

                        {/* Business Description */}
                        {d?.description && (
                            <div>
                                <h3 className="text-sm font-medium text-text-muted mb-2">About</h3>
                                <p className="text-sm text-white/70 leading-relaxed line-clamp-4">{d.description}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Sidebar Nav Item ─────────────────────────────────────────────────────────
const NavItem = ({ icon: Icon, label, path, active }) => (
    <Link
        to={path}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${active
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-text-muted hover:text-white hover:bg-white/5'
            }`}
    >
        <Icon size={20} className={active ? 'text-primary' : ''} />
        <span className="hidden lg:block">{label}</span>
    </Link>
)

// ─── Main Layout ─────────────────────────────────────────────────────────────
export function DashboardLayout({ children }) {
    const [searchQuery, setSearchQuery] = useState('')
    const [searchResults, setSearchResults] = useState([])
    const [isSearching, setIsSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const [selectedStock, setSelectedStock] = useState(null)
    const { avatarSeed } = useAuth()
    const location = useLocation()
    const searchRef = useRef(null)
    const debounceRef = useRef(null)

    // Live search with debounce
    const doSearch = useCallback(async (q) => {
        if (!q.trim()) { setSearchResults([]); setShowDropdown(false); return }
        setIsSearching(true)
        try {
            const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
            const data = await res.json()
            setSearchResults(data)
            setShowDropdown(true)
        } catch { setSearchResults([]) }
        finally { setIsSearching(false) }
    }, [])

    const handleSearchInput = (e) => {
        const val = e.target.value
        setSearchQuery(val)
        clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => doSearch(val), 300)
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setShowDropdown(false) }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleSelectStock = (stock) => {
        setSelectedStock(stock)
        setShowDropdown(false)
        setSearchQuery(stock.name)
    }

    // Live header indices
    const [hdr, setHdr] = useState({ nifty: null, sensex: null, vix: null })
    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await window.fetch(`/api/stocks?symbols=${encodeURIComponent('^NSEI,^BSESN,^VIX')}`)
                const data = await res.json()
                if (Array.isArray(data)) {
                    const n = data.find(d => d.sym === '^NSEI')
                    const s = data.find(d => d.sym === '^BSESN')
                    const v = data.find(d => d.sym === '^VIX')
                    setHdr({
                        nifty: n ? { pct: (n.change || 0).toFixed(2), up: n.change >= 0 } : null,
                        sensex: s ? { pct: (s.change || 0).toFixed(2), up: s.change >= 0 } : null,
                        vix: v ? { pct: (v.change || 0).toFixed(2), up: v.change >= 0 } : null,
                    })
                }
            } catch { }
        }
        fetch()
        const t = setInterval(fetch, 60000)
        return () => clearInterval(t)
    }, [])

    return (
        <div className="flex bg-background h-screen overflow-hidden text-white">

            {/* SIDEBAR */}
            <aside className="w-20 lg:w-64 flex-shrink-0 flex flex-col border-r border-white/5 bg-surface/50 backdrop-blur-xl z-20">
                <div className="h-20 flex items-center justify-center lg:justify-start lg:px-6 border-b border-white/5">
                    <Link to="/dashboard" className="flex items-center gap-3 group px-4 py-2 hover:bg-white/5 rounded-xl transition-all border border-transparent hover:border-primary/20">
                        <div className="w-8 h-8 rounded bg-gradient-to-tr from-primary to-secondary flex items-center justify-center shadow-[0_0_15px_rgba(0,255,204,0.4)] group-hover:shadow-[0_0_25px_rgba(0,255,204,0.6)] transition-shadow">
                            <div className="w-4 h-4 bg-background rounded-sm"></div>
                        </div>
                        <span className="font-display font-bold text-lg tracking-wider hidden lg:block text-white group-hover:text-primary transition-colors">
                            NEXUS
                        </span>
                    </Link>
                </div>

                <nav className="flex-1 py-6 px-3 flex flex-col gap-2">
                    <NavItem icon={LineChart} label="Dashboard" path="/dashboard" active={location.pathname === '/dashboard'} />
                    <NavItem icon={Globe} label="Markets" path="/markets" active={location.pathname === '/markets'} />
                    <NavItem icon={PieChart} label="Portfolio" path="/portfolio" active={location.pathname === '/portfolio'} />
                    <NavItem icon={Activity} label="AI Advisor" path="/ai" active={location.pathname === '/ai'} />
                    <NavItem icon={Bell} label="Alerts" path="/alerts" active={location.pathname === '/alerts'} />
                </nav>

                <div className="p-4 border-t border-white/5">
                    <NavItem icon={Settings} label="Settings" path="/settings" active={location.pathname === '/settings'} />
                    <NavItem icon={LogOut} label="Log Out" path="/login" active={false} />
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col min-w-0">

                {/* TOP HEADER */}
                <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 bg-surface/30 backdrop-blur-md z-10">

                    {/* Live Search Bar */}
                    <div className="relative w-full max-w-md hidden md:block" ref={searchRef}>
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isSearching
                                ? <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                : <Search size={18} className="text-text-muted" />}
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearchInput}
                            onFocus={() => searchResults.length > 0 && setShowDropdown(true)}
                            placeholder="Search any NSE stock by name or symbol..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all text-white placeholder-text-muted"
                        />
                        {searchQuery && (
                            <button
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-text-muted hover:text-white"
                                onClick={() => { setSearchQuery(''); setShowDropdown(false); setSearchResults([]) }}
                            >
                                <X size={14} />
                            </button>
                        )}

                        {/* Search Dropdown */}
                        {showDropdown && searchResults.length > 0 && (
                            <div className="absolute top-full mt-2 w-full bg-[#0D0F1E] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-50">
                                {searchResults.map((stock, i) => (
                                    <button
                                        key={i}
                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors text-left border-b border-white/5 last:border-0"
                                        onClick={() => handleSelectStock(stock)}
                                    >
                                        <CompanyLogo sym={stock.sym} name={stock.name} size={32} />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-bold text-white">{stock.sym}</div>
                                            <div className="text-xs text-text-muted truncate">{stock.name}</div>
                                        </div>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-white/5 text-text-muted border border-white/10 flex-shrink-0">{stock.exchange}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                        {showDropdown && searchQuery.length > 1 && searchResults.length === 0 && !isSearching && (
                            <div className="absolute top-full mt-2 w-full bg-[#0D0F1E] border border-white/10 rounded-xl shadow-2xl p-4 text-center text-sm text-text-muted z-50">
                                No NSE stocks found for "<span className="text-white">{searchQuery}</span>"
                            </div>
                        )}
                    </div>

                    {/* Quick Metrics & Profile */}
                    <div className="flex items-center gap-6 ml-auto">
                        <div className="hidden sm:flex items-center gap-4 text-xs font-mono">
                            <div className="flex items-center gap-2">
                                <span className="text-text-muted">NIFTY</span>
                                <span className={hdr.nifty ? (hdr.nifty.up ? 'text-success' : 'text-danger') : 'text-text-muted'}>
                                    {hdr.nifty ? `${hdr.nifty.up ? '+' : ''}${hdr.nifty.pct}%` : '...'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-text-muted">SENSEX</span>
                                <span className={hdr.sensex ? (hdr.sensex.up ? 'text-success' : 'text-danger') : 'text-text-muted'}>
                                    {hdr.sensex ? `${hdr.sensex.up ? '+' : ''}${hdr.sensex.pct}%` : '...'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-text-muted">INDIA VIX</span>
                                <span className={hdr.vix ? (hdr.vix.up ? 'text-danger' : 'text-success') : 'text-text-muted'}>
                                    {hdr.vix ? `${hdr.vix.up ? '+' : ''}${hdr.vix.pct}%` : '...'}
                                </span>
                            </div>
                        </div>

                        <div className="w-px h-8 bg-white/10 hidden sm:block"></div>

                        <Link to="/settings" className="relative w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-secondary p-[2px] hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] transition-all group">
                            <div className="w-full h-full bg-background rounded-full overflow-hidden border-2 border-background">
                                <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${avatarSeed || 'Felix'}&backgroundColor=0D0F1E`} alt="Profile" className="w-full h-full object-cover group-hover:scale-110 transition-transform opacity-90" />
                            </div>
                            <div className="absolute top-0 right-0 w-3 h-3 bg-primary rounded-full border-2 border-background animate-pulse shadow-[0_0_10px_rgba(0,255,204,0.5)]"></div>
                        </Link>
                    </div>
                </header>

                {/* SCROLLABLE PAGE CONTENT */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden p-6 lg:p-8 relative">
                    <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
                    {children}
                </main>
            </div>

            {/* Stock Detail Modal */}
            {selectedStock && (
                <StockDetailModal
                    stock={selectedStock}
                    onClose={() => setSelectedStock(null)}
                />
            )}
        </div>
    )
}
