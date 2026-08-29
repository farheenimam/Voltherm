import React from 'react';
import { Link } from 'react-router-dom';
import LandingHero from '../components/LandingHero.jsx';
import LandingTrustBar from '../components/LandingTrustBar.jsx';
import siteRiskBefore from '../assets/images/site-risk-before.jpg';
import siteMitigatedAfter from '../assets/images/site-mitigated-after.jpg';
import {
  ArrowRight, ShieldAlert, Sun, Cpu, FileText, CheckCircle2,
  MapPin, Zap, Thermometer
} from 'lucide-react';

export default function Landing() {
  return (
    <main style={{ backgroundColor: '#0D0D11', color: '#FFFFFF', minHeight: '100vh' }}>
      {/* 1. Hero Section with Hero Image */}
      <LandingHero />

      {/* 2. Trust Bar */}
      <LandingTrustBar />

      {/* 3. Section 1: Visual Heat Evidence (site-risk-before.jpg) */}
      <section id="platform" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        alignItems: 'center',
        borderBottom: '1px solid var(--bg-border)'
      }}>
        <div style={{ maxWidth: 520 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--brand-orange)',
            textTransform: 'uppercase',
            marginBottom: 12
          }}>
            Site Intelligence, before commitment
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 3.2vw, 38px)',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.2,
            margin: '0 0 16px',
            letterSpacing: '-0.01em'
          }}>
            See the heat risk before it becomes downtime.
          </h2>
          <p style={{ fontSize: 15.5, color: '#c9ced1', lineHeight: 1.7, marginBottom: 24 }}>
            Turn shade, surface temperature, and seasonal exposure into a clear site decision. VoltShield gives
            infrastructure teams the visual evidence to build with confidence using FortyGuard's 10m urban temperature model.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, fontSize: 13.5, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--status-optimal)" />
              <span>Detects asphalt heat retention exceeding 35°C (95°F)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--status-optimal)" />
              <span>Calculates annual revenue lost to thermal throttling</span>
            </div>
          </div>

          <Link
            to="/portfolio"
            className="btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            Open Siting Portfolio <ArrowRight size={15} />
          </Link>
        </div>

        {/* Photo Panel: site-risk-before.jpg */}
        <div
          style={{
            height: 340,
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
            backgroundImage: `url(${siteRiskBefore})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(239, 68, 68, 0.15)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          <div style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: 'rgba(239, 68, 68, 0.9)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            padding: '5px 12px',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            UNMITIGATED THERMAL EXCEEDANCE
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '14px 18px',
            background: 'linear-gradient(to top, rgba(13, 13, 17, 0.95) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 12, color: '#fecaca', fontWeight: 600 }}>
              FortyGuard LTM Thermal Anomaly: +8.4°F Above Ambient
            </span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--status-critical)' }}>
              TSS 42
            </span>
          </div>
        </div>
      </section>

      {/* 4. Section 2: Resilient Mitigation Design (site-mitigated-after.jpg) */}
      <section id="solutions" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 24px',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 48,
        alignItems: 'center',
        borderBottom: '1px solid var(--bg-border)'
      }}>
        {/* Photo Panel: site-mitigated-after.jpg */}
        <div
          style={{
            height: 340,
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
            backgroundImage: `url(${siteMitigatedAfter})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
            position: 'relative',
            overflow: 'hidden',
            order: 1
          }}
        >
          <div style={{
            position: 'absolute',
            top: 14,
            left: 14,
            backgroundColor: 'rgba(16, 185, 129, 0.9)',
            color: '#fff',
            fontSize: 11,
            fontWeight: 800,
            padding: '5px 12px',
            borderRadius: 6,
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
          }}>
            BIFACIAL SOLAR CANOPY APPLIED
          </div>

          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '14px 18px',
            background: 'linear-gradient(to top, rgba(13, 13, 17, 0.95) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 12, color: '#a7f3d0', fontWeight: 600 }}>
              Direct GHI Radiation Cut by 85% &bull; +$9,400/yr Saved
            </span>
            <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--status-optimal)' }}>
              TSS 88 (+46)
            </span>
          </div>
        </div>

        {/* Right Text Content */}
        <div style={{ maxWidth: 520, order: 2 }}>
          <div style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--brand-orange)',
            textTransform: 'uppercase',
            marginBottom: 12
          }}>
            Plan for every season
          </div>
          <h2 style={{
            fontSize: 'clamp(26px, 3.2vw, 38px)',
            fontWeight: 800,
            color: '#FFFFFF',
            lineHeight: 1.2,
            margin: '0 0 16px',
            letterSpacing: '-0.01em'
          }}>
            Design resilience into every charging site.
          </h2>
          <p style={{ fontSize: 15.5, color: '#c9ced1', lineHeight: 1.7, marginBottom: 24 }}>
            Overlay bifacial solar canopies, cool reflective sealcoats, and perimeter shade buffers directly onto satellite stalls.
            VoltShield recalculates your Thermal Siting Score and proves compliance with the federal NEVI 97% uptime requirement.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 28, fontSize: 13.5, color: 'var(--text-muted)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--status-optimal)" />
              <span>Cuts annual thermal derating hours by up to 89%</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle2 size={16} color="var(--status-optimal)" />
              <span>Payback period estimated at 1.7 years on canopy CAPEX</span>
            </div>
          </div>

          <Link
            to="/editor/site_001"
            className="btn-secondary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          >
            Launch Mitigation Design Canvas <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      {/* 5. The 4 System Pillars Grid */}
      <section id="compliance" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '80px 24px'
      }}>
        <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 48px' }}>
          <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 12px' }}>
            The Full-Stack Siting Intelligence Platform
          </h2>
          <p style={{ fontSize: 15, color: 'var(--text-muted)' }}>
            Everything infrastructure engineers need to audit, design, and certify resilient EV charging hubs.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {/* Card 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,107,0,0.12)', border: '1px solid var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Thermometer size={20} color="var(--brand-orange)" />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>FortyGuard 10m LTM</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Hyperlocal urban heat intelligence mapping surface albedo absorption and heat exceedance zones.
            </p>
          </div>

          {/* Card 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(16,185,129,0.12)', border: '1px solid var(--status-optimal)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color="var(--status-optimal)" />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>TSS Scorecard (0–100)</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Defensible mathematical standard calculating heat penalty, shade deficit, and cooling limits.
            </p>
          </div>

          {/* Card 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(59,130,246,0.12)', border: '1px solid #3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Cpu size={20} color="#3B82F6" />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>Groq AI Copilot</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Real-time engineering agent answering questions on canopy sizing, cooling retrofits, and utility tariffs.
            </p>
          </div>

          {/* Card 4 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: 'rgba(255,107,0,0.12)', border: '1px solid var(--brand-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={20} color="var(--brand-orange)" />
            </div>
            <h4 style={{ fontSize: 16, fontWeight: 800, color: '#fff', margin: 0 }}>NEVI 97% SLA PDF</h4>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5, margin: 0 }}>
              Official compliance audit letterhead with PE certification blocks ready for state DOT grant awards.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Big Bottom Call-to-Action */}
      <section style={{
        padding: '88px 0',
        textAlign: 'center',
        borderTop: '1px solid var(--bg-border)',
        background: 'radial-gradient(ellipse 60% 40% at 50% 100%, rgba(255,107,0,0.08), transparent 70%), #111216'
      }}>
        <div style={{ maxWidth: 680, margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{ fontSize: 'clamp(30px, 3.8vw, 44px)', fontWeight: 900, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.02em' }}>
            Ready to Audit Your Charging Network?
          </h2>
          <p style={{ fontSize: 16, color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: 32 }}>
            Open the live VoltShield Command Center now. Explore candidate sites across Phoenix, Dallas, and Seattle with real FortyGuard telemetry.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            <Link
              to="/portfolio"
              className="btn-primary"
              style={{
                fontSize: 15.5,
                padding: '15px 32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none'
              }}
            >
              Launch Command Center Now <ArrowRight size={17} />
            </Link>
            <Link
              to="/grid"
              className="btn-secondary"
              style={{
                fontSize: 15.5,
                padding: '15px 24px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none'
              }}
            >
              <MapPin size={17} color="var(--brand-orange)" /> Explore Global Grid Map
            </Link>
          </div>
        </div>
      </section>

      {/* 7. Footer */}
      <footer style={{
        borderTop: '1px solid var(--bg-border)',
        padding: '28px 0',
        backgroundColor: '#0D0D11',
        fontSize: 12,
        color: 'var(--text-dark)'
      }}>
        <div style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              backgroundColor: '#16171C',
              border: '1px solid var(--brand-orange)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Zap size={12} color="var(--brand-orange)" />
            </div>
            <span style={{ fontWeight: 800, color: '#fff' }}>VOLTSHIELD</span>
            <span>&bull; Climate-Resilient EV Siting Intelligence</span>
          </div>

          <div>
            Built for FortyGuard Urban Heat Hackathon 2026
          </div>
        </div>
      </footer>
    </main>
  );
}
