import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { gsap } from 'gsap'
import { ArrowRight, TrendingUp, Cpu, Globe2, ShieldAlert, BrainCircuit } from 'lucide-react'
import { AntiGravityField } from '../components/3d/AntiGravityField'
import { Navbar } from '../components/layout/Navbar'

export function Landing() {
    const heroRef = useRef(null)
    const featuresRef = useRef(null)

    useEffect(() => {
        // Hero Animations
        const ctx = gsap.context(() => {
            const tl = gsap.timeline()

            tl.fromTo('.hero-badge',
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: 0.8, ease: "back.out(1.7)" }
            )
                .fromTo('.hero-title-1',
                    { opacity: 0, x: -50 },
                    { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
                    "-=0.4"
                )
                .fromTo('.hero-title-2',
                    { opacity: 0, x: 50 },
                    { opacity: 1, x: 0, duration: 0.8, ease: "power3.out" },
                    "-=0.6"
                )
                .fromTo('.hero-desc',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
                    "-=0.4"
                )
                .fromTo('.hero-actions',
                    { opacity: 0, y: 20 },
                    { opacity: 1, y: 0, duration: 0.6, stagger: 0.2, ease: "power2.out" },
                    "-=0.4"
                )

            // Floating animation for stats
            gsap.to('.hero-stat', {
                y: -10,
                duration: 2,
                yoyo: true,
                repeat: -1,
                ease: "sine.inOut",
                stagger: 0.2
            })

        }, heroRef)

        return () => ctx.revert()
    }, [])

    return (
        <div className="min-h-screen relative overflow-hidden bg-background pt-10">
            {/* 3D Background */}
            <AntiGravityField priceChangePct={3.5} volatility={0.3} />

            {/* Navigation */}
            <Navbar />

            {/* Main Content Overlay */}
            <main className="relative z-10 pt-32 pb-20">

                {/* HERO SECTION */}
                <section ref={heroRef} className="max-w-7xl mx-auto px-6 h-[80vh] flex flex-col justify-center items-center text-center">

                    <div className="hero-badge inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/30 bg-primary/10 backdrop-blur-sm text-primary text-sm font-medium mb-8">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                        </span>
                        NEXUS TRADE ENGINE v2.0 LIVE
                    </div>

                    <h1 className="text-6xl md:text-8xl font-display font-bold tracking-tight mb-4 leading-tight">
                        <span className="hero-title-1 block text-transparent bg-clip-text bg-gradient-to-r from-white to-white/70">
                            TRADE AT THE SPEED
                        </span>
                        <span className="hero-title-2 block text-transparent bg-clip-text bg-gradient-to-r from-primary via-white to-secondary text-glow-primary">
                            OF INTELLIGENCE
                        </span>
                    </h1>

                    <p className="hero-desc max-w-2xl text-lg md:text-xl text-text-muted mb-12 font-light">
                        You don't just see stock data. You experience it in 3D space, converse with an AI analyst, and feel market volatility bend around price movements.
                    </p>

                    <div className="hero-actions flex flex-col sm:flex-row gap-6">
                        <Link to="/dashboard" className="group relative px-8 py-4 bg-primary text-background font-bold text-lg rounded-xl overflow-hidden shadow-[0_0_40px_rgba(0,255,204,0.3)] transition-all hover:scale-105 hover:shadow-[0_0_60px_rgba(0,255,204,0.5)]">
                            <div className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity"></div>
                            <span className="relative flex items-center justify-center gap-3">
                                Enter Dashboard <ArrowRight className="group-hover:translate-x-1 transition-transform" />
                            </span>
                        </Link>
                        <Link to="/ai" className="px-8 py-4 bg-surface/50 backdrop-blur-md border border-white/10 text-white font-medium text-lg rounded-xl hover:bg-white/5 transition-colors flex items-center justify-center gap-3">
                            <BrainCircuit size={20} className="text-secondary" />
                            Meet the AI Analyst
                        </Link>
                    </div>

                    {/* Floating Live Stats */}
                    <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-8 md:gap-16 px-6 flex-wrap opacity-80 pointer-events-none">
                        {[
                            { label: "NIFTY 50", val: "22,405.60", change: "+1.24%", up: true },
                            { label: "SENSEX", val: "73,651.35", change: "+1.58%", up: true },
                            { label: "INDIA VIX", val: "13.45", change: "-4.21%", up: false },
                        ].map((stat, i) => (
                            <div key={i} className="hero-stat flex flex-col items-center glass-panel px-6 py-3 rounded-2xl">
                                <span className="text-sm text-text-muted font-medium mb-1">{stat.label}</span>
                                <div className="flex items-end gap-3 text-white font-mono text-xl">
                                    {stat.val}
                                    <span className={`text-sm mb-1 ${stat.up ? 'text-primary text-glow-primary' : 'text-danger'}`}>
                                        {stat.change}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

            </main>
        </div>
    )
}
