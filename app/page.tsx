import NatarajaSceneClient from './components/NatarajaSceneClient'

export default function Home() {
  return (
    <>
      {/* NAVBAR — fixed at top, starts invisible */}
      <nav id="main-nav" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        opacity: 0,
        padding: '1.2rem 2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        background: 'rgba(10, 8, 4, 0.6)',
        backdropFilter: 'blur(12px)',
        borderBottom: '0.5px solid rgba(255, 180, 60, 0.15)',
        transition: 'opacity 0.5s ease',
      }}>
        <span style={{
          color: '#FFD080',
          fontSize: '1.1rem',
          fontWeight: 600,
          letterSpacing: '0.08em',
          fontFamily: 'serif'
        }}>
          LayaSpandana
        </span>
        <div style={{ display: 'flex', gap: '2rem' }}>
          {['About', 'Login', 'Signup'].map(item => (
            <a key={item} href="#" style={{
              color: 'rgba(255,220,140,0.7)',
              textDecoration: 'none',
              fontSize: '0.85rem',
              letterSpacing: '0.06em',
            }}>
              {item}
            </a>
          ))}
        </div>
      </nav>

      {/* SCROLL WRAPPER — tall div creates scroll space */}
      <div id="scroll-wrapper" style={{ height: '250vh' }}>

        {/* 3D SCENE — sticky so it stays on screen while scrolling */}
        <div style={{
          position: 'sticky',
          top: 0,
          height: '100vh',
          width: '100%',
        }}>
          <NatarajaSceneClient />
        </div>

      </div>

      {/* HERO TEXT */}
      <div id="hero-text" style={{
        position: 'fixed',
        bottom: '8vh',
        left: 0,
        right: 0,
        textAlign: 'center',
        zIndex: 50,
        opacity: 0,
        pointerEvents: 'none',
      }}>
        <p style={{
          color: 'rgba(255, 210, 120, 0.6)',
          fontSize: '0.75rem',
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom: '0.75rem',
          fontFamily: 'sans-serif',
        }}>
          AI · Bharatanatyam · Tala Detection
        </p>
        <h1 style={{
          color: '#FFE8A0',
          fontSize: 'clamp(2rem, 5vw, 3.5rem)',
          fontWeight: 300,
          letterSpacing: '0.04em',
          fontFamily: 'serif',
          lineHeight: 1.2,
          marginBottom: '1rem',
        }}>
          Laya Spandana
        </h1>
        <p style={{
          color: 'rgba(255, 200, 100, 0.5)',
          fontSize: '0.9rem',
          letterSpacing: '0.08em',
          fontFamily: 'sans-serif',
        }}>
          Scroll to explore
        </p>
      </div>

      {/* PRODUCT SECTION */}
      <div id="product-section" style={{
        position: 'relative',
        zIndex: 10,
        background: 'rgba(20, 18, 12, 0.8)',
        padding: '1rem 2rem',
        textAlign: 'center',
      }}>
        <h2 style={{
          color: '#FFD080',
          fontSize: 'clamp(1.5rem, 3vw, 2.5rem)',
          fontWeight: 300,
          fontFamily: 'serif',
          marginBottom: '1rem',
        }}>
          Detect | Analyze | Understand.
        </h2>
        <p style={{
          color: 'rgba(255,200,100,0.6)',
          maxWidth: '500px',
          margin: '0 auto',
          lineHeight: 1.8,
          fontSize: '0.95rem',
        }}>
          Our AI listens to Bharatanatyam performances and identifies
          tala patterns in real time — bridging ancient rhythm with
          modern intelligence.
        </p>
        <button style={{
          marginTop: '1.75rem',
          padding: '0.85rem 1.75rem',
          borderRadius: '999px',
          border: '1px solid rgba(255, 194, 92, 0.45)',
          background: 'rgba(255, 194, 92, 0.12)',
          color: '#FFD88A',
          fontSize: '0.85rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          cursor: 'pointer',
        }}>
          Get Started
        </button>
      </div>
    </>
  )
}