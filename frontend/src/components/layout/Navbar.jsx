import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, ArrowRight, LineChart, Globe, BrainCircuit, Activity, LogOut, Wallet } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'

export function Navbar() {
    const [scrolled, setScrolled] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const location = useLocation()
    const { user, logout } = useAuth()

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50)
        }
        window.addEventListener('scroll', handleScroll)
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    const navLinks = [
        { name: 'Markets', path: '/markets', icon: Globe },
        { name: 'Dashboard', path: '/dashboard', icon: LineChart },
        { name: 'AI Advisor', path: '/ai', icon: BrainCircuit },
        { name: 'Portfolio', path: '/portfolio', icon: Activity },
    ]

    return (
        <nav
            className={`absolute top-10 w-full z-40 transition-all duration-300 ${scrolled
                ? 'bg-surface/80 backdrop-blur-md border-b border-white/10 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.5)]'
                : 'bg-transparent py-5'
                }`}
        >
            <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                {/* Logo */}
                <Link to="/" className="flex items-center gap-2 group">
                    <div className="w-8 h-8 rounded animate-spin-slow bg-gradient-to-tr from-primary to-secondary flex items-center justify-center">
                        <div className="w-4 h-4 bg-background rounded-sm"></div>
                    </div>
                    <span className="font-display font-bold text-xl tracking-wider text-white group-hover:text-glow-primary transition-all">
                        NEXUS<span className="text-text-muted font-light ml-1">TRADE</span>
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-8">
                    {navLinks.map((link) => {
                        const isActive = location.pathname.startsWith(link.path)
                        const Icon = link.icon
                        return (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`flex items-center gap-2 text-sm font-medium transition-all duration-300 hover:text-primary ${isActive ? 'text-primary text-glow-primary' : 'text-text-muted'
                                    }`}
                            >
                                <Icon size={16} className={isActive ? 'opacity-100' : 'opacity-70'} />
                                {link.name}
                            </Link>
                        )
                    })}
                </div>

                {/* Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {user ? (
                        <>
                            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-lg mr-2">
                                <Wallet size={16} className="text-primary" />
                                <span className="text-sm font-mono font-bold text-white">${parseFloat(user.cashBalance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                            <button
                                onClick={logout}
                                className="group flex items-center gap-2 text-sm font-medium text-neutral-400 hover:text-red-400 transition-colors px-4 py-2"
                            >
                                <LogOut size={16} className="group-hover:-translate-x-1 transition-transform" />
                                Disconnect
                            </button>
                        </>
                    ) : (
                        <>
                            <Link
                                to="/login"
                                className="text-sm font-medium text-white hover:text-primary transition-colors px-4 py-2"
                            >
                                Log In
                            </Link>
                            <Link
                                to="/dashboard"
                                className="group relative px-5 py-2.5 rounded-lg text-sm font-semibold text-background overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-primary group-hover:bg-white transition-colors duration-300"></div>
                                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-[linear-gradient(45deg,transparent,rgba(255,255,255,0.3),transparent)] -translate-x-full group-hover:animate-[shimmer_1s_forwards]"></div>
                                <span className="relative flex items-center gap-2">
                                    Start Trading <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </span>
                            </Link>
                        </>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    className="md:hidden text-white"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </button>
            </div>

            {/* Mobile Menu Dropdown */}
            {mobileMenuOpen && (
                <div className="md:hidden absolute top-full left-0 w-full bg-surface border-b border-white/10 p-4 flex flex-col gap-4 shadow-2xl animate-fade-in">
                    {navLinks.map((link) => (
                        <Link
                            key={link.name}
                            to={link.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 text-white/80 hover:text-primary transition-colors"
                        >
                            <link.icon size={20} />
                            {link.name}
                        </Link>
                    ))}
                    <div className="h-px bg-white/10 my-2"></div>
                    {user ? (
                        <>
                            <div className="p-3 text-center text-primary font-mono font-bold">
                                BALANCE: ${parseFloat(user.cashBalance).toLocaleString()}
                            </div>
                            <button onClick={logout} className="p-3 text-center text-red-400">Disconnect</button>
                        </>
                    ) : (
                        <>
                            <Link className="p-3 text-center text-white/80" to="/login">Log In</Link>
                            <Link
                                to="/dashboard"
                                className="p-3 text-center bg-primary text-background rounded-lg font-semibold"
                            >
                                Start Trading
                            </Link>
                        </>
                    )}
                </div>
            )}
        </nav>
    )
}
