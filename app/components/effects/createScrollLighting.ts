import * as THREE from 'three'
import gsap from 'gsap'

export function createScrollLighting(
  ambientLight: THREE.AmbientLight,
  keyLight: THREE.DirectionalLight,
) {

  // Install GSAP ScrollTrigger
  const setupScroll = async () => {
    const { ScrollTrigger } = await import('gsap/ScrollTrigger')
    gsap.registerPlugin(ScrollTrigger)

    const nav = document.getElementById('main-nav')
    const heroText = document.getElementById('hero-text')

    // Show hero text after scene loads
    gsap.to(heroText, {
      opacity: 1,
      duration: 1.5,
      delay: 8.0,
      ease: 'power2.out'
    })

    // Scroll: lighting transitions from cinematic → product
    ScrollTrigger.create({
      trigger: '#scroll-wrapper',
      start: 'top top',
      end: '40% top',
      scrub: 1.5,         // smooth scrubbing
      onUpdate: (self) => {
        const p = self.progress // 0 to 1

        // Ambient light: 0.05 → 0.4
        ambientLight.intensity = 0.05 + p * 0.35

        // Key light: warm amber → soft white
        // Color interpolation: amber (1, 0.78, 0.47) → white (1, 0.97, 0.93)
        keyLight.color.setRGB(
          1.0,
          0.78 + p * 0.19,
          0.47 + p * 0.46
        )

        // Key light intensity: 2.5 → 1.2
        keyLight.intensity = 2.5 - p * 1.3

        // Moon + rays fade out as scroll progresses
        const moonEl = document.getElementById('moon-overlay')
        if (moonEl) moonEl.style.opacity = String(1 - p)
      }
    })

    // Nav fades in at 20% scroll
    ScrollTrigger.create({
      trigger: '#scroll-wrapper',
      start: '15% top',
      end: '20% top',
      scrub: 1,
      onUpdate: (self) => {
        if (nav) nav.style.opacity = String(self.progress)
      }
    })

    // Hero text fades out as user scrolls
    ScrollTrigger.create({
      trigger: '#scroll-wrapper',
      start: '5% top',
      end: '20% top',
      scrub: 1,
      onUpdate: (self) => {
        if (heroText) heroText.style.opacity = String(1 - self.progress)
      }
    })
  }

  setupScroll()
}