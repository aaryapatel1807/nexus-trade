import { useState, useEffect } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { Bell, Plus, Settings, AlertTriangle, TrendingUp, TrendingDown, ArrowRight, Activity, Clock, X, Check } from 'lucide-react'

const GlassCard = ({ children, className = "" }) => (
    <div className={`bg-surface/60 backdrop-blur-lg border border-white/5 rounded-2xl p-6 ${className}`}>
        {children}
    </div>
)

const ALERT_TYPES = ['price', 'indicator', 'volume', 'pattern']
const CONDITIONS = {
    price: ['Crosses Above', 'Crosses Below', 'Moves Up By %', 'Moves Down By %'],
    indicator: ['RSI Drops Below', 'RSI Rises Above', 'MACD Bullish Cross', 'MACD Bearish Cross'],
    volume: ['Volume Spike', 'Volume Drops', 'Avg Volume Break'],
    pattern: ['Forms Bull Flag', 'Forms Bear Flag', 'Head & Shoulders', 'Double Top'],
}
const POPULAR_STOCKS = ['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'SBIN', 'ICICIBANK', 'TATAMOTORS', 'WIPRO', 'AXISBANK', 'KOTAKBANK']

// Create Alert Modal
function CreateAlertModal({ onClose, onCreate }) {
    const [form, setForm] = useState({ type: 'price', asset: 'RELIANCE', condition: 'Crosses Above', value: '' })

    const handleSubmit = (e) => {
        e.preventDefault()
        if (!form.value.trim()) return
        onCreate({
            id: Date.now(),
            ...form,
            status: 'active',
            time: 'Created just now'
        })
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
            <div className="relative w-full max-w-md bg-[#0D0F1E] border border-white/10 rounded-2xl shadow-2xl p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Bell size={18} className="text-primary" /> Create Alert</h2>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 text-text-muted"><X size={18} /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Alert Type</label>
                        <div className="grid grid-cols-4 gap-2">
                            {ALERT_TYPES.map(t => (
                                <button type="button" key={t} onClick={() => setForm(f => ({ ...f, type: t, condition: CONDITIONS[t][0] }))}
                                    className={`py-2 rounded-xl text-xs font-medium capitalize transition-colors ${form.type === t ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/5 text-text-muted hover:bg-white/10 border border-white/5'}`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Stock Symbol</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {POPULAR_STOCKS.slice(0, 5).map(s => (
                                <button type="button" key={s} onClick={() => setForm(f => ({ ...f, asset: s }))}
                                    className={`px-2 py-1 rounded text-xs font-mono transition-colors ${form.asset === s ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-white/5 text-text-muted hover:text-white border border-white/5'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={form.asset}
                            onChange={e => setForm(f => ({ ...f, asset: e.target.value.toUpperCase() }))}
                            placeholder="Type any NSE symbol..."
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Condition</label>
                        <select value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value }))}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50">
                            {CONDITIONS[form.type].map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs text-text-muted uppercase tracking-wider mb-2 block">Target Value</label>
                        <input
                            type="text"
                            value={form.value}
                            onChange={e => setForm(f => ({ ...f, value: e.target.value }))}
                            placeholder={form.type === 'price' ? 'e.g. ₹3000' : form.type === 'indicator' ? 'e.g. 30' : 'e.g. 200%'}
                            required
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-primary/50"
                        />
                    </div>

                    <button type="submit"
                        className="w-full py-3 bg-primary text-background font-bold rounded-xl hover:bg-white transition-colors flex items-center justify-center gap-2">
                        <Check size={16} /> Create Alert
                    </button>
                </form>
            </div>
        </div>
    )
}

export function Alerts() {
    const [activeTab, setActiveTab] = useState('active')
    const [alerts, setAlerts] = useState(() => {
        const saved = localStorage.getItem('nexus_alerts')
        if (saved) return JSON.parse(saved)
        return []
    })
    const [showCreate, setShowCreate] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [editValue, setEditValue] = useState('')
    const [aiEnabled, setAiEnabled] = useState(true)

    useEffect(() => {
        localStorage.setItem('nexus_alerts', JSON.stringify(alerts))
    }, [alerts])

    const createAlert = (alert) => {
        const newAlert = { ...alert, id: Date.now() }
        setAlerts(prev => [newAlert, ...prev])
    }
    const deleteAlert = (id) => setAlerts(prev => prev.filter(a => a.id !== id))
    const startEdit = (alert) => { setEditingId(alert.id); setEditValue(alert.value) }
    const saveEdit = (id) => {
        setAlerts(prev => prev.map(a => a.id === id ? { ...a, value: editValue } : a))
        setEditingId(null)
    }

    const active = alerts.filter(a => a.status === 'active')
    const triggered = alerts.filter(a => a.status === 'triggered')

    return (
        <DashboardLayout>
            <div className="flex flex-col gap-6 w-full max-w-[1600px] mx-auto pb-10">

                <div className="flex justify-between items-center mb-2">
                    <h1 className="text-3xl font-display font-bold text-white flex items-center gap-3">
                        <Bell className="text-primary" size={28} /> Advanced Alerts Engine
                    </h1>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-primary text-background font-bold px-6 py-2.5 rounded-xl flex items-center gap-2 hover:bg-white transition-colors shadow-[0_0_20px_rgba(0,255,204,0.2)]"
                    >
                        <Plus size={18} /> Create Alert
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* LEFT COLUMN */}
                    <div className="flex flex-col gap-6">

                        <GlassCard className="p-1 border border-white/10 flex gap-1 relative z-10">
                            <button
                                onClick={() => setActiveTab('active')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'active' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                            >
                                Active Alerts <span className="ml-2 inline-block bg-primary/20 text-primary px-2 rounded-full text-xs">{active.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('triggered')}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${activeTab === 'triggered' ? 'bg-white/10 text-white' : 'text-text-muted hover:text-white hover:bg-white/5'}`}
                            >
                                Triggered <span className="ml-2 inline-block bg-warning/20 text-warning px-2 rounded-full text-xs">{triggered.length}</span>
                            </button>
                        </GlassCard>

                        <GlassCard className="bg-gradient-to-br from-surface to-surface/40 overflow-hidden relative">
                            <div className="absolute top-[-20%] right-[-10%] w-[150px] h-[150px] bg-secondary/20 blur-[60px] rounded-full pointer-events-none"></div>
                            <h3 className="font-medium mb-4 flex items-center gap-2 relative z-10">
                                <Activity size={18} className="text-secondary" /> AI Smart Alerts
                            </h3>
                            <p className="text-sm text-text-muted mb-4 relative z-10 leading-relaxed">
                                Turn on Nexus AI scanning to automatically alert you when unusual patterns, volume anomalies, or sentiment shifts occur in your watchlist.
                            </p>
                            <label className="flex items-center justify-between cursor-pointer p-3 rounded-lg border border-white/5 bg-black/20 hover:bg-black/40 transition-colors relative z-10">
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium text-white">Enable Auto-Scanning</span>
                                    <span className="text-xs text-text-muted">Monitors 24/7 across all markets</span>
                                </div>
                                <div className="relative inline-flex items-center" onClick={() => setAiEnabled(v => !v)}>
                                    <div className={`w-11 h-6 rounded-full transition-colors ${aiEnabled ? 'bg-primary' : 'bg-white/10'} relative`}>
                                        <div className={`absolute top-[2px] w-5 h-5 bg-white rounded-full transition-transform ${aiEnabled ? 'translate-x-5' : 'translate-x-[2px]'}`}></div>
                                    </div>
                                </div>
                            </label>
                        </GlassCard>

                        <GlassCard>
                            <h3 className="font-medium mb-4 flex items-center gap-2">
                                <Settings size={18} className="text-text-muted" /> Notification Preferences
                            </h3>
                            <div className="space-y-3">
                                {[['In-App Notifications', true], ['Push Notifications (Mobile)', true], ['Email Summary', false], ['SMS (Critical only)', false]].map(([label, def]) => (
                                    <label key={label} className="flex items-center gap-3 cursor-pointer text-sm text-text-muted hover:text-white transition-colors">
                                        <input type="checkbox" defaultChecked={def} className="rounded border-white/20 bg-black/40 text-primary focus:ring-primary/50" />
                                        {label}
                                    </label>
                                ))}
                            </div>
                        </GlassCard>
                    </div>

                    {/* MAIN AREA: Alert List */}
                    <div className="lg:col-span-2">
                        <GlassCard className="p-0 h-full flex flex-col">
                            <div className="p-6 border-b border-white/5 flex justify-between items-center bg-black/20">
                                <h2 className="font-medium text-lg">
                                    {activeTab === 'active' ? 'Currently Monitoring' : 'Recent Triggers'}
                                </h2>
                                <span className="text-xs text-text-muted">{activeTab === 'active' ? active.length : triggered.length} alert{(activeTab === 'active' ? active.length : triggered.length) !== 1 ? 's' : ''}</span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                                {alerts.filter(a => a.status === activeTab).length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-text-muted opacity-60 py-20">
                                        <AlertTriangle size={48} className="mb-4 opacity-50" />
                                        <p>No {activeTab} alerts found.</p>
                                        {activeTab === 'active' && (
                                            <button onClick={() => setShowCreate(true)} className="mt-4 text-primary hover:underline text-sm flex items-center gap-1">
                                                <Plus size={14} /> Create your first alert
                                            </button>
                                        )}
                                    </div>
                                ) : (
                                    alerts.filter(a => a.status === activeTab).map((alert) => (
                                        <div key={alert.id} className="relative overflow-hidden group border border-white/5 bg-surface/40 hover:bg-white/5 rounded-xl p-5 transition-all">
                                            <div className={`absolute left-0 top-0 bottom-0 w-1 ${alert.status === 'active' ? 'bg-primary' : 'bg-warning'}`}></div>

                                            <div className="flex justify-between items-start pl-2">
                                                <div className="flex gap-4">
                                                    <div className="w-12 h-12 rounded-lg bg-black/40 border border-white/10 flex flex-col items-center justify-center">
                                                        <span className="font-bold font-mono text-white text-xs">{alert.asset}</span>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="font-medium text-white">{alert.condition}</span>
                                                            {editingId === alert.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <input
                                                                        value={editValue}
                                                                        onChange={e => setEditValue(e.target.value)}
                                                                        className="bg-black/40 border border-primary/50 text-primary px-2 py-0.5 rounded text-xs w-24 focus:outline-none"
                                                                        autoFocus
                                                                    />
                                                                    <button onClick={() => saveEdit(alert.id)} className="text-success hover:text-white"><Check size={14} /></button>
                                                                    <button onClick={() => setEditingId(null)} className="text-text-muted hover:text-white"><X size={14} /></button>
                                                                </div>
                                                            ) : (
                                                                <span className="font-mono text-primary bg-primary/10 px-2 py-0.5 rounded text-xs border border-primary/20">{alert.value}</span>
                                                            )}
                                                        </div>
                                                        <div className="flex items-center gap-4 text-xs text-text-muted font-mono">
                                                            <span className="flex items-center gap-1"><Clock size={12} /> {alert.time}</span>
                                                            <span className="capitalize px-1.5 rounded bg-white/10">{alert.type} Alert</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {alert.status === 'active' && (
                                                        <button onClick={() => startEdit(alert)} className="px-3 py-1.5 text-xs font-medium rounded bg-white/10 hover:bg-white/20 transition-colors">Edit</button>
                                                    )}
                                                    <button onClick={() => deleteAlert(alert.id)} className="px-3 py-1.5 text-xs font-medium rounded bg-danger/10 text-danger hover:bg-danger/20 transition-colors">Delete</button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </GlassCard>
                    </div>

                </div>
            </div>

            {showCreate && <CreateAlertModal onClose={() => setShowCreate(false)} onCreate={createAlert} />}
        </DashboardLayout>
    )
}
