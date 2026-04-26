import * as THREE from 'three'
import gsap from 'gsap'

type MoonConfig = {
  center: THREE.Vector3
  ringRadius: number
}

export function createMoon(scene: THREE.Scene, config?: Partial<MoonConfig>) {
  const moonCenter = config?.center ?? new THREE.Vector3(0, 0.2, -1.5)
  const ringRadius = config?.ringRadius ?? 1.55

  // --- STEP 1: Draw the moon glow texture ---
  function makeMoonTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 256)
    gradient.addColorStop(0,    'rgba(255, 245, 200, 1)')   // bright white-gold center
    gradient.addColorStop(0.2,  'rgba(255, 220, 140, 0.9)') // warm gold
    gradient.addColorStop(0.5,  'rgba(200, 140,  50, 0.5)') // amber mid
    gradient.addColorStop(0.8,  'rgba(150,  80,  20, 0.2)') // dark amber edge
    gradient.addColorStop(1,    'rgba(100,  40,   0, 0)')   // transparent outside
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    return new THREE.CanvasTexture(canvas)
  }

  // --- STEP 2: Create the moon disk ---
  const moonSize = ringRadius * 4.5
  const moonGeo = new THREE.PlaneGeometry(moonSize, moonSize) // large disk behind model
  const moonMat = new THREE.MeshBasicMaterial({
    map: makeMoonTexture(),
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0,          // invisible to start
    depthWrite: false,
  })
  const moon = new THREE.Mesh(moonGeo, moonMat)
  moon.position.copy(moonCenter)
  scene.add(moon)
  moon.renderOrder = -3

  // --- STEP 3: Light rays radiating from center ---
  const rays: THREE.Mesh[] = []

  function makeRayTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 256
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 256)
    gradient.addColorStop(0,   'rgba(255, 200, 100, 0.0)') // transparent at top
    gradient.addColorStop(0.3, 'rgba(255, 200, 100, 0.12)')// visible mid
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.06)')// fade
    gradient.addColorStop(1,   'rgba(255, 200, 100, 0.0)') // transparent at bottom
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 64, 256)
    return new THREE.CanvasTexture(canvas)
  }

  const rayTexture = makeRayTexture()
  const NUM_RAYS = 0

  for (let i = 0; i < NUM_RAYS; i++) {
    const angle = (i / NUM_RAYS) * Math.PI * 2
    const rayGeo = new THREE.PlaneGeometry(ringRadius * 0.13, ringRadius * 3.6)
    const rayMat = new THREE.MeshBasicMaterial({
      map: rayTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    })
    const ray = new THREE.Mesh(rayGeo, rayMat)
    ray.position.set(moonCenter.x, moonCenter.y, moonCenter.z + 0.1) // slightly in front of moon, still behind model
    ray.rotation.z = angle
    scene.add(ray)
    ray.renderOrder = -2  // 👈 render before everything
    rays.push(ray)
  }

  // --- STEP 4: Fade everything in at 4.5s ---
  // Moon fades in slowly
  gsap.to(moonMat, {
    opacity: 1,
    duration: 2.5,
    delay: 4.5,
    ease: 'power2.out'
  })

  // Rays fade in slightly after moon
  rays.forEach((ray, i) => {
    gsap.to(ray.material, {
      opacity: 1,
      duration: 2,
      delay: 5.0 + i * 0.05,
      ease: 'power2.out'
    })
  })

  // --- STEP 5: Subtle ray rotation in render loop ---
  function updateMoon(time: number) {
    // Very slow ray rotation — barely noticeable, just alive
    rays.forEach((ray, i) => {
      ray.rotation.z += 0.0003
    })
  }

  return { updateMoon }
}