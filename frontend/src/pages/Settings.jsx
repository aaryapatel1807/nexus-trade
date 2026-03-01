import { useState } from 'react'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { User, Shield, Bell, Key, Moon, Globe, Smartphone, LogOut, Check, X, CreditCard, Download, ExternalLink } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const AVATAR_OPTIONS = [
    'Felix', 'Aneka', 'Jasper', 'Max', 'Mitten', 'Oscar', 'Buster', 'Salem', 'Missy', 'Garfield',
    'Luna', 'Leo', 'Simba', 'Loki', 'Pepper', 'Bandit', 'Oreo', 'Smokey', 'Shadow', 'Tiger',
    'Jack', 'Chloe', 'Abby', 'Oliver', 'Bella', 'Lucy', 'Charlie', 'Milo', 'Lily', 'Nala'
];

export function Settings() {
    const { user, logout, avatarSeed, setAvatarSeed } = useAuth()
    const [activeTab, setActiveTab] = useState('profile')
    const [showAvatarModal, setShowAvatarModal] = useState(false)

    const [settings, setSettings] = useState({
        notifications: true,
        emailAlerts: true,
        smsAlerts: false,
        darkMode: true,
        twoFactor: false,
        language: 'English',
        currency: 'INR'
    })

    const toggleSetting = (key) => setSettings(s => ({ ...s, [key]: !s[key] }))

    const TABS = [
        { id: 'profile', icon: User, label: 'Profile' },
        { id: 'security', icon: Shield, label: 'Security' },
        { id: 'notifications', icon: Bell, label: 'Notifications' },
        { id: 'preferences', icon: Moon, label: 'Preferences' },
        { id: 'billing', icon: CreditCard, label: 'Billing & Plans' }
    ]

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8 min-h-[calc(100vh-8rem)]">

                {/* ─── SETTINGS SIDEBAR ─── */}
                <div className="w-full md:w-72 flex-shrink-0">
                    <div className="mb-8">
                        <h1 className="text-4xl font-display font-bold tracking-tight mb-2 text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                            Settings
                        </h1>
                        <p className="text-text-muted text-sm">Manage your account and trading preferences.</p>
                    </div>

                    <nav className="flex flex-row md:flex-col gap-2 overflow-x-auto pb-4 md:pb-0">
                        {TABS.map(tab => {
                            const Icon = tab.icon
                            const active = activeTab === tab.id
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-4 px-5 py-4 rounded-xl transition-all text-left whitespace-nowrap overflow-hidden relative group ${active
                                        ? 'bg-gradient-to-r from-primary/20 to-transparent border border-primary/30 shadow-[inset_4px_0_0_0_rgba(0,255,204,1)]'
                                        : 'hover:bg-white/5 border border-transparent'
                                        }`}
                                >
                                    <Icon size={20} className={active ? 'text-primary' : 'text-text-muted group-hover:text-white transition-colors'} />
                                    <span className={`font-semibold ${active ? 'text-white' : 'text-text-muted group-hover:text-white transition-colors'}`}>
                                        {tab.label}
                                    </span>
                                    {active && (
                                        <div className="absolute right-4 w-12 h-12 bg-primary/20 rounded-full blur-xl pointer-events-none" />
                                    )}
                                </button>
                            )
                        })}
                    </nav>

                    <div className="mt-8 pt-8 border-t border-white/5">
                        <button
                            onClick={logout}
                            className="flex items-center gap-4 px-5 py-4 w-full rounded-xl hover:bg-danger/10 text-danger border border-transparent hover:border-danger/30 transition-all font-semibold"
                        >
                            <LogOut size={20} />
                            Sign Out
                        </button>
                    </div>
                </div>

                {/* ─── SETTINGS CONTENT ─── */}
                <div className="flex-1 space-y-6 lg:pl-8">

                    {/* PROFILE TAB */}
                    {activeTab === 'profile' && (
                        <div className="animate-fade-in space-y-6">

                            {/* Avatar & Header Card */}
                            <div className="bg-[#0D0F1E] border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                                <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />

                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <User size={22} className="text-primary" /> Personal Information
                                </h2>

                                <div className="flex items-center gap-8 mb-10 relative z-10">
                                    <div className="relative group cursor-pointer" onClick={() => setShowAvatarModal(true)}>
                                        <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-primary to-secondary p-1 shadow-[0_0_30px_rgba(0,255,204,0.3)] group-hover:shadow-[0_0_40px_rgba(0,255,204,0.5)] transition-shadow">
                                            <div className="w-full h-full bg-background rounded-full flex items-center justify-center text-4xl font-display font-bold overflow-hidden border-2 border-background object-cover">
                                                <img src={`https://api.dicebear.com/7.x/micah/svg?seed=${avatarSeed}&backgroundColor=0D0F1E`} alt="Avatar" className="w-full h-full opacity-90" />
                                            </div>
                                        </div>
                                        <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <span className="text-xs font-bold text-white tracking-wider">CHANGE</span>
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{user?.name || 'Nexus User'}</h3>
                                        <p className="text-sm text-text-muted font-mono">{user?.email}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Full Name</label>
                                        <input type="text" defaultValue={user?.name || ''} className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium" />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Email Address</label>
                                        <input type="email" defaultValue={user?.email || ''} readOnly className="w-full bg-black/50 border border-white/5 rounded-xl px-5 py-4 text-text-muted cursor-not-allowed font-medium" />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end relative z-10">
                                    <button className="px-8 py-3 bg-gradient-to-r from-primary to-secondary text-black font-bold rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(0,255,204,0.3)] transform hover:scale-105 duration-200">Save Changes</button>
                                </div>
                            </div>

                            {/* Account Level Card */}
                            <div className="bg-warning/5 border border-warning/20 rounded-2xl p-8 relative overflow-hidden backdrop-blur-xl">
                                <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-warning/10 rounded-full blur-3xl" />
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
                                    <Shield size={22} className="text-warning" /> Account Tier
                                </h2>
                                <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-2xl font-bold text-warning font-display tracking-tight">Nexus Pro</h3>
                                            <span className="px-2 py-1 bg-warning/20 text-warning text-xs font-bold rounded-md uppercase tracking-wider animate-pulse">Active</span>
                                        </div>
                                        <p className="text-sm text-text-muted leading-relaxed max-w-lg">You are utilizing the complete Nexus intelligence network. Unlimited AI scanner insights, real-time metrics, and precision alerting are fully unlocked.</p>
                                    </div>
                                    <button onClick={() => setActiveTab('billing')} className="px-6 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors font-semibold shadow-lg whitespace-nowrap">Manage Billing</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SECURITY TAB */}
                    {activeTab === 'security' && (
                        <div className="animate-fade-in space-y-6">
                            <div className="bg-[#0D0F1E] border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <Key size={22} className="text-primary" /> Password & Security
                                </h2>

                                <div className="space-y-8">
                                    {/* 2FA Toggle */}
                                    <div className="flex items-start justify-between pb-8 border-b border-white/5">
                                        <div className="max-w-md">
                                            <h3 className="text-lg font-bold text-white mb-2">Two-Factor Authentication (2FA)</h3>
                                            <p className="text-sm text-text-muted leading-relaxed">Add an extra layer of security to your account. We will require an SMS code or an authenticator app confirmation when you sign in.</p>
                                        </div>
                                        <button
                                            onClick={() => toggleSetting('twoFactor')}
                                            className={`w-14 h-7 rounded-full relative transition-colors shadow-inner flex-shrink-0 ${settings.twoFactor ? 'bg-primary' : 'bg-black/30 border border-white/10'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-md ${settings.twoFactor ? 'left-8' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    {/* Password Change */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white mb-6">Change Password</h3>
                                        <div className="grid gap-5 max-w-lg">
                                            <div className="relative">
                                                <input type="password" placeholder="Current Password" className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" />
                                            </div>
                                            <div className="relative">
                                                <input type="password" placeholder="New Password" className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all" />
                                            </div>
                                            <button className="px-6 py-4 bg-white/5 border border-white/10 rounded-xl font-bold hover:bg-white/10 transition-colors text-center mt-2 group">
                                                Update Password
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* NOTIFICATIONS TAB */}
                    {activeTab === 'notifications' && (
                        <div className="animate-fade-in">
                            <div className="bg-[#0D0F1E] border border-white/10 rounded-2xl p-8 relative shadow-2xl">
                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <Bell size={22} className="text-primary" /> Delivery Preferences
                                </h2>

                                <div className="space-y-4">
                                    {[
                                        { id: 'notifications', title: 'Push Notifications', desc: 'Receive live price action alerts directly in your browser.', icon: Smartphone },
                                        { id: 'emailAlerts', title: 'Email Summaries', desc: 'Daily market recaps, AI trading insights, and execution reports.', icon: Globe },
                                        { id: 'smsAlerts', title: 'Critical SMS Alerts', desc: 'Get immediate text messages for high-priority stop-loss triggers.', icon: Smartphone }
                                    ].map(item => {
                                        const Icon = item.icon
                                        return (
                                            <div key={item.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-6 bg-black/20 border border-white/5 rounded-2xl hover:bg-white/[0.03] transition-colors gap-6">
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center border transition-colors ${settings[item.id] ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-black/40 border-white/5 text-text-muted'}`}>
                                                        <Icon size={22} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-white mb-1">{item.title}</h3>
                                                        <p className="text-sm text-text-muted">{item.desc}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => toggleSetting(item.id)}
                                                    className={`w-14 h-7 rounded-full relative transition-colors shadow-inner flex-shrink-0 ${settings[item.id] ? 'bg-primary' : 'bg-black/50 border border-white/10'}`}
                                                >
                                                    <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all shadow-md ${settings[item.id] ? 'left-8' : 'left-1'}`} />
                                                </button>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PREFERENCES TAB */}
                    {activeTab === 'preferences' && (
                        <div className="animate-fade-in">
                            <div className="bg-[#0D0F1E] border border-white/10 rounded-2xl p-8 shadow-2xl">
                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <Moon size={22} className="text-primary" /> Localization & Display
                                </h2>

                                <div className="space-y-8">
                                    {/* Dark Mode */}
                                    <div className="flex items-center justify-between p-6 bg-black/20 border border-white/5 rounded-2xl">
                                        <div>
                                            <h3 className="text-lg font-bold text-white mb-1">Deep Space Interface</h3>
                                            <p className="text-sm text-text-muted">The definitive dark mode experience for reduced eye strain during market hours.</p>
                                        </div>
                                        <button
                                            onClick={() => toggleSetting('darkMode')}
                                            className={`w-14 h-7 rounded-full relative transition-colors flex-shrink-0 ${settings.darkMode ? 'bg-primary' : 'bg-black/50 border border-white/10'}`}
                                        >
                                            <div className={`w-5 h-5 rounded-full bg-white absolute top-1 transition-all ${settings.darkMode ? 'left-8' : 'left-1'}`} />
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Interface Language</label>
                                            <select className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none font-medium cursor-pointer">
                                                <option>English (US)</option>
                                                <option>English (UK)</option>
                                                <option>Hindi (IN)</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Base Currency</label>
                                            <select className="w-full bg-black/30 border border-white/10 rounded-xl px-5 py-4 text-white focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 appearance-none font-medium cursor-pointer">
                                                <option value="INR">INR — Indian Rupee (₹)</option>
                                                <option value="USD">USD — US Dollar ($)</option>
                                                <option value="EUR">EUR — Euro (€)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* BILLING TAB */}
                    {activeTab === 'billing' && (
                        <div className="animate-fade-in space-y-6">

                            {/* Current Plan Card */}
                            <div className="bg-[#0D0F1E] border border-white/10 rounded-2xl p-8 relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
                                <h2 className="text-xl font-bold mb-8 flex items-center gap-3">
                                    <CreditCard size={22} className="text-primary" /> Subscription & Routing
                                </h2>

                                <div className="bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/20 rounded-xl p-6 flex flex-col md:flex-row justify-between items-center gap-6 relative z-10 mb-8">
                                    <div className="flex items-center gap-5">
                                        <div className="w-14 h-14 bg-warning/20 rounded-full flex items-center justify-center">
                                            <Shield className="text-warning" size={28} />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="text-xl font-display font-bold text-white">Nexus Pro</h3>
                                                <span className="px-2 py-0.5 bg-success/20 text-success text-xs font-bold rounded uppercase">Active</span>
                                            </div>
                                            <p className="text-sm text-text-muted">Billed annually • Next charge ₹14,999 on Oct 12, 2026</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-5 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm font-semibold hover:bg-white/10 transition-colors">Cancel</button>
                                        <button className="px-5 py-2.5 bg-warning text-black rounded-lg text-sm font-bold hover:bg-warning/90 transition-colors shadow-[0_0_15px_rgba(245,158,11,0.3)]">Change Plan</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                                    {/* Payment Method */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Payment Method</h3>
                                        <div className="flex items-center justify-between p-4 bg-black/30 border border-white/5 rounded-xl hover:border-white/10 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-8 bg-white/10 rounded flex items-center justify-center font-bold text-white text-xs tracking-widest border border-white/20">VISA</div>
                                                <div>
                                                    <p className="font-semibold text-white text-sm">•••• •••• •••• 4242</p>
                                                    <p className="text-xs text-text-muted">Expires 12/28</p>
                                                </div>
                                            </div>
                                            <button className="text-primary text-sm font-bold hover:underline">Update</button>
                                        </div>
                                    </div>

                                    {/* Usage Metrics */}
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-bold text-text-muted uppercase tracking-wider">Current Cycle Usage</h3>
                                        <div className="bg-black/30 border border-white/5 rounded-xl p-4">
                                            <div className="flex justify-between text-sm mb-2">
                                                <span className="text-text-muted">AI API Requests</span>
                                                <span className="text-white font-mono">1,240 / 5,000</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-black rounded-full overflow-hidden">
                                                <div className="h-full bg-primary rounded-full w-[25%] shadow-[0_0_10px_rgba(0,255,204,0.5)]"></div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Billing History Card */}
                            <div className="bg-[#0D0F1E] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                <div className="p-8 pb-4 border-b border-white/5 flex justify-between items-center">
                                    <h2 className="text-lg font-bold">Billing History</h2>
                                    <button className="text-sm text-primary hover:underline flex items-center gap-1"><ExternalLink size={14} /> Download All</button>
                                </div>
                                <table className="w-full text-left">
                                    <thead className="bg-white/[0.02] text-xs text-text-muted uppercase">
                                        <tr>
                                            <th className="px-8 py-4 font-medium">Date</th>
                                            <th className="px-8 py-4 font-medium">Description</th>
                                            <th className="px-8 py-4 font-medium">Amount</th>
                                            <th className="px-8 py-4 font-medium">Status</th>
                                            <th className="px-8 py-4"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5 text-sm">
                                        {[
                                            { date: 'Oct 12, 2025', desc: 'Nexus Pro - Annual', amt: '₹14,999.00', status: 'Paid' },
                                            { date: 'Oct 12, 2024', desc: 'Nexus Pro - Annual', amt: '₹14,999.00', status: 'Paid' },
                                            { date: 'Oct 12, 2023', desc: 'Nexus Pro - Annual', amt: '₹14,500.00', status: 'Paid' }
                                        ].map((invoice, i) => (
                                            <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                                                <td className="px-8 py-4 text-text-muted">{invoice.date}</td>
                                                <td className="px-8 py-4 font-medium">{invoice.desc}</td>
                                                <td className="px-8 py-4 font-mono">{invoice.amt}</td>
                                                <td className="px-8 py-4">
                                                    <span className="px-2 py-1 bg-success/10 text-success text-xs rounded uppercase tracking-wider">{invoice.status}</span>
                                                </td>
                                                <td className="px-8 py-4 text-right">
                                                    <button className="p-2 text-text-muted hover:text-white rounded-lg hover:bg-white/10 transition-colors">
                                                        <Download size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* AVATAR SELECTION MODAL */}
            {showAvatarModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowAvatarModal(false)}>
                    <div className="bg-[#0D0F1E] border border-white/10 rounded-3xl p-8 max-w-4xl w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h2 className="text-2xl font-bold text-white">Choose your avatar</h2>
                                <p className="text-sm text-text-muted mt-1">Select an identity pixel character to represent your profile.</p>
                            </div>
                            <button onClick={() => setShowAvatarModal(false)} className="p-2 rounded-full hover:bg-white/10 text-white transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-4 max-h-[60vh] overflow-y-auto px-2 py-4 custom-scrollbar">
                            {AVATAR_OPTIONS.map(seed => {
                                const isSelected = avatarSeed === seed;
                                return (
                                    <button
                                        key={seed}
                                        onClick={() => {
                                            setAvatarSeed(seed);
                                            setShowAvatarModal(false);
                                        }}
                                        className={`relative aspect-square rounded-2xl p-1 transition-all flex flex-col items-center justify-center group ${isSelected
                                            ? 'bg-gradient-to-tr from-primary to-secondary shadow-[0_0_20px_rgba(0,255,204,0.4)] transform scale-105'
                                            : 'bg-white/5 border border-white/10 hover:border-primary/50 hover:bg-white/10 hover:scale-105'
                                            }`}
                                    >
                                        <div className="w-full h-full bg-background rounded-xl overflow-hidden relative">
                                            <img
                                                src={`https://api.dicebear.com/7.x/micah/svg?seed=${seed}&backgroundColor=0D0F1E`}
                                                alt={seed}
                                                className={`w-full h-full object-cover transition-opacity ${isSelected ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                                                loading="lazy"
                                            />
                                            {isSelected && (
                                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                                    <div className="bg-primary text-black rounded-full p-1 shadow-lg">
                                                        <Check size={16} className="font-bold" />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    )
}
