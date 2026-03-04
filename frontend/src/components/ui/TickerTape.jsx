import { useEffect, useRef, useState } from 'react'
import { apiFetch } from '../../lib/api'

export function TickerTape() {
    const scrollRef = useRef(null)
    const [tickers, setTickers] = useState([
        { sym: 'RELIANCE', price: 0, change: 0 },
        { sym: 'TCS', price: 0, change: 0 },
        { sym: 'HDFCBANK', price: 0, change: 0 },
        { sym: 'INFY', price: 0, change: 0 },
        { sym: 'SBIN', price: 0, change: 0 },
        { sym: 'BHARTIARTL', price: 0, change: 0 },
        { sym: 'ITC', price: 0, change: 0 },
    ])

    useEffect(() => {
        const fetchTickers = async () => {
            try {
                const res = await apiFetch('/api/stocks?symbols=RELIANCE.NS,TCS.NS,HDFCBANK.NS,INFY.NS,SBIN.NS,BHARTIARTL.NS,ITC.NS')
                const data = await res.json()
                if (data && data.length > 0) {
                    setTickers(data.map(t => {
                        const sym = t.sym || t.symbol || '';
                        return {
                            sym: sym.replace('.NS', ''),
                            price: t.price || 0,
                            change: t.changePct ?? t.change ?? 0
                        };
                    }))
                }
            } catch (err) {
                console.error("Failed to fetch live tickers", err)
            }
        }

        fetchTickers()
        const interval = setInterval(fetchTickers, 60000)
        return () => clearInterval(interval)
    }, [])

    return (
        <div className="w-full bg-surface border-b border-white/5 overflow-hidden flex h-10 items-center relative z-50">
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-surface to-transparent z-10"></div>

            <div
                ref={scrollRef}
                className="flex whitespace-nowrap animate-ticker w-max"
            >
                {/* Render twice for continuous scrolling loop */}
                {[...tickers, ...tickers].map((t, i) => (
                    <div key={i} className="flex flex-shrink-0 items-center gap-3 px-6 border-r border-white/10 last:border-0 hover:bg-white/5 transition-colors cursor-pointer">
                        <span className="font-bold font-mono text-sm text-white/90">{t.sym}</span>
                        <span className="font-mono text-sm">₹{t.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <span className={`text-xs font-bold ${t.change >= 0 ? 'text-success' : 'text-danger'}`}>
                            {t.change > 0 ? '+' : ''}{t.change.toFixed(2)}%
                        </span>
                    </div>
                ))}
            </div>

            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-surface to-transparent z-10"></div>
        </div>
    )
}
