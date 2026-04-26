import * as THREE from 'three'
import gsap from 'gsap'

type HaloConfig = {
  center: THREE.Vector3
  radius: number
  radiusX?: number
  radiusY?: number
}

export function createHalo(scene: THREE.Scene, config?: Partial<HaloConfig>) {
  const haloCenter = config?.center ?? new THREE.Vector3(0, 0.2, -0.8)
  const ringRadius = config?.radius ?? 1.55
  const radiusX = config?.radiusX ?? ringRadius
  const radiusY = config?.radiusY ?? ringRadius * 1.12

  // --- STEP 1: The main ring ---
  const ringGeo = new THREE.TorusGeometry(
    ringRadius,   // ring radius — sized to match your model's aureole
    0.0100,  // tube thickness
    8,      // radial segments
    128     // tubular segments — keep high for smooth circle
  )
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x8B5E1A,        // dark bronze base
    emissive: new THREE.Color(0xFF9922),  // warm gold glow
    emissiveIntensity: 0,   // starts completely dark
    metalness: 0.7,
    roughness: 0.3,
  })
  const ring = new THREE.Mesh(ringGeo, ringMat)
ring.position.copy(haloCenter)
ring.scale.set(radiusX / ringRadius, radiusY / ringRadius, 1)
ring.renderOrder = -1  // 👈 render BEFORE the model
scene.add(ring)

  // --- STEP 2: Flame texture for ring tips ---
  function makeTipTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 32
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16)
    gradient.addColorStop(0,   'rgba(255, 220, 80,  1)')
    gradient.addColorStop(0.4, 'rgba(255, 100, 20,  0.7)')
    gradient.addColorStop(1,   'rgba(200, 50,  0,   0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 32)
    return new THREE.CanvasTexture(canvas)
  }

  const tipTexture = makeTipTexture()

  // --- STEP 3: Place flame tips around the ring ---
  const NUM_TIPS = 43
  const tipSprites: THREE.Sprite[] = []

  for (let i = 0; i < NUM_TIPS; i++) {
    const angle = (i / NUM_TIPS) * Math.PI * 2
    // Calculate position on the ring circumference
    const x = haloCenter.x + Math.cos(angle) * radiusX
    const y = haloCenter.y + Math.sin(angle) * radiusY
    const tipMat = new THREE.SpriteMaterial({
      map: tipTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })
    const tip = new THREE.Sprite(tipMat)
    tip.position.set(x, y, haloCenter.z - 0.05)
    tip.scale.set(0.12, 0.16, 1)
    tip.userData.flickerOffset = i * 0.8
    scene.add(tip)
    tip.renderOrder = 1
    tipSprites.push(tip)
  }

  // --- STEP 4: Animate ring glow and tips ---

  // Ring brightens at 4.5s (same time as moon)
  gsap.to(ringMat, {
    emissiveIntensity: 1.8,
    duration: 1.5,
    delay: 4.5,
    ease: 'power2.out'
  })

  // Tip flames ignite clockwise one by one
  tipSprites.forEach((tip, i) => {
    gsap.to(tip.material, {
      opacity: 0.85,
      duration: 0.25,
      delay: 4.5 + i * 0.06, // 60ms apart — goes around in ~1.4s
      ease: 'power2.out'
    })
  })

  // --- STEP 5: Flicker tips in render loop ---
  function updateHalo(time: number) {
    tipSprites.forEach((tip, i) => {
      const mat = tip.material as THREE.SpriteMaterial
      if (mat.opacity > 0.1) {
        const flicker = Math.sin(time * 5 + tip.userData.flickerOffset)
        mat.opacity = 0.7 + flicker * 0.15
        const scale = 1 + flicker * 0.08
        tip.scale.set(0.12 * scale, 0.16 * scale, 1)
      }
    })
  }

  return { updateHalo }
}