import { useState, useEffect, useMemo } from 'react'
import { DashboardLayout, CompanyLogo } from '../components/layout/DashboardLayout'
import { TrendingUp, TrendingDown, PieChart, Activity, ShieldAlert, ArrowRight, Wallet, X, Clock } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-surface/60 backdrop-blur-lg border border-white/5 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
)

// Trade History Modal
function TradeHistoryModal({ onClose }) {
    const [trades, setTrades] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetch = async () => {
            try {
                const res = await axios.get('/api/trade/history')
                setTrades(res.data || [])
            } catch { setTrades([]) }
            finally { setLoading(false) }
        }
        fetch()
    }, [])

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-xl bg-[#0D0F1E] border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-white/5">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Clock size={18} className="text-primary" /> Trade History</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-text-muted"><X size={18} /></button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                    {loading ? (
                        <div className="text-center py-10 text-primary font-mono animate-pulse">LOADING TRADES...</div>
                    ) : trades.length === 0 ? (
                        <div className="text-center py-10 text-text-muted">No trade history yet.</div>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-xs text-text-muted uppercase border-b border-white/5">
                                    <th className="p-3 text-left">Symbol</th>
                                    <th className="p-3 text-left">Type</th>
                                    <th className="p-3 text-right">Qty</th>
                                    <th className="p-3 text-right">Price</th>
                                    <th className="p-3 text-right">Total</th>
                                    <th className="p-3 text-left">Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {trades.map((t, i) => (
                                    <tr key={i} className="hover:bg-white/[0.02]">
                                        <td className="p-3 font-mono font-bold">{t.symbol}</td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${t.type === 'BUY' ? 'bg-success/20 text-success' : 'bg-danger/20 text-danger'}`}>{t.type}</span>
                                        </td>
                                        <td className="p-3 text-right font-mono">{t.quantity}</td>
                                        <td className="p-3 text-right font-mono">₹{parseFloat(t.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-right font-mono">₹{(t.quantity * t.price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                                        <td className="p-3 text-text-muted text-xs">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    )
}

export function Portfolio() {
    const { user } = useAuth();
    const [holdings, setHoldings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showHistory, setShowHistory] = useState(false);

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

                const symbols = dbHoldings.map(h => `${h.symbol}.NS`).join(',');
                const liveRes = await axios.get(`/api/stocks?symbols=${symbols}`);
                const liveData = liveRes.data;

                const merged = dbHoldings.map(h => {
                    const live = liveData.find(d => d.sym === `${h.symbol}.NS`);
                    const currentPrice = live ? live.price : h.averagePrice;
                    const value = h.quantity * currentPrice;
                    const change = h.averagePrice > 0 ? ((currentPrice - h.averagePrice) / h.averagePrice) * 100 : 0;
                    // Today's intraday change from Yahoo (regularMarketChangePercent)
                    const todayChangePct = live ? (live.change || 0) : 0;
                    const prevClose = currentPrice / (1 + todayChangePct / 100);
                    const todayPnL = h.quantity * (currentPrice - prevClose);

                    return {
                        sym: h.symbol,
                        name: live ? live.name : h.symbol,
                        shares: h.quantity,
                        avgPrice: h.averagePrice,
                        currentPrice,
                        value,
                        change,
                        todayChangePct,
                        todayPnL,
                    };
                });

                setHoldings(merged);
            } catch (err) {
                console.error("Failed to fetch portfolio data", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPortfolio();
        const interval = setInterval(fetchPortfolio, 60000); // refresh every 1 minute
        return () => clearInterval(interval);
    }, [user]);

    const [lastUpdated, setLastUpdated] = useState(null);
    useEffect(() => {
        if (holdings.length > 0) setLastUpdated(new Date())
    }, [holdings])

    const totalValue = useMemo(() => holdings.reduce((sum, h) => sum + h.value, 0), [holdings])
    const totalCost = useMemo(() => holdings.reduce((sum, h) => sum + (h.shares * h.avgPrice), 0), [holdings])
    const totalReturn = useMemo(() => totalCost > 0 ? ((totalValue - totalCost) / totalCost) * 100 : 0, [totalValue, totalCost])
    const totalDailyPnL = useMemo(() => holdings.reduce((sum, h) => sum + (h.todayPnL || 0), 0), [holdings])
    const isPositive = totalReturn >= 0
    const isDailyPositive = totalDailyPnL >= 0

    // Real allocation from actual holdings
    const allocation = useMemo(() => {
        if (totalValue === 0 || holdings.length === 0) return []
        return holdings.map((h, i) => ({
            label: h.sym,
            pct: ((h.value / totalValue) * 100).toFixed(1),
            color: ['#00ffcc', '#7000ff', '#ff0055', '#f59e0b', '#3b82f6', '#10b981'][i % 6]
        }))
    }, [holdings, totalValue])

    // Portfolio Volatility & Beta Heuristic based on actual price movements
    const avgBeta = useMemo(() => {
        if (holdings.length === 0) return null

        // Advanced Heuristic: Calculate weighted beta proxy based on extreme daily movements
        // A stock moving > 2% a day frequently behaves like a high beta stock (>1.2)
        // A stock barely moving (< 0.5%) behaves like a low beta stock (<0.8)
        let totalWeightedBeta = 0;
        let totalValueWeight = 0;

        holdings.forEach(h => {
            const dailyMovePct = Math.abs(h.todayChangePct || 0);
            let estimatedStockBeta = 1.0; // market average

            if (dailyMovePct > 2.5) estimatedStockBeta = 1.5;
            else if (dailyMovePct > 1.5) estimatedStockBeta = 1.2;
            else if (dailyMovePct < 0.5) estimatedStockBeta = 0.7;
            else estimatedStockBeta = 0.9 + (dailyMovePct / 3);

            totalWeightedBeta += estimatedStockBeta * h.value;
            totalValueWeight += h.value;
        });

        const portBeta = totalValueWeight > 0 ? (totalWeightedBeta / totalValueWeight) : 1.0;
        return portBeta.toFixed(2);

    }, [holdings])

    const volatility = useMemo(() => {
        if (!avgBeta) return 'N/A'
        const b = parseFloat(avgBeta)
        if (b >= 1.3) return 'High'
        if (b > 0.8) return 'Medium'
        return 'Low'
    }, [avgBeta])

    const gradientStr = allocation.length > 0
        ? allocation.reduce((acc, s, i) => {
            const prev = allocation.slice(0, i).reduce((sum, x) => sum + parseFloat(x.pct), 0)
            return acc + `${s.color} ${prev.toFixed(1)}% ${(prev + parseFloat(s.pct)).toFixed(1)}%, `
        }, 'conic-gradient(').slice(0, -2) + ')'
        : 'conic-gradient(#8f9bb3 0% 100%)'

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">

                {/* PORTFOLIO HERO */}
                <GlassCard className="relative overflow-hidden w-full p-8 md:p-12 border-primary/20 shadow-[0_0_40px_rgba(0,255,204,0.05)]">
                    <div className="absolute top-[-50%] right-[-10%] w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(0,255,204,0.08)_0,transparent_50%)] pointer-events-none"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                        <div>
                            <h2 className="text-text-muted font-medium mb-2 uppercase tracking-wider text-sm flex items-center gap-2"><Wallet size={16} /> Available Cash Balance</h2>
                            <h1 className="text-5xl md:text-7xl font-mono font-bold tracking-tight text-white mb-4">
                                ₹{parseFloat(user?.cashBalance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h1>
                            <div className="text-text-muted font-medium mb-2 uppercase tracking-wider text-sm flex items-center gap-2 mt-8">Invested Holdings Value</div>
                            <h2 className="text-3xl md:text-4xl font-mono font-bold tracking-tight text-white/90 mb-4">
                                ₹{totalValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </h2>

                            {/* Overall return */}
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-lg font-medium ${isPositive ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
                                {isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
                                {isPositive ? '+' : ''}{totalReturn.toFixed(2)}% Total Return
                            </div>

                            {/* TODAY's P&L */}
                            {holdings.length > 0 && (
                                <div className="mt-4 flex flex-wrap items-center gap-3">
                                    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-medium border ${isDailyPositive
                                        ? 'bg-success/5 border-success/20 text-success'
                                        : 'bg-danger/5 border-danger/20 text-danger'
                                        }`}>
                                        {isDailyPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                        <span className="font-mono">
                                            {isDailyPositive ? '+' : ''}₹{Math.abs(totalDailyPnL).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </span>
                                        <span className="text-sm opacity-70">Today's P&L</span>
                                    </div>

                                    {lastUpdated && (
                                        <span className="text-xs text-text-muted flex items-center gap-1">
                                            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse inline-block"></span>
                                            Updated {lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                                            · refreshes every minute
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowHistory(true)}
                                className="px-6 py-3 bg-surface border border-white/10 text-white font-medium rounded-xl hover:bg-white/10 transition-colors"
                            >
                                Trade History
                            </button>
                        </div>
                    </div>
                </GlassCard>

                {/* THREE COLUMN LAYOUT */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* LEFT: Analytics & Risk */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <GlassCard className="flex flex-col items-center text-center">
                            <h3 className="w-full text-left font-medium mb-6 flex items-center gap-2">
                                <PieChart size={18} className="text-primary" /> Allocation
                            </h3>
                            <div className="relative w-40 h-40 rounded-full flex items-center justify-center mb-6" style={{ background: gradientStr }}>
                                <div className="absolute inset-2 rounded-full bg-surface/90 backdrop-blur-md flex items-center justify-center flex-col shadow-inner">
                                    <span className="text-xs text-text-muted">Holdings</span>
                                    <span className="font-bold text-lg">{holdings.length}</span>
                                </div>
                            </div>
                            <div className="w-full space-y-2">
                                {allocation.length > 0 ? allocation.map((a, i) => (
                                    <div key={i} className="flex justify-between text-sm">
                                        <span className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full" style={{ background: a.color }}></div>
                                            {a.label}
                                        </span>
                                        <span>{a.pct}%</span>
                                    </div>
                                )) : (
                                    <p className="text-text-muted text-sm">No holdings yet</p>
                                )}
                            </div>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-medium mb-4 flex items-center gap-2">
                                <ShieldAlert size={18} className="text-warning" /> Risk Analysis
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-muted">Beta Score</span>
                                        <span className="text-white font-mono">{avgBeta ?? '—'}</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-1.5">
                                        <div className="bg-warning h-1.5 rounded-full" style={{ width: avgBeta ? `${Math.min(parseFloat(avgBeta) / 2 * 100, 100)}%` : '0%' }}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-muted">Volatility</span>
                                        <span className="text-white font-mono">{volatility}</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-1.5">
                                        <div className={`h-1.5 rounded-full ${volatility === 'High' ? 'bg-danger w-[85%]' : volatility === 'Medium' ? 'bg-warning w-[55%]' : 'bg-success w-[25%]'}`}></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-text-muted">Diversification</span>
                                        <span className="text-white font-mono">{holdings.length > 5 ? 'Good' : holdings.length > 2 ? 'Moderate' : 'Low'}</span>
                                    </div>
                                    <div className="w-full bg-black/40 rounded-full h-1.5">
                                        <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.min(holdings.length * 15, 100)}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    </div>

                    {/* CENTER: Holdings Table */}
                    <GlassCard className="lg:col-span-6 overflow-hidden flex flex-col p-0">
                        <div className="p-6 border-b border-white/5 flex justify-between items-center">
                            <h3 className="font-medium">Current Holdings</h3>
                            <span className="text-xs text-text-muted">{holdings.length} position{holdings.length !== 1 ? 's' : ''}</span>
                        </div>

                        <div className="overflow-x-auto flex-1">
                            {loading ? (
                                <div className="p-10 text-center text-primary font-mono animate-pulse">LOADING PORTFOLIO...</div>
                            ) : holdings.length === 0 ? (
                                <div className="p-10 text-center text-text-muted">
                                    <p className="text-lg font-medium mb-2">No Holdings Yet</p>
                                    <p className="text-sm">Buy stocks from the Dashboard to see your portfolio here.</p>
                                </div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="text-xs text-text-muted uppercase tracking-wider border-b border-white/5 bg-black/20">
                                            <th className="p-4 font-medium">Asset</th>
                                            <th className="p-4 font-medium">Balance</th>
                                            <th className="p-4 font-medium">Price / Overall</th>
                                            <th className="p-4 font-medium">Today's P&L</th>
                                            <th className="p-4 font-medium">Weight</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {holdings.map((h, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors group cursor-pointer">
                                                <td className="p-4">
                                                    <div className="flex items-center gap-3">
                                                        <CompanyLogo sym={h.sym} name={h.name} size={40} />
                                                        <div>
                                                            <div className="font-bold text-white group-hover:text-primary transition-colors">{h.sym}</div>
                                                            <div className="text-xs text-text-muted">{h.name}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm">₹{h.value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                    <div className="text-xs text-text-muted">{h.shares} Shares @ ₹{h.avgPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="font-mono text-sm">₹{h.currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</div>
                                                    <div className={`text-xs font-medium flex items-center gap-1 ${h.change > 0 ? 'text-success' : 'text-danger'}`}>
                                                        {h.change > 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                                        {h.change > 0 ? '+' : ''}{h.change.toFixed(2)}% overall
                                                    </div>
                                                </td>
                                                {/* TODAY's P&L column */}
                                                <td className="p-4">
                                                    <div className={`font-mono text-sm font-semibold ${h.todayPnL >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {h.todayPnL >= 0 ? '+' : ''}₹{Math.abs(h.todayPnL || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                    </div>
                                                    <div className={`text-xs font-medium flex items-center gap-1 ${h.todayChangePct >= 0 ? 'text-success' : 'text-danger'}`}>
                                                        {h.todayChangePct >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
                                                        {h.todayChangePct >= 0 ? '+' : ''}{(h.todayChangePct || 0).toFixed(2)}% today
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span>{((h.value / totalValue) * 100).toFixed(1)}%</span>
                                                        <ArrowRight size={16} className="text-text-muted opacity-0 translate-x-[-10px] group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </GlassCard>

                    {/* RIGHT: AI Portfolio Review */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                        <GlassCard className="relative overflow-hidden h-full">
                            <div className="absolute top-0 right-0 w-[150%] h-[150%] bg-[radial-gradient(circle_at_top_right,rgba(112,0,255,0.1)_0,transparent_60%)] pointer-events-none"></div>

                            <h3 className="font-medium mb-6 flex items-center gap-2 relative z-10">
                                <Activity size={18} className="text-secondary" /> AI Portfolio Review
                            </h3>

                            <div className="space-y-4 relative z-10">
                                {holdings.length === 0 ? (
                                    <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-sm leading-relaxed text-text-muted">
                                        Your portfolio is empty. Start trading from the Dashboard to get AI-powered insights on your holdings.
                                    </div>
                                ) : (
                                    <>
                                        <div className="p-4 rounded-xl bg-black/30 border border-white/5 text-sm leading-relaxed text-text-muted">
                                            {holdings.length === 1
                                                ? `Your portfolio is concentrated in ${holdings[0].sym}. Consider diversifying into other sectors to reduce single-stock risk.`
                                                : `Your top position is ${holdings[0].sym} at ${((holdings[0].value / totalValue) * 100).toFixed(1)}% allocation. Portfolio return: ${isPositive ? '+' : ''}${totalReturn.toFixed(2)}%.`}
                                        </div>

                                        <ul className="space-y-2">
                                            {holdings.filter(h => h.change > 1).slice(0, 1).map((h, i) => (
                                                <li key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-success/5 border border-success/10 text-success">
                                                    <span className="font-bold">•</span>
                                                    <span>{h.sym} is up {h.change.toFixed(2)}% today. Consider reviewing your target price.</span>
                                                </li>
                                            ))}
                                            {holdings.filter(h => h.change < -1).slice(0, 1).map((h, i) => (
                                                <li key={i} className="flex gap-3 text-sm p-3 rounded-xl bg-warning/5 border border-warning/10 text-warning">
                                                    <span className="font-bold">•</span>
                                                    <span>{h.sym} is down {Math.abs(h.change).toFixed(2)}% today. Review your stop-loss levels.</span>
                                                </li>
                                            ))}
                                            {totalReturn > 10 && (
                                                <li className="flex gap-3 text-sm p-3 rounded-xl bg-success/5 border border-success/10 text-success">
                                                    <span className="font-bold">•</span>
                                                    <span>Portfolio is up {totalReturn.toFixed(2)}% overall. Consider booking partial profits.</span>
                                                </li>
                                            )}
                                        </ul>
                                    </>
                                )}
                            </div>
                        </GlassCard>
                    </div>

                </div>
            </div>

            {/* Trade History Modal */}
            {showHistory && <TradeHistoryModal onClose={() => setShowHistory(false)} />}
        </DashboardLayout>
    )
}
