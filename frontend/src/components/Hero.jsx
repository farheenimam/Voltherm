import { Link } from 'react-router-dom';

export default function Hero() {
  return (
    <section
      style={{
        position: 'relative',
        overflow: 'hidden',
        borderBottom: '1px solid var(--line)',
        background:
          'radial-gradient(ellipse 60% 50% at 85% 20%, rgba(57,217,122,.08), transparent 60%), var(--charcoal)',
      }}
    >
      <header className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="30" height="30" viewBox="0 0 30 30">
            <rect width="30" height="30" rx="7" fill="#39D97A" />
            <path d="M16 4 L8.5 16.5 H13.5 L12.5 26 L21.5 12.5 H16.5 L16 4 Z" fill="#141416" />
          </svg>
          <span style={{ fontWeight: 700, letterSpacing: '0.05em', color: '#fff' }}>VOLTHERM</span>
        </Link>

        <nav style={{ display: 'flex', gap: 32, fontSize: 14, color: '#c9ced1' }} className="hero-nav">
          <a href="#platform">Platform</a>
          <a href="#solutions">Solutions</a>
          <Link to="/dashboard">Risk Map</Link>
          <a href="#company">Company</a>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <a href="#login" style={{ fontSize: 14, color: '#c9ced1' }}>
            Log in
          </a>
          <Link to="/dashboard" className="btn-primary" style={{ fontSize: 14, padding: '10px 18px' }}>
            Request Your Sites
          </Link>
        </div>
      </header>

      <div className="container" style={{ padding: '64px 24px 48px', display: 'grid', gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)', gap: 32, alignItems: 'center' }}>
        <div style={{ maxWidth: 620 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid rgba(107,114,128,.5)',
              background: 'rgba(20,20,22,.8)',
              fontSize: 11,
              color: '#9ca3af',
              marginBottom: 20,
            }}
          >
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Built on the FortyGuard Heat Intelligence API
            </span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)' }} />
          </div>

          <h1 style={{ fontSize: 'clamp(32px, 4.5vw, 52px)', fontWeight: 800, lineHeight: 1.08, color: '#fff', margin: '0 0 16px' }}>
            Eliminate EV Site Heat Risk.
            <br />
            In One Minute.
          </h1>

          <p style={{ fontSize: 16, color: '#c9ced1', lineHeight: 1.6, margin: '0 0 20px', maxWidth: 520 }}>
            A candidate site off I-95. 92% asphalt, zero shade, and no way to know it'll derate until it's
            already built. Voltherm's AI agents score it before you break ground.
          </p>

          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 12,
              borderRadius: 999,
              border: '1px solid rgba(239,68,68,.4)',
              background: 'rgba(239,68,68,.1)',
              padding: '10px 18px',
              marginBottom: 28,
            }}
          >
            <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.14em', color: '#fecaca', textTransform: 'uppercase' }}>TSS 72</span>
            <span style={{ width: 1, height: 16, background: 'rgba(248,113,113,.5)' }} />
            <span style={{ fontSize: 12, color: '#fca5a5' }}>Flagged by our agents — two fixes recommended</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <Link to="/dashboard" className="btn-primary">
              Screen a Site Now
            </Link>
            <a href="#platform" className="btn-secondary">
              See Platform Overview
            </a>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            height: 340,
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--line)',
            background:
              'radial-gradient(circle at 40% 30%, rgba(57,217,122,.12), transparent 55%), radial-gradient(circle at 70% 70%, rgba(59,167,224,.12), transparent 55%), var(--bg-2)',
          }}
        />
      </div>
    </section>
  );
}
