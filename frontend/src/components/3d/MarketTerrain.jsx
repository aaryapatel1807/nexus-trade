import { useRef, useState, useMemo } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Text, Html } from '@react-three/drei'
import * as THREE from 'three'

// Mock Data for the 3D Heatmap
const SECTORS = [
    { name: "Information Tech", stocks: ["TCS", "INFY", "HCLTECH", "WIPRO"], x: -2, z: -2, weight: 8, change: 2.5 },
    { name: "Financials", stocks: ["HDFCBANK", "ICICIBANK", "SBIN", "KOTAKBANK"], x: 0, z: -2, weight: 9, change: -1.2 },
    { name: "Energy", stocks: ["RELIANCE", "ONGC", "NTPC", "POWERGRID"], x: 2, z: -2, weight: 7.5, change: 0.8 },
    { name: "Auto", stocks: ["TATAMOTORS", "M&M", "MARUTI", "BAJAJ-AUTO"], x: -2, z: 0, weight: 4.5, change: 1.5 },
    { name: "FMCG", stocks: ["ITC", "HUL", "NESTLEIND", "BRITANNIA"], x: 0, z: 0, weight: 6, change: -0.3 },
    { name: "Metals", stocks: ["TATASTEEL", "HINDALCO", "JSWSTEEL", "COALINDIA"], x: 2, z: 0, weight: 3, change: 0.5 },
    { name: "Pharma", stocks: ["SUNPHARMA", "CIPLA", "DRREDDY", "DIVISLAB"], x: -1, z: 2, weight: 5, change: 3.1 },
    { name: "Telecom", stocks: ["BHARTIARTL", "IDEA", "INDUSINDBK", "UPL"], x: 1, z: 2, weight: 2.5, change: -0.4 },
]

function HeatmapCell({ sector, onHover }) {
    const meshRef = useRef(null)
    const [hovered, setHovered] = useState(false)

    // Calculate color based on percentage change
    const color = useMemo(() => {
        if (sector.change > 2) return '#00ffcc' // Strong Green (Primary)
        if (sector.change > 0) return '#00cc66' // Green (Success)
        if (sector.change < -2) return '#ff0055' // Strong Red (Accent)
        if (sector.change < 0) return '#ff3333' // Red (Danger)
        return '#8f9bb3' // Neutral Muted
    }, [sector.change])

    // Base height based on market cap weight
    const baseHeight = sector.weight * 0.5

    useFrame((state) => {
        if (!meshRef.current) return

        // Animate up and down slightly (breathing)
        const time = state.clock.getElapsedTime()
        const breathingOffset = Math.sin(time * 2 + sector.x) * 0.1

        // Hover scale effect
        const targetScaleY = hovered ? baseHeight * 1.2 : baseHeight
        meshRef.current.scale.y += (targetScaleY - meshRef.current.scale.y) * 0.1

        // Ensure the bottom stays fixed when height changes
        meshRef.current.position.y = (meshRef.current.scale.y / 2) + breathingOffset
    })

    return (
        <group position={[sector.x * 2.5, 0, sector.z * 2.5]}>
            <mesh
                ref={meshRef}
                onPointerOver={(e) => { e.stopPropagation(); setHovered(true); onHover(sector, e) }}
                onPointerOut={(e) => { e.stopPropagation(); setHovered(false); onHover(null, e) }}
            >
                <boxGeometry args={[2, 1, 2]} />
                <meshPhysicalMaterial
                    color={color}
                    emissive={color}
                    emissiveIntensity={hovered ? 0.6 : 0.2}
                    roughness={0.2}
                    metalness={0.8}
                    transparent={true}
                    opacity={0.9}
                />
            </mesh>

            {/* Sector Name Label floating above the cell */}
            <Text
                position={[0, baseHeight + 0.5, 0]}
                fontSize={0.25}
                color="white"
                anchorX="center"
                anchorY="middle"
                outlineColor="#000000"
                outlineWidth={0.02}
            >
                {sector.name}
            </Text>
        </group>
    )
}

function Scene() {
    const [activeTooltip, setActiveTooltip] = useState(null)
    const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 })

    const handleHover = (sector, event) => {
        if (sector) {
            setActiveTooltip(sector)
            setTooltipPos({ x: event.clientX, y: event.clientY })
        } else {
            setActiveTooltip(null)
        }
    }

    // Slowly rotate the entire grid
    const groupRef = useRef(null)
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.y += 0.001
        }
    })

    return (
        <>
            {/* Lighting */}
            <ambientLight intensity={0.4} />
            <directionalLight position={[10, 20, 10]} intensity={1} color="#ffffff" />
            <pointLight position={[-10, 15, -10]} intensity={0.8} color="#7000ff" />

            <group ref={groupRef}>
                {/* Base Grid Plane */}
                <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
                    <planeGeometry args={[20, 20]} />
                    <meshBasicMaterial color="#0a0a0f" wireframe={true} transparent opacity={0.2} />
                </mesh>

                {/* Heatmap Cells */}
                {SECTORS.map((sector, i) => (
                    <HeatmapCell key={i} sector={sector} onHover={handleHover} />
                ))}

                {/* HTML Tooltip Overlay */}
                {activeTooltip && (
                    <Html
                        position={[0, 0, 0]}
                        style={{
                            pointerEvents: 'none',
                            position: 'fixed',
                            transform: 'translate(0, 0)'
                        }}
                    >
                        <div
                            className="glass-panel p-4 rounded-xl shadow-2xl w-48 border border-white/20 animate-fade-in"
                            style={{
                                position: 'fixed',
                                left: `${tooltipPos.x + 15}px`,
                                top: `${tooltipPos.y + 15}px`,
                            }}
                        >
                            <h3 className="text-white font-bold mb-1">{activeTooltip.name}</h3>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-text-muted">Sector Weight</span>
                                <span className="text-xs text-white font-mono">{activeTooltip.weight}%</span>
                            </div>
                            <div className="flex justify-between items-center mb-3">
                                <span className="text-xs text-text-muted">24h Change</span>
                                <span className={`text-xs font-bold font-mono ${activeTooltip.change >= 0 ? 'text-primary' : 'text-danger'}`}>
                                    {activeTooltip.change > 0 ? '+' : ''}{activeTooltip.change}%
                                </span>
                            </div>
                            <div className="text-xs text-text-muted border-t border-white/10 pt-2">
                                Top: {activeTooltip.stocks.join(', ')}
                            </div>
                        </div>
                    </Html>
                )}
            </group>

            <OrbitControls
                enablePan={false}
                minPolarAngle={Math.PI / 6}
                maxPolarAngle={Math.PI / 2.5}
                minDistance={10}
                maxDistance={25}
                autoRotate
                autoRotateSpeed={0.5}
            />
        </>
    )
}

export function MarketTerrain() {
    return (
        <div className="w-full h-full relative cursor-crosshair">
            <Canvas
                camera={{ position: [8, 12, 15], fov: 45 }}
                gl={{ antialias: true, alpha: true }}
            >
                <Scene />
            </Canvas>

            {/* Overlay text styling */}
            <div className="absolute top-4 left-4 pointer-events-none">
                <div className="px-3 py-1 rounded bg-black/40 backdrop-blur border border-white/10 text-xs font-mono text-white/70">
                    [DRAG TO ROTATE MAP] [SCROLL TO ZOOM]
                </div>
            </div>
        </div>
    )
}
