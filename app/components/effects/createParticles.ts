import * as THREE from 'three'
import gsap from 'gsap'

export function createParticles(scene: THREE.Scene) {

  // --- PARTICLE TEXTURE: tiny soft glow dot ---
  function makeParticleTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0,   'rgba(255, 220, 100, 1)')
    gradient.addColorStop(0.4, 'rgba(255, 180,  50, 0.6)')
    gradient.addColorStop(1,   'rgba(255, 140,   0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }

  // --- SETUP: 220 particles as one single object ---
  const NUM_PARTICLES = 220
  const geometry = new THREE.BufferGeometry()

  // Store orbital data for each particle
  const orbits = Array.from({ length: NUM_PARTICLES }, (_, i) => ({
    radius: 1.2 + Math.random() * 1.8,  // how far from center
    speed:  0.08 + Math.random() * 0.25, // how fast it orbits
    phase:  Math.random() * Math.PI * 2, // starting angle
    yBase:  -1.5 + Math.random() * 3.5, // vertical spread
    yWave:  Math.random() * 0.3,         // vertical float amount
    ySpeed: 0.2 + Math.random() * 0.4,  // vertical float speed
  }))

  // Initial positions — all at origin, will be updated each frame
  const positions = new Float32Array(NUM_PARTICLES * 3)
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))

  // --- MATERIAL ---
  const material = new THREE.PointsMaterial({
    map: makeParticleTexture(),
    size: 0.06,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0,           // invisible to start
    depthWrite: false,
    vertexColors: false,
    sizeAttenuation: true,
  })

  const particles = new THREE.Points(geometry, material)
  scene.add(particles)

  // --- FADE IN at 7s — after everything else has appeared ---
  gsap.to(material, {
    opacity: 0.8,
    duration: 2.5,
    delay: 7.0,
    ease: 'power2.out'
  })

  // --- UPDATE: called every frame in render loop ---
  function updateParticles(time: number) {
    const pos = geometry.attributes.position.array as Float32Array

    orbits.forEach((orbit, i) => {
      const angle = time * orbit.speed + orbit.phase

      // Circular orbit on X/Z plane
      pos[i * 3 + 0] = Math.cos(angle) * orbit.radius        // X
      pos[i * 3 + 1] = orbit.yBase +                          // Y
                        Math.sin(time * orbit.ySpeed + orbit.phase) * orbit.yWave
      pos[i * 3 + 2] = Math.sin(angle) * orbit.radius        // Z
    })

    // Tell Three.js the positions changed this frame
    geometry.attributes.position.needsUpdate = true
  }

  return { updateParticles }
}