import { useState, useEffect } from 'react'

const SECTORS = [
    {
        name: 'IT', color: '#00ffcc', bgColor: 'from-[#00ffcc]/20 to-[#00ffcc]/5', borderColor: 'border-[#00ffcc]/30',
        stocks: [
            { sym: 'TCS', change: 0 }, { sym: 'INFY', change: 0 },
            { sym: 'HCLTECH', change: 0 }, { sym: 'WIPRO', change: 0 }, { sym: 'TECHM', change: 0 }
        ],
        span: 'col-span-2 row-span-2'
    },
    {
        name: 'Banks', color: '#7b61ff', bgColor: 'from-[#7b61ff]/20 to-[#7b61ff]/5', borderColor: 'border-[#7b61ff]/30',
        stocks: [
            { sym: 'HDFCBANK', change: 0 }, { sym: 'ICICIBANK', change: 0 },
            { sym: 'SBIN', change: 0 }, { sym: 'KOTAKBANK', change: 0 }, { sym: 'AXISBANK', change: 0 }
        ],
        span: 'col-span-2 row-span-2'
    },
    {
        name: 'Energy', color: '#22d3ee', bgColor: 'from-[#22d3ee]/20 to-[#22d3ee]/5', borderColor: 'border-[#22d3ee]/30',
        stocks: [
            { sym: 'RELIANCE', change: 0 }, { sym: 'ONGC', change: 0 }, { sym: 'NTPC', change: 0 }
        ],
        span: 'col-span-1 row-span-1'
    },
    {
        name: 'Auto', color: '#fb923c', bgColor: 'from-[#fb923c]/20 to-[#fb923c]/5', borderColor: 'border-[#fb923c]/30',
        stocks: [
            { sym: 'TATAMOTORS', change: 0 }, { sym: 'MARUTI', change: 0 }, { sym: 'EICHERMOT', change: 0 }
        ],
        span: 'col-span-1 row-span-1'
    },
    {
        name: 'FMCG', color: '#facc15', bgColor: 'from-[#facc15]/20 to-[#facc15]/5', borderColor: 'border-[#facc15]/30',
        stocks: [
            { sym: 'ITC', change: 0 }, { sym: 'HINDUNILVR', change: 0 }, { sym: 'NESTLEIND', change: 0 }
        ],
        span: 'col-span-1 row-span-1'
    },
    {
        name: 'Pharma', color: '#f472b6', bgColor: 'from-[#f472b6]/20 to-[#f472b6]/5', borderColor: 'border-[#f472b6]/30',
        stocks: [
            { sym: 'SUNPHARMA', change: 0 }, { sym: 'DRREDDY', change: 0 }, { sym: 'CIPLA', change: 0 }
        ],
        span: 'col-span-1 row-span-1'
    },
]

function getChangeColor(change) {
    if (change > 2) return '#00ffcc'
    if (change > 0) return '#4ade80'
    if (change < -2) return '#ef4444'
    if (change < 0) return '#f87171'
    return '#94a3b8'
}

function getBgStyle(change) {
    if (change > 2) return 'bg-[#00ffcc]/20 border-[#00ffcc]/40'
    if (change > 0) return 'bg-[#22c55e]/15 border-[#22c55e]/30'
    if (change < -2) return 'bg-[#ef4444]/20 border-[#ef4444]/40'
    if (change < 0) return 'bg-[#ef4444]/10 border-[#ef4444]/20'
    return 'bg-white/5 border-white/10'
}

export function MarketGalaxy({ activeTab = 'Tech' }) {
    const [sectors, setSectors] = useState(SECTORS)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const allSyms = SECTORS.flatMap(s => s.stocks.map(st => st.sym)).join(',')
                const res = await fetch(`/api/scanner`)
                const data = await res.json()

                if (Array.isArray(data)) {
                    const changeMap = {}
                    data.forEach(d => { changeMap[d.sym] = d.change })

                    setSectors(prev =>
                        prev.map(sector => ({
                            ...sector,
                            stocks: sector.stocks.map(st => ({
                                ...st,
                                change: changeMap[st.sym] ?? 0
                            })),
                            avgChange: sector.stocks.length > 0
                                ? sector.stocks.reduce((acc, st) => acc + (changeMap[st.sym] || 0), 0) / sector.stocks.length
                                : 0
                        }))
                    )
                }
            } catch (e) {
                console.error('Heatmap fetch error:', e)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
        const interval = setInterval(fetchData, 60000)
        return () => clearInterval(interval)
    }, [])

    // Filter sectors based on active tab
    const filtered = activeTab === 'Tech'
        ? sectors.filter(s => ['IT', 'Pharma'].includes(s.name))
        : activeTab === 'Finance'
            ? sectors.filter(s => ['Banks', 'FMCG', 'Energy'].includes(s.name))
            : sectors

    const displaySectors = filtered.length > 0 ? filtered : sectors

    return (
        <div className="w-full h-full relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                    <span className="text-primary font-mono animate-pulse text-sm">LOADING MARKET DATA...</span>
                </div>
            )}

            <div className="grid grid-cols-4 grid-rows-2 gap-2 h-full w-full">
                {displaySectors.map((sector, si) => {
                    const avgChange = sector.avgChange || (sector.stocks.reduce((a, s) => a + s.change, 0) / sector.stocks.length)
                    const isLarge = si < 2

                    return (
                        <div
                            key={sector.name}
                            className={`relative rounded-xl border bg-gradient-to-br ${sector.bgColor} ${sector.borderColor} overflow-hidden group cursor-pointer transition-all duration-300 hover:scale-[1.01] hover:shadow-lg ${isLarge ? 'col-span-2 row-span-2' : 'col-span-1 row-span-1'}`}
                        >
                            {/* Pulse glow border on hover */}
                            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity"
                                style={{ boxShadow: `0 0 20px ${sector.color}33` }} />

                            {/* Header */}
                            <div className="p-4 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ backgroundColor: sector.color }} />
                                    <span className="font-bold text-white text-base tracking-wide">{sector.name}</span>
                                </div>
                                <span
                                    className="text-sm font-bold font-mono px-2.5 py-1 rounded"
                                    style={{ color: getChangeColor(avgChange), backgroundColor: `${getChangeColor(avgChange)}20` }}
                                >
                                    {avgChange >= 0 ? '+' : ''}{avgChange.toFixed(2)}%
                                </span>
                            </div>

                            {/* Stock tiles */}
                            <div className={`px-4 pb-4 grid gap-2 ${isLarge ? 'grid-cols-2' : 'grid-cols-1'}`}>
                                {sector.stocks.slice(0, isLarge ? 4 : 3).map((stock) => (
                                    <div
                                        key={stock.sym}
                                        className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-mono transition-all ${getBgStyle(stock.change)}`}
                                    >
                                        <span className="text-white font-bold">{stock.sym}</span>
                                        <span
                                            className="font-bold"
                                            style={{ color: getChangeColor(stock.change) }}
                                        >
                                            {stock.change >= 0 ? '+' : ''}{stock.change.toFixed(2)}%
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Bottom bar: sector strength indicator */}
                            {isLarge && (
                                <div className="absolute bottom-0 left-0 right-0 h-0.5">
                                    <div
                                        className="h-full transition-all duration-1000"
                                        style={{
                                            background: `linear-gradient(to right, transparent, ${getChangeColor(avgChange)}, transparent)`,
                                            opacity: 0.7
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
