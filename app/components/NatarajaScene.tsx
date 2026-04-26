'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export default function NatarajaScene() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // 1. RENDERER — this draws everything onto the canvas
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true
    })
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(window.devicePixelRatio)
    renderer.shadowMap.enabled = true

    // 2. SCENE — like an empty stage
    const scene = new THREE.Scene()

    // 3. CAMERA — the eye looking at the stage
    const camera = new THREE.PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    )
    camera.position.set(0, 0, 6)

    // 4. LIGHTS — so the model is visible
    const ambientLight = new THREE.AmbientLight(0xffeedd, 0.3)
    scene.add(ambientLight)

    const keyLight = new THREE.DirectionalLight(0xffc878, 2.5)
    keyLight.position.set(-2, 3, 2)
    scene.add(keyLight)

    // 5. ORBIT CONTROLS — lets you rotate with mouse (for testing)
    const controls = new OrbitControls(camera, canvas)
    controls.enableDamping = true
    controls.dampingFactor = 0.05

    // 6. LOAD YOUR MODEL
    const loader = new GLTFLoader()
    loader.load(
      '/models/nataraja.glb',
      (gltf) => {
        const model = gltf.scene

        // Center the model
        const box = new THREE.Box3().setFromObject(model)
        const center = box.getCenter(new THREE.Vector3())
        model.position.sub(center)

        // Scale it to fit the screen nicely
        const size = box.getSize(new THREE.Vector3())
        const maxDim = Math.max(size.x, size.y, size.z)
        const scale = 3 / maxDim
        model.scale.setScalar(scale)

        scene.add(model)
        console.log('✅ Model loaded!')
      },
      (progress) => {
        console.log('Loading...', Math.round(progress.loaded / progress.total * 100) + '%')
      },
      (error) => {
        console.error('❌ Model failed to load:', error)
      }
    )

    // 7. ANIMATION LOOP — runs 60 times per second
    let animationId: number
    function animate() {
      animationId = requestAnimationFrame(animate)
      controls.update()
      renderer.render(scene, camera)
    }
    animate()

    // 8. HANDLE WINDOW RESIZE
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', onResize)

    // 9. CLEANUP when component unmounts
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', onResize)
      renderer.dispose()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
      }}
    />
  )
}