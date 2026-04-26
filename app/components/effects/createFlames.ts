import * as THREE from 'three'
import gsap from 'gsap'

export function createFlames(scene: THREE.Scene, modelBaseY: number) {

  function makeFlameTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64
    const ctx = canvas.getContext('2d')!

    // Teardrop flame: bright core with amber edge.
    const gradient = ctx.createRadialGradient(32, 24, 2, 32, 34, 26)
    gradient.addColorStop(0,   'rgba(255, 250, 190, 1)')
    gradient.addColorStop(0.35,'rgba(255, 180, 50,  0.95)')
    gradient.addColorStop(0.7, 'rgba(240, 110, 20,  0.7)')
    gradient.addColorStop(1,   'rgba(180, 50,  0,   0)')

    ctx.beginPath()
    ctx.moveTo(32, 6)
    ctx.bezierCurveTo(46, 18, 49, 38, 32, 58)
    ctx.bezierCurveTo(15, 38, 18, 18, 32, 6)
    ctx.closePath()
    ctx.fillStyle = gradient
    ctx.fill()

    return new THREE.CanvasTexture(canvas)
  }

  function makeDiyaBaseTexture() {
    const canvas = document.createElement('canvas')
    canvas.width = 96
    canvas.height = 48
    const ctx = canvas.getContext('2d')!

    const baseGradient = ctx.createLinearGradient(0, 18, 0, 42)
    baseGradient.addColorStop(0, 'rgba(180, 95, 30, 0.95)')
    baseGradient.addColorStop(1, 'rgba(80,  35, 10, 0.9)')
    ctx.fillStyle = baseGradient
    ctx.beginPath()
    ctx.ellipse(48, 30, 34, 12, 0, 0, Math.PI * 2)
    ctx.fill()

    const rimGradient = ctx.createLinearGradient(0, 12, 0, 28)
    rimGradient.addColorStop(0, 'rgba(255, 205, 120, 0.85)')
    rimGradient.addColorStop(1, 'rgba(190, 110, 35,  0.55)')
    ctx.fillStyle = rimGradient
    ctx.beginPath()
    ctx.ellipse(48, 24, 26, 7, 0, 0, Math.PI * 2)
    ctx.fill()

    return new THREE.CanvasTexture(canvas)
  }

  const flameTexture = makeFlameTexture()
  const diyaBaseTexture = makeDiyaBaseTexture()
  const diyaFrontOffset = 0.38

  // Precisely tuned for modelBaseY of -1.41
  // Spread across the pedestal front edge
  const positions = [
    [-1.0,  0.15],
    [-0.65, 0.2 ],
    [-0.3,  0.22],
    [ 0.0,  0.22],
    [ 0.3,  0.22],
    [ 0.65, 0.2 ],
    [ 1.0,  0.15],
  ]

  const flames: THREE.Sprite[] = []
  const glows: THREE.Sprite[] = []

  positions.forEach((pos, i) => {
    const baseMaterial = new THREE.SpriteMaterial({
      map: diyaBaseTexture,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
    const baseSprite = new THREE.Sprite(baseMaterial)
    baseSprite.position.set(
      pos[0],
      modelBaseY + 0.52,
      pos[1] + diyaFrontOffset
    )
    baseSprite.scale.set(0.24, 0.10, 1)
    baseSprite.renderOrder = 5
    scene.add(baseSprite)

    const glowMaterial = new THREE.SpriteMaterial({
      map: flameTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })
    const glowSprite = new THREE.Sprite(glowMaterial)
    glowSprite.position.set(pos[0], modelBaseY + 0.57, pos[1] + diyaFrontOffset)
    glowSprite.scale.set(0.16, 0.14, 1)
    glowSprite.renderOrder = 6
    scene.add(glowSprite)
    glows.push(glowSprite)

    const material = new THREE.SpriteMaterial({
      map: flameTexture,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      depthTest: false,
    })

    const sprite = new THREE.Sprite(material)

    // Place flame tip above the diya base.
    sprite.position.set(
      pos[0],
      modelBaseY + 0.60,
      pos[1] + diyaFrontOffset
    )

    sprite.scale.set(0.10, 0.21, 1)
    sprite.userData.flickerOffset = i * 1.1
    sprite.renderOrder = 7

    scene.add(sprite)
    flames.push(sprite)

    gsap.to(baseMaterial, {
      opacity: 0.85,
      duration: 0.35,
      delay: 1.8 + i * 0.12,
      ease: 'power2.out'
    })

    gsap.to(glowMaterial, {
      opacity: 0.45,
      duration: 0.35,
      delay: 1.9 + i * 0.12,
      ease: 'power2.out'
    })

    gsap.to(material, {
      opacity: 0.9,
      duration: 0.4,
      delay: 2.0 + i * 0.15,
      ease: 'power2.out'
    })
  })

  function updateFlames(time: number) {
    flames.forEach((flame, i) => {
      const offset = flame.userData.flickerOffset
      const flicker = Math.sin(time * 4 + offset)
      const mat = flame.material as THREE.SpriteMaterial
      if (mat.opacity > 0.1) {
        mat.opacity = 0.85 + flicker * 0.12
        const scale = 1 + flicker * 0.08
        flame.scale.set(0.10 * scale, 0.21 * scale, 1)

        const glow = glows[i]
        if (glow) {
          const glowMat = glow.material as THREE.SpriteMaterial
          glowMat.opacity = 0.35 + flicker * 0.1
          glow.scale.set(0.16 * scale, 0.14 * scale, 1)
        }
      }
    })
  }

  return { updateFlames }
}