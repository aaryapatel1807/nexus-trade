import { useRef, useEffect, useState, useMemo } from 'react'
import * as THREE from 'three'

// Physics constants based on blueprint
const PHYSICS_CONFIG = {
    PARTICLE_COUNT: 150,
    BASE_LIFT: 0.008,
    PRICE_GRAVITY_MULTIPLIER: 0.05,
    MAX_HEIGHT: 30,
    MIN_HEIGHT: -30,
    DRIFT_AMPLITUDE: 3.5,
    DRIFT_SPEED: 0.008,
    CONNECTION_DISTANCE: 12,
    VOLATILITY_BURST_RADIUS: 20,
}

function getGravityMode(priceChangePct) {
    if (priceChangePct > 3) return "ANTIGRAVITY_STRONG"
    if (priceChangePct > 1) return "ANTIGRAVITY_MILD"
    if (priceChangePct > -1) return "NEUTRAL"
    if (priceChangePct > -3) return "GRAVITY_MILD"
    return "GRAVITY_STRONG"
}

export function AntiGravityField({ priceChangePct = 0, volatility = 0.5 }) {
    const mountRef = useRef(null)

    useEffect(() => {
        if (!mountRef.current) return

        // Setup Scene
        const scene = new THREE.Scene()

        // Add Fog for depth
        scene.fog = new THREE.FogExp2(0x0a0a0f, 0.015)

        const camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000)
        camera.position.z = 45
        camera.position.y = 5

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) // Performance cap
        renderer.setSize(window.innerWidth, window.innerHeight)
        mountRef.current.appendChild(renderer.domElement)

        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
        scene.add(ambientLight)

        const pointLight = new THREE.PointLight(0x00ffcc, 5, 100)
        scene.add(pointLight)

        const purpleLight = new THREE.PointLight(0x7000ff, 4, 80)
        purpleLight.position.set(-20, 10, -10)
        scene.add(purpleLight)

        // Background Wireframe Sphere
        const sphereGeometry = new THREE.SphereGeometry(35, 32, 32)
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x00ffcc,
            wireframe: true,
            opacity: 0.03,
            transparent: true,
            blending: THREE.AdditiveBlending
        })
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial)
        scene.add(sphere)

        // Particle Setup
        const particles = []
        const particleGeometry = new THREE.SphereGeometry(0.2, 8, 8)
        const particleMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x00ffcc,
            emissive: 0x00ffcc,
            emissiveIntensity: 0.5,
            roughness: 0.2,
            metalness: 0.8,
            transparent: true,
            opacity: 0.8
        })

        for (let i = 0; i < PHYSICS_CONFIG.PARTICLE_COUNT; i++) {
            const p = new THREE.Mesh(particleGeometry, particleMaterial)

            // Initial Random Positions
            p.position.set(
                (Math.random() - 0.5) * 80,
                (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 60 - 10
            )

            // Store physics data in userData
            p.userData = {
                vy: (Math.random() - 0.5) * 0.05,
                ox: p.position.x, // Origin X 
                oz: p.position.z, // Origin Z
                speed: (Math.random() + 0.5) * PHYSICS_CONFIG.DRIFT_SPEED,
                phase: Math.random() * Math.PI * 2,
                scaleSpeed: Math.random() * 0.02 + 0.01,
                scalePhase: Math.random() * Math.PI * 2
            }

            // Random initial scale
            const s = Math.random() * 1.5 + 0.5
            p.scale.set(s, s, s)

            scene.add(p)
            particles.push(p)
        }

        // Determine Gravity Force based on price change
        const gravityMode = getGravityMode(priceChangePct)
        const gravityForces = {
            ANTIGRAVITY_STRONG: -0.025,
            ANTIGRAVITY_MILD: -0.010,
            NEUTRAL: 0.000,
            GRAVITY_MILD: +0.010,
            GRAVITY_STRONG: +0.030,
        }
        const targetGravityForce = gravityForces[gravityMode]
        let currentGravityForce = 0 // Smooth transition

        // Connection Lines Geometry
        const lineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ffcc,
            transparent: true,
            opacity: 0.15,
            blending: THREE.AdditiveBlending
        })
        const lineGeometry = new THREE.BufferGeometry()
        const connections = new THREE.LineSegments(lineGeometry, lineMaterial)
        scene.add(connections)

        // Mouse Tracking for Interactive Particles
        const pointer = new THREE.Vector2(0, 0)
        let pointerTargetX = 0
        let pointerTargetY = 0

        const onPointerMove = (e) => {
            // Normalized coordinates (-1 to 1)
            pointerTargetX = (e.clientX / window.innerWidth) * 2 - 1
            pointerTargetY = -(e.clientY / window.innerHeight) * 2 + 1
        }
        window.addEventListener('pointermove', onPointerMove)

        // Window Resize Handler
        const onWindowResize = () => {
            camera.aspect = window.innerWidth / window.innerHeight
            camera.updateProjectionMatrix()
            renderer.setSize(window.innerWidth, window.innerHeight)
        }
        window.addEventListener('resize', onWindowResize)

        // Animation Loop
        let t = 0
        let animId

        // Arrays for line geometry
        const positions = new Float32Array(PHYSICS_CONFIG.PARTICLE_COUNT * PHYSICS_CONFIG.PARTICLE_COUNT * 6)
        const colors = new Float32Array(PHYSICS_CONFIG.PARTICLE_COUNT * PHYSICS_CONFIG.PARTICLE_COUNT * 6)

        const animate = () => {
            animId = requestAnimationFrame(animate)
            t += 0.01

            // Ease pointer position
            pointer.x += (pointerTargetX - pointer.x) * 0.05
            pointer.y += (pointerTargetY - pointer.y) * 0.05

            // Update camera gently based on mouse
            camera.position.x += (pointer.x * 2 - camera.position.x) * 0.05
            camera.position.y += (-pointer.y * 2 + 5 - camera.position.y) * 0.05
            camera.lookAt(0, 0, 0)

            // Smooth gravity transition
            currentGravityForce += (targetGravityForce - currentGravityForce) * 0.05

            let vertexIndex = 0

            for (let i = 0; i < particles.length; i++) {
                const p = particles[i]

                // --- PHYSICS ---
                // Antigravity force application
                p.userData.vy -= currentGravityForce
                p.userData.vy *= 0.98 // Air friction / damping

                // Update positions with sinusoidal drift
                p.position.x = p.userData.ox + Math.sin(t * p.userData.speed * 20 + p.userData.phase) * PHYSICS_CONFIG.DRIFT_AMPLITUDE
                p.position.y += p.userData.vy
                p.position.z = p.userData.oz + Math.cos(t * p.userData.speed * 15 + p.userData.phase) * PHYSICS_CONFIG.DRIFT_AMPLITUDE

                // Mouse Repulsion
                // Map mouse vector to 3D world approximate coords
                const mouseVector = new THREE.Vector3(pointer.x * 30, pointer.y * 20, 10)
                const distToMouse = p.position.distanceTo(mouseVector)

                if (distToMouse < 15) {
                    const force = (15 - distToMouse) * 0.02
                    const dir = new THREE.Vector3().subVectors(p.position, mouseVector).normalize()
                    p.position.add(dir.multiplyScalar(force))
                    // Distort origin so they slowly drift back
                    p.userData.ox += dir.x * force
                    p.userData.oz += dir.z * force
                }

                // Wrap around boundaries
                if (p.position.y > PHYSICS_CONFIG.MAX_HEIGHT) {
                    p.position.y = PHYSICS_CONFIG.MIN_HEIGHT;
                    p.userData.vy = 0;
                    p.position.x = p.userData.ox;
                }
                if (p.position.y < PHYSICS_CONFIG.MIN_HEIGHT) {
                    p.position.y = PHYSICS_CONFIG.MAX_HEIGHT;
                    p.userData.vy = 0;
                    p.position.x = p.userData.ox;
                }

                // Volatility modifier (jitter)
                if (volatility > 0.5) {
                    const jitter = (volatility - 0.5) * 2
                    p.position.x += (Math.random() - 0.5) * jitter * 0.2
                    p.position.y += (Math.random() - 0.5) * jitter * 0.1
                }

                // Breathing scale effect
                const currentScale = p.scale.x
                const targetScale = 1.0 + Math.sin(t * 2 + p.userData.scalePhase) * 0.3
                p.scale.setScalar(currentScale + (targetScale - currentScale) * 0.05)

                // --- CONNECTIONS ---
                for (let j = i + 1; j < particles.length; j++) {
                    const p2 = particles[j]
                    const dist = p.position.distanceTo(p2.position)

                    if (dist < PHYSICS_CONFIG.CONNECTION_DISTANCE) {
                        // Determine line color based on height/gravity (greenish if high, reddish if low)
                        const yNorm = (p.position.y + 15) / 30 // Approx 0 to 1

                        positions[vertexIndex * 3] = p.position.x
                        positions[vertexIndex * 3 + 1] = p.position.y
                        positions[vertexIndex * 3 + 2] = p.position.z

                        positions[(vertexIndex + 1) * 3] = p2.position.x
                        positions[(vertexIndex + 1) * 3 + 1] = p2.position.y
                        positions[(vertexIndex + 1) * 3 + 2] = p2.position.z

                        vertexIndex += 2
                    }
                }
            }

            // Update Line Geometry
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(positions.subarray(0, vertexIndex * 3), 3))

            // Update Line opacity based on volatility
            lineMaterial.opacity = 0.1 + (volatility * 0.1)

            // Rotate Background
            sphere.rotation.y = t * 0.02
            sphere.rotation.x = Math.sin(t * 0.01) * 0.1

            // Animate Light
            pointLight.position.set(
                Math.cos(t * 0.5) * 20,
                Math.sin(t * 0.3) * 15,
                15
            )

            renderer.render(scene, camera)
        }

        animate()

        // Cleanup
        return () => {
            window.removeEventListener('resize', onWindowResize)
            window.removeEventListener('pointermove', onPointerMove)
            cancelAnimationFrame(animId)

            particles.forEach(p => {
                p.geometry.dispose()
                p.material.dispose()
            })
            sphereGeometry.dispose()
            sphereMaterial.dispose()
            lineGeometry.dispose()
            lineMaterial.dispose()
            renderer.dispose()

            if (mountRef.current?.contains(renderer.domElement)) {
                mountRef.current.removeChild(renderer.domElement)
            }
        }
    }, [priceChangePct, volatility])

    return (
        <div
            ref={mountRef}
            className="fixed inset-0 z-0 pointer-events-none"
            style={{ background: 'radial-gradient(circle at center, #12121a 0%, #0a0a0f 100%)' }}
        />
    )
}
