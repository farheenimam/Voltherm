import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin } from 'lucide-react';
import heroImage from '../assets/images/hero-charging-station.jpg';

export default function LandingHero() {
  return (
    <section style={{
      position: 'relative',
      overflow: 'hidden',
      borderBottom: '1px solid var(--bg-border)',
      background: 'radial-gradient(ellipse 70% 50% at 85% 20%, rgba(255, 107, 0, 0.08), transparent 60%), #0D0D11'
    }}>
      {/* Top Navigation */}
      <header className="container" style={{
        maxWidth: 1200,
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 24px'
      }}>
        {/* Brand Logo */}
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 12, textDecoration: 'none' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            backgroundColor: '#16171C',
            border: '2px solid var(--brand-orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 15px rgba(255, 107, 0, 0.35)'
          }}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d="M16 2.5L4.5 7.5V14.5C4.5 21.5 9.5 26.5 16 29.5C22.5 26.5 27.5 21.5 27.5 14.5V7.5L16 2.5Z" fill="#16171C" stroke="#FF6B00" strokeWidth="2.5"/>
              <path d="M17 9L11 16.5H16L15 23L21 15.5H16L17 9Z" fill="#FF6B00"/>
            </svg>
          </div>
          <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.05em', color: '#FFFFFF' }}>VOLTSHIELD</span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', gap: 32, fontSize: 14, color: 'var(--text-muted)', fontWeight: 500 }}>
          <a href="#platform" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Platform</a>
          <a href="#solutions" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Solutions</a>
          <Link to="/grid" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>Global Grid Map</Link>
          <a href="#compliance" style={{ color: 'inherit', textDecoration: 'none', transition: 'color 0.2s' }}>NEVI 97% SLA</a>
        </nav>

        {/* Single Primary Action Button */}
        <div>
          <Link
            to="/portfolio"
            className="btn-primary"
            style={{
              fontSize: 13.5,
              padding: '10px 20px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              textDecoration: 'none'
            }}
          >
            Launch Command Center <ArrowRight size={15} />
          </Link>
        </div>
      </header>

      {/* Hero Body Grid */}
      <div className="container" style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '56px 24px 72px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 7fr) minmax(0, 5fr)',
        gap: 40,
        alignItems: 'center'
      }}>
        {/* Left Text Content */}
        <div style={{ maxWidth: 620 }}>
          {/* Eyebrow Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '6px 14px',
            borderRadius: 999,
            border: '1px solid var(--bg-border)',
            background: 'rgba(22, 23, 28, 0.8)',
            fontSize: 11.5,
            color: 'var(--text-muted)',
            marginBottom: 20
          }}>
            <span style={{ textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>
              Built on FortyGuard Heat Intelligence API
            </span>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-orange)' }} />
          </div>

          {/* Main Headline */}
          <h1 style={{
            fontSize: 'clamp(34px, 4.5vw, 54px)',
            fontWeight: 800,
            lineHeight: 1.08,
            color: '#FFFFFF',
            margin: '0 0 18px',
            letterSpacing: '-0.02em'
          }}>
            Eliminate EV Site Heat Risk. <br />
            <span style={{ color: 'var(--brand-orange)' }}>In One Minute.</span>
          </h1>

          {/* Description */}
          <p style={{
            fontSize: 16,
            color: '#c9ced1',
            lineHeight: 1.65,
            margin: '0 0 24px',
            maxWidth: 520
          }}>
            A candidate site on 92% asphalt with zero shade can experience 380+ hours of summer thermal derating. 
            VoltShield's AI copilot scores microclimate resilience and designs solar canopy mitigations before you break ground.
          </p>

          {/* Risk Alert Pill */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            borderRadius: 999,
            border: '1px solid rgba(239, 68, 68, 0.4)',
            background: 'rgba(239, 68, 68, 0.1)',
            padding: '10px 18px',
            marginBottom: 28
          }}>
            <span style={{
              fontSize: 12,
              fontWeight: 800,
              letterSpacing: '0.12em',
              color: '#fca5a5',
              textTransform: 'uppercase'
            }} className="mono">
              TSS 42 / CRITICAL
            </span>
            <span style={{ width: 1, height: 16, background: 'rgba(248, 113, 113, 0.4)' }} />
            <span style={{ fontSize: 12, color: '#fecaca', fontWeight: 500 }}>
              Flagged by FortyGuard LTM &bull; Solar canopy upgrade recommended
            </span>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            <Link
              to="/portfolio"
              className="btn-primary"
              style={{
                fontSize: 15,
                padding: '13px 26px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none'
              }}
            >
              Launch Command Center <ArrowRight size={16} />
            </Link>
            <Link
              to="/grid"
              className="btn-secondary"
              style={{
                fontSize: 15,
                padding: '13px 22px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                textDecoration: 'none'
              }}
            >
              <MapPin size={16} color="var(--brand-orange)" /> Explore Global Grid Map
            </Link>
          </div>
        </div>

        {/* Right Professional Hero Photo Panel */}
        <div
          aria-label="High-power EV charging infrastructure"
          style={{
            height: 380,
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
            backgroundImage: `url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(255, 107, 0, 0.12)',
            position: 'relative',
            overflow: 'hidden'
          }}
        >
          {/* Bottom glass gradient overlay */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '16px 20px',
            background: 'linear-gradient(to top, rgba(13, 13, 17, 0.92) 0%, transparent 100%)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end'
          }}>
            <div>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand-orange)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                LIVE SITING SIMULATION
              </span>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#FFFFFF' }}>
                Phoenix Corridor &bull; Sector 4B
              </div>
            </div>
            <div style={{
              backgroundColor: 'rgba(22, 23, 28, 0.85)',
              border: '1px solid var(--bg-border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--status-optimal)'
            }}>
              NEVI 97% READY
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
