'use client'
import { createParticles } from './effects/createParticles'
import { createMoon } from './effects/createMoon'
import { createScrollLighting } from './effects/createScrollLighting'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import gsap from 'gsap'
import { createFlames } from './effects/createFlames' // 👈 ADD THIS
import { createHalo } from './effects/createHalo'

type AureoleAnchor = {
  center: THREE.Vector3
  radiusX: number
  radiusY: number
  radius: number
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor((sorted.length - 1) * p)))
  return sorted[index]
}

function estimateAureoleAnchor(model: THREE.Object3D, worldBox: THREE.Box3): AureoleAnchor {
  const size = worldBox.getSize(new THREE.Vector3())
  const fallbackCenter = new THREE.Vector3(0, worldBox.min.y + size.y * 0.63, 0)
  const fallbackRadiusX = Math.max(size.x * 0.45, 1.0)
  const fallbackRadiusY = Math.max(size.y * 0.34, 1.0)
  const fallbackRadius = (fallbackRadiusX + fallbackRadiusY) * 0.5

  model.updateWorldMatrix(true, true)

  const samplePoint = new THREE.Vector3()
  const pointCloud: THREE.Vector3[] = []
  let maxAbsX = 0
  const minUsefulY = worldBox.min.y + size.y * 0.14

  model.traverse((child) => {
    if (!(child instanceof THREE.Mesh)) return
    const position = child.geometry.getAttribute('position')
    if (!position) return

    for (let i = 0; i < position.count; i += 7) {
      samplePoint
        .set(position.getX(i), position.getY(i), position.getZ(i))
        .applyMatrix4(child.matrixWorld)
      if (samplePoint.y < minUsefulY) continue

      pointCloud.push(samplePoint.clone())
      maxAbsX = Math.max(maxAbsX, Math.abs(samplePoint.x))
    }
  })

  if (maxAbsX <= 0 || pointCloud.length < 100) {
    return {
      center: fallbackCenter,
      radiusX: fallbackRadiusX,
      radiusY: fallbackRadiusY,
      radius: fallbackRadius,
    }
  }

  const sideThreshold = maxAbsX * 0.78
  const sidePoints = pointCloud.filter((point) => Math.abs(point.x) >= sideThreshold)
  const seedPoints = sidePoints.length >= 30 ? sidePoints : pointCloud

  const provisionalCenter = seedPoints
    .reduce((acc, point) => acc.add(point), new THREE.Vector3())
    .multiplyScalar(1 / seedPoints.length)

  const radial = pointCloud.map((point) => {
    return Math.hypot(point.x - provisionalCenter.x, point.y - provisionalCenter.y)
  })

  const r90 = percentile(radial, 0.9)
  const r985 = percentile(radial, 0.985)
  const ringBand = pointCloud.filter((point) => {
    const r = Math.hypot(point.x - provisionalCenter.x, point.y - provisionalCenter.y)
    return r >= r90 && r <= r985
  })

  const fitPoints = ringBand.length >= 50 ? ringBand : seedPoints
  if (fitPoints.length < 20) {
    return {
      center: fallbackCenter,
      radiusX: fallbackRadiusX,
      radiusY: fallbackRadiusY,
      radius: fallbackRadius,
    }
  }

  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity

  fitPoints.forEach((point) => {
    if (point.x < minX) minX = point.x
    if (point.x > maxX) maxX = point.x
    if (point.y < minY) minY = point.y
    if (point.y > maxY) maxY = point.y
  })

  const center = new THREE.Vector3(
    (minX + maxX) * 0.5,
    (minY + maxY) * 0.5,
    worldBox.getCenter(new THREE.Vector3()).z
  )
  const radiusX = (maxX - minX) * 0.5
  const radiusY = (maxY - minY) * 0.5
  const radius = (radiusX + radiusY) * 0.5

  if (!Number.isFinite(radiusX) || !Number.isFinite(radiusY) || radiusX < 0.2 || radiusY < 0.2) {
    return {
      center: fallbackCenter,
      radiusX: fallbackRadiusX,
      radiusY: fallbackRadiusY,
      radius: fallbackRadius,
    }
  }

  return { center, radiusX, radiusY, radius }
}

