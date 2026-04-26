import * as THREE from 'three'
import gsap from 'gsap'

export function createStreaks(scene: THREE.Scene) {

  // --- STREAK TEXTURE: soft glowing line ---
  function makeStreakTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 32
    canvas.height = 128
    const ctx = canvas.getContext('2d')!
    const gradient = ctx.createLinearGradient(0, 0, 0, 128)
    gradient.addColorStop(0,   'rgba(255, 220, 80, 0)')   // transparent tip
    gradient.addColorStop(0.2, 'rgba(255, 200, 60, 0.8)') // bright body
    gradient.addColorStop(0.5, 'rgba(255, 160, 20, 0.6)') // mid fade
    gradient.addColorStop(1,   'rgba(255, 100, 0,  0)')   // transparent tail
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 32, 128)
    return new THREE.CanvasTexture(canvas)
  }

  const streakTexture = makeStreakTexture()
  const streaks: THREE.Sprite[] = []

  // --- STREAK POSITIONS ---
  // These are placed at the model's limb positions
  // x = left/right, y = up/down, rotation = angle in radians
  const streakDefs = [
    // Upper right arm sweeping up-right
    { x:  0.85, y:  1.2,  z: 0.1, rotation:  0.6, length: 0.9 },
    // Upper left arm sweeping left
    { x: -0.9,  y:  0.9,  z: 0.1, rotation: -0.5, length: 0.7 },
    // Raised right leg kicking out
    { x:  0.5,  y: -0.3,  z: 0.1, rotation:  1.3, length: 0.8 },
    // Lower left leg
    { x: -0.3,  y: -0.8,  z: 0.1, rotation: -0.3, length: 0.6 },
    // Fabric/scarf flowing right
    { x:  1.1,  y:  0.3,  z: 0.1, rotation:  0.9, length: 1.0 },
  ]

  streakDefs.forEach((def, i) => {
    const mat = new THREE.SpriteMaterial({
      map: streakTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,        // invisible to start
      depthWrite: false,
      rotation: def.rotation,
    })

    const sprite = new THREE.Sprite(mat)
    sprite.position.set(def.x, def.y, def.z)
    sprite.scale.set(0.18, def.length, 1)
    scene.add(sprite)
    streaks.push(sprite)
  })

  // --- ANIMATION ---
  // Phase 1: All streaks fade IN quickly at 1.5s (just before model appears)
  // Phase 2: All streaks fade OUT slowly at 3.5s (as model fully reveals)
  function startStreaks() {
    const tl = gsap.timeline({ delay: 1.5 })

    // Fade in — quick, staggered slightly
    tl.to(streaks.map(s => s.material), {
      opacity: 0.65,
      duration: 0.35,
      stagger: 0.06,
      ease: 'power2.out'
    })

    // Hold briefly, then fade out
    .to(streaks.map(s => s.material), {
      opacity: 0,
      duration: 1.8,
      delay: 0.4,
      stagger: 0.08,
      ease: 'power2.in',
      onComplete: () => {
        // Remove from scene after fading — cleanup
        streaks.forEach(s => scene.remove(s))
      }
    })
  }

  return { startStreaks }
}