import { Link } from 'react-router-dom';
import Hero from '../components/Hero.jsx';
import TrustBar from '../components/TrustBar.jsx';

export default function Landing() {
  return (
    <main>
      <Hero />
      <TrustBar />

      <section id="platform" className="container" style={{ padding: '72px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 12 }}>
            Site Intelligence, before commitment
          </div>
          <h2 style={{ fontSize: 'clamp(24px, 3vw, 34px)', fontWeight: 700, color: '#fff', lineHeight: 1.2, margin: '0 0 16px' }}>
            See the heat risk before it becomes downtime.
          </h2>
          <p style={{ fontSize: 15, color: '#c9ced1', lineHeight: 1.7, marginBottom: 24 }}>
            Turn shade, surface temperature, and seasonal exposure into a clear site decision. Voltherm gives
            infrastructure teams the visual evidence to build with confidence.
          </p>
          <Link to="/dashboard" className="btn-secondary">
            Open the risk map →
          </Link>
        </div>
        <div
          className="panel"
          style={{ height: 280, background: 'radial-gradient(circle at 30% 30%, rgba(57,217,122,.1), transparent 60%)' }}
          aria-hidden="true"
        />
      </section>

      <section id="solutions" className="container" style={{ padding: '0 24px 88px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
        <div
          className="panel"
          style={{ height: 240, background: 'radial-gradient(circle at 70% 40%, rgba(59,167,224,.12), transparent 60%)', order: 1 }}
          aria-hidden="true"
        />
        <div>
          <div style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
            Plan for every season
          </div>
          <h2 style={{ fontSize: 'clamp(22px, 2.8vw, 30px)', fontWeight: 700, color: '#fff', margin: '0 0 16px' }}>
            Design resilience into every charging site.
          </h2>
          <div
            style={{
              display: 'inline-flex',
              gap: 12,
              alignItems: 'center',
              border: '1px solid var(--line)',
              borderRadius: 10,
              padding: '10px 16px',
              marginBottom: 16,
            }}
          >
            <strong style={{ color: 'var(--green)', fontSize: 13 }}>MITIGATED</strong>
            <span style={{ fontSize: 13, color: '#c9ced1' }}>TSS 94</span>
            <span style={{ fontSize: 13, color: '#c9ced1' }}>0 hrs/yr derating time</span>
          </div>
          <p style={{ fontSize: 15, color: '#c9ced1', lineHeight: 1.7 }}>
            Compare exposure across the year, identify likely derating conditions, and make mitigation part of
            the site plan before construction begins.
          </p>
        </div>
      </section>

      <footer id="company" style={{ borderTop: '1px solid var(--line)', padding: '32px 24px', textAlign: 'center', color: 'var(--muted)', fontSize: 12.5 }}>
        Voltherm — powered by the FortyGuard Heat Intelligence API.
      </footer>
    </main>
  );
}