export default function NatarajaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const overlay = overlayRef.current
    if (!canvas || !overlay) return

    const renderer = new THREE.WebGLRenderer({
      canvas, antialias: true, alpha: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.sortObjects = true
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 100
    )
    camera.position.set(0, 0, 6)

    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.05)
    scene.add(ambientLight)
    const keyLight = new THREE.DirectionalLight(0xffc878, 2.5)
    keyLight.position.set(-2, 3, 2)
    scene.add(keyLight)

    // const controls = new OrbitControls(camera, canvas)
    // controls.enableDamping = true
    // controls.dampingFactor = 0.05

    // 👇 ADD THIS — store the flicker function
    let updateFlames: ((time: number) => void) | null = null
    let updateMoon: ((time: number) => void) | null = null  // 👈 add this
    let updateHalo: ((time: number) => void) | null = null
    let updateParticles: ((time: number) => void) | null = null
    const loader = new GLTFLoader()
    loader.load('/models/nataraja.glb', (gltf) => {
      const model = gltf.scene
      // Scale first
      const box = new THREE.Box3().setFromObject(model)
      const size = box.getSize(new THREE.Vector3())
      const maxDim = Math.max(size.x, size.y, size.z)
      const scale = 3 / maxDim
      model.scale.setScalar(scale)

      // Then center AFTER scaling
      const scaledBox = new THREE.Box3().setFromObject(model)
      const center = scaledBox.getCenter(new THREE.Vector3())
      model.position.set(-center.x, -center.y, -center.z)

      scene.add(model)

      const worldBox = new THREE.Box3().setFromObject(model)
      const modelBaseY = worldBox.min.y
      const aureoleAnchor = estimateAureoleAnchor(model, worldBox)
      const aureoleCenter = aureoleAnchor.center.clone().add(new THREE.Vector3(0.015, 0.150, 0))
      const aureoleRadius = aureoleAnchor.radius * 0.972
      const aureoleRadiusX = aureoleAnchor.radiusX *0.900
      const aureoleRadiusY = aureoleAnchor.radiusY * 0.950

      // 👇 ADD THIS — create flames at base
      const flames = createFlames(scene, modelBaseY)
      updateFlames = flames.updateFlames

      const moon = createMoon(scene, {
        center: aureoleCenter.clone().add(new THREE.Vector3(0, 0, -1.75)),
        ringRadius: aureoleRadius,
      })
      updateMoon = moon.updateMoon
      startIntroSequence()
      const halo = createHalo(scene, {
        center: aureoleCenter.clone().add(new THREE.Vector3(0, 0, -0.78)),
        radius: aureoleRadius,
        radiusX: aureoleRadiusX,
        radiusY: aureoleRadiusY,
      })
      updateHalo = halo.updateHalo
      const particles = createParticles(scene)
      updateParticles = particles.updateParticles
      createScrollLighting(ambientLight, keyLight)
    })

    function startIntroSequence() {
      gsap.to(overlay, {
        opacity: 0, duration: 1.5, delay: 0.5,
        ease: 'power2.inOut',
        onComplete: () => { overlay.style.display = 'none' }
      })
      gsap.to(ambientLight, {
        intensity: 0.3, duration: 2, delay: 0.5
      })
    }

    let animationId: number
    let breathingStartTime = Date.now()
    function animate() {
      animationId = requestAnimationFrame(animate)
      // controls.update()

      // 👇 ADD THIS — pass current time to flame flicker
      if (updateFlames) {
        updateFlames(performance.now() * 0.001)
      }
      if (updateMoon) {
  updateMoon(performance.now() * 0.001)
}
      if (updateHalo) {
  updateHalo(performance.now() * 0.001)
}
if (updateParticles) {
  updateParticles(performance.now() * 0.001)
}
// Camera breathing — gentle zoom in/out
const elapsed = (Date.now() - breathingStartTime) * 0.001
const breathe = Math.sin(elapsed * 0.4) * 0.2 // slow, subtle
camera.position.z = 6 + breathe
      renderer.render(scene, camera)
    }
    animate()

    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return (
    <>
      <div ref={overlayRef} className="fade-overlay" />
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh' }}
      />
    </>
  )
}