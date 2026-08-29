import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft } from 'lucide-react';

export default function Report({ sites }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const site = sites.find(s => s.site_id === id) || sites[0];

  if (!site) return <div>Site not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const isCritical = site.metrics.thermal_siting_score < 50;
  const isOptimal = site.metrics.thermal_siting_score >= 80;
  const statusColor = isCritical ? '#EF4444' : (isOptimal ? '#10B981' : '#F59E0B');
  const statusText = isCritical ? 'CRITICAL FAIL' : (isOptimal ? 'OPTIMAL RESILIENCE' : 'WARNING / MED RISK');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E2E8F0', // Light background outside the sheet
      padding: '40px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20
    }}>
      {/* Exporter Toolbar (hidden when printing) */}
      <div style={{
        maxWidth: 800,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px'
      }} className="no-print">
        <button
          onClick={() => navigate(`/sandbox/${site.site_id}`)}
          style={{
            backgroundColor: '#fff',
            color: '#1E293B',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '10px 16px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <ArrowLeft size={16} /> Back to Sandbox
        </button>
        <button
          onClick={handlePrint}
          style={{
            backgroundColor: '#1E293B',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}
        >
          <Printer size={16} /> Print to PDF
        </button>
      </div>

      {/* The Printable A4 Sheet matching Page 5 of PDF */}
      <div style={{
        width: '100%',
        maxWidth: 800,
        backgroundColor: '#FFFFFF',
        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
        padding: '60px 48px',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        gap: 36,
        fontFamily: "'Inter', sans-serif"
      }} className="print-area">
        
        {/* Brand Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '2px solid #E2E8F0',
          paddingBottom: 24
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.5L4.5 7.5V14.5C4.5 21.5 9.5 26.5 16 29.5C22.5 26.5 27.5 21.5 27.5 14.5V7.5L16 2.5Z" fill="#FFFFFF" stroke="#FF6B00" stroke-width="2.5"/>
                <path d="M17 9L11 16.5H16L15 23L21 15.5H16L17 9Z" fill="#FF6B00"/>
              </svg>
              <span style={{ fontWeight: 800, fontSize: 18, letterSpacing: '0.05em', color: '#0F172A' }}>VoltShield</span>
            </div>
            <h1 style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.02em', margin: '8px 0 0 0' }}>NEVI COMPLIANCE AUDIT</h1>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>Thermal Resilience & Uptime Certification</span>
          </div>

          <div style={{ textAlign: 'right', fontSize: 11, color: '#475569', lineHeight: 1.5 }}>
            <div>REPORT ID: VS-2026-{site.site_id.split('_')[-1]?.toUpperCase() || '8841'}-A</div>
            <div>DATE GENERATED: OCTOBER 24, 2026</div>
            <div style={{ fontWeight: 700, color: '#0F172A', marginTop: 4 }}>PREPARED FOR: ELECTRIFY AMERICA</div>
          </div>
        </header>

        {/* Site Particulars & Score card Split grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32 }}>
          {/* Site Particulars Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
              SITE PARTICULARS
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Location Name</span>
                <strong style={{ color: '#0F172A' }}>{site.site_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Coordinates</span>
                <strong style={{ color: '#0F172A' }}>{site.latitude.toFixed(4)}° N, {Math.abs(site.longitude).toFixed(4)}° W</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Surface Type</span>
                <strong style={{ color: '#0F172A' }}>{site.surface_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#475569' }}>Peak Ambient</span>
                <strong style={{ color: '#0F172A' }}>{site.peak_ambient_f}° F (Historical Max)</strong>
              </div>
            </div>
          </div>

          {/* Rating Card */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 8,
            padding: 24,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.1em' }}>AUDIT TSS RATING</span>
            <span style={{ fontSize: 48, fontWeight: 900, color: statusColor, fontFamily: "'JetBrains Mono', monospace" }}>
              {site.metrics.thermal_siting_score}
            </span>
            <span style={{ fontSize: 11, fontWeight: 800, color: statusColor, letterSpacing: '0.05em' }}>
              {statusText}
            </span>
          </div>
        </div>

        {/* Heat Island Analysis map card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
            THERMAL RISK MAPPING
          </h4>
          <div style={{
            height: 220,
            borderRadius: 8,
            backgroundImage: `url("https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=800&h=300&q=80")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Visual Heatmap Overlay */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'radial-gradient(circle at 45% 45%, rgba(239,68,68,0.4) 20%, transparent 60%)',
              pointerEvents: 'none'
            }} />
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              backgroundColor: '#FFFFFF',
              color: '#0F172A',
              border: '1px solid #CBD5E1',
              borderRadius: 4,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.05em'
            }}>
              HEAT ISLAND ANALYSIS OVERLAY
            </div>
          </div>
          <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5 }}>
            Based on FortyGuard's 10m-resolution urban heat APIs, this site exhibits significant thermal retention. Internal charger temperatures are projected to exceed safety thresholds for an average of **{site.metrics.annual_derating_hours / 90 ? (site.metrics.annual_derating_hours / 90).toFixed(1) : '4.2'} hours per day** during June–August, leading to a **50% reduction in peak charging speed**.
          </p>
        </div>

        {/* Economic impact and mitigations split card */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 32 }}>
          {/* Economic Loss info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
              ECONOMIC IMPACT
            </h4>
            <div style={{
              backgroundColor: '#FFF5F5',
              border: '1px solid #FED7D7',
              borderRadius: 8,
              padding: 20,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <span style={{ fontSize: 11, color: '#C53030', fontWeight: 600 }}>Estimated Revenue Loss</span>
              <strong style={{ fontSize: 24, color: '#C53030', fontFamily: "'JetBrains Mono', monospace" }}>
                -${site.metrics.estimated_revenue_loss_usd.toLocaleString()}/yr
              </strong>
              <span style={{ fontSize: 11, color: '#742A2A', lineHeight: 1.4 }}>
                Losses calculated based on 15% thermal derating uptime and average regional utility margins.
              </span>
            </div>
          </div>

          {/* Mitigations */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.05em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
              PROPOSED MITIGATION
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                  marginTop: 2
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>PHASE 1: SOLAR CANOPY</span>
                  <span style={{ fontSize: 11.5, color: '#475569' }}>Reduces stall ground temp by ~15°F.</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  backgroundColor: '#10B981',
                  marginTop: 2
                }} />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>PHASE 2: HIGH-ALBEDO COATING</span>
                  <span style={{ fontSize: 11.5, color: '#475569' }}>Paint asphalt with reflective cool-seal.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer style={{
          marginTop: 'auto',
          borderTop: '1px solid #E2E8F0',
          paddingTop: 16,
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 10,
          color: '#64748B',
          fontWeight: 600
        }}>
          <span>VERIFIED BY VOLTSHIELD AI ENGINE V2.4</span>
          <span>PAGE 1 OF 4</span>
        </footer>
      </div>

      {/* Styles injection to handle print view constraints */}
      <style>{`
        @media print {
          body {
            background-color: #FFFFFF !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-area {
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
