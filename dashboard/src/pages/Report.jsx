import React, { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Printer, ArrowLeft, ShieldCheck, AlertTriangle, CheckCircle, Download, FileText } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setMapTileLayer, createOrangeLocationPin } from '../utils/mapConfig.js';

export default function Report({ sites }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const site = sites.find(s => s.site_id === id) || sites[0];

  useEffect(() => {
    if (!site || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: false
    }).setView([site.latitude, site.longitude], 17);

    mapInstanceRef.current = map;

    // Use ESRI satellite aerial for formal GIS audit documentation
    setMapTileLayer(map, 'esriSatellite');

    // Add site marker
    const pin = createOrangeLocationPin();
    L.marker([site.latitude, site.longitude], { icon: pin }).addTo(map);

    // Add simulated FortyGuard thermal exceedance contours
    L.circle([site.latitude + 0.0001, site.longitude - 0.0001], {
      color: '#EF4444',
      fillColor: '#EF4444',
      fillOpacity: 0.35,
      radius: 40
    }).addTo(map);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [site]);

  if (!site) return <div>Site not found.</div>;

  const handlePrint = () => {
    window.print();
  };

  const isCritical = site.metrics.thermal_siting_score < 50;
  const isOptimal = site.metrics.thermal_siting_score >= 75;
  const statusColor = isCritical ? '#DC2626' : (isOptimal ? '#059669' : '#D97706');
  const statusText = isCritical ? 'CRITICAL DERATING RISK' : (isOptimal ? 'NEVI 97% UPTIME COMPLIANT' : 'MEDIUM THERMAL RISK');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#E2E8F0',
      padding: '40px 16px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 20
    }}>
      {/* Exporter Toolbar (Hidden during browser print) */}
      <div style={{
        maxWidth: 860,
        width: '100%',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px'
      }} className="no-print">
        <button
          onClick={() => navigate(`/sandbox/${site.site_id}`)}
          style={{
            backgroundColor: '#FFFFFF',
            color: '#1E293B',
            border: '1px solid #CBD5E1',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
          }}
        >
          <ArrowLeft size={16} /> Back to Analysis
        </button>

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={handlePrint}
            style={{
              backgroundColor: '#FF6B00',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 8,
              padding: '10px 22px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(255, 107, 0, 0.3)'
            }}
          >
            <Printer size={16} /> Print / Save as PDF
          </button>
        </div>
      </div>

      {/* A4 Clean Letterhead Sheet matching Screen 11 reference */}
      <div className="print-page" style={{
        maxWidth: 860,
        width: '100%',
        backgroundColor: '#FFFFFF',
        color: '#0F172A',
        borderRadius: 8,
        padding: '56px 48px',
        boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        fontFamily: "'Inter', sans-serif"
      }}>
        
        {/* Document Header with VoltShield Brand */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          borderBottom: '3px solid #0F172A',
          paddingBottom: 20
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 2.5L4.5 7.5V14.5C4.5 21.5 9.5 26.5 16 29.5C22.5 26.5 27.5 21.5 27.5 14.5V7.5L16 2.5Z" fill="#0F172A" stroke="#FF6B00" strokeWidth="2"/>
                <path d="M17 9L11 16.5H16L15 23L21 15.5H16L17 9Z" fill="#FF6B00"/>
              </svg>
              <span style={{ fontWeight: 900, fontSize: 22, letterSpacing: '0.05em', color: '#0F172A' }}>VOLTSHIELD</span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.01em', margin: '4px 0 0 0', color: '#0F172A' }}>
              NEVI COMPLIANCE AUDIT & THERMAL RESILIENCE CERTIFICATION
            </h1>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>
              FortyGuard Urban Temperature Intelligence Integration &bull; 23 CFR Part 680 Verification
            </span>
          </div>

          <div style={{ textAlign: 'right', fontSize: 11, color: '#475569', lineHeight: 1.6 }}>
            <div><strong>AUDIT ID:</strong> VS-2026-{site.site_id.toUpperCase()}-NEVI</div>
            <div><strong>DATE ISSUED:</strong> OCTOBER 24, 2026</div>
            <div><strong>PROGRAM:</strong> NATIONAL ELECTRIC VEHICLE INFRASTRUCTURE</div>
            <div><strong>PREPARED FOR:</strong> CHARGE POINT OPERATOR / STATE DOT</div>
          </div>
        </header>

        {/* Executive Summary & TSS Score Split Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 28, alignItems: 'stretch' }}>
          
          {/* Site Particulars Table */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
              PARCEL & HARDWARE PROFILE
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 12.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                <span style={{ color: '#64748B' }}>Site Designation:</span>
                <strong style={{ color: '#0F172A' }}>{site.site_name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                <span style={{ color: '#64748B' }}>Geographic Coordinates:</span>
                <strong style={{ color: '#0F172A', fontFamily: 'monospace' }}>{site.latitude}° N, {site.longitude}° W</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                <span style={{ color: '#64748B' }}>Surface Material / Albedo:</span>
                <strong style={{ color: '#0F172A' }}>{site.surface_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F1F5F9', paddingBottom: 4 }}>
                <span style={{ color: '#64748B' }}>Dispensers & Cooling:</span>
                <strong style={{ color: '#0F172A' }}>{site.stall_count} Stalls &bull; {site.cooling_type}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748B' }}>Peak Historical Ambient:</span>
                <strong style={{ color: '#0F172A' }}>{site.peak_ambient_f}° F</strong>
              </div>
            </div>
          </div>

          {/* Audit TSS Rating Badge */}
          <div style={{
            backgroundColor: '#F8FAFC',
            border: `2px solid ${statusColor}`,
            borderRadius: 10,
            padding: '20px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            textAlign: 'center'
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B', letterSpacing: '0.1em' }}>
              THERMAL SITING SCORE (TSS)
            </span>
            <span style={{
              fontSize: 52,
              fontWeight: 900,
              color: statusColor,
              fontFamily: "'JetBrains Mono', monospace",
              lineHeight: 1
            }}>
              {site.metrics.thermal_siting_score}
            </span>
            <span style={{
              fontSize: 11,
              fontWeight: 800,
              color: statusColor,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              {statusText}
            </span>
            <span style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
              Minimum 75.0 required for unconditional NEVI compliance
            </span>
          </div>
        </div>

        {/* Thermal Risk Mapping Section with Live Satellite Map */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
            HYPERLOCAL URBAN HEAT ISLAND OVERLAY (10M RESOLUTION)
          </h4>
          
          <div style={{
            height: 220,
            borderRadius: 8,
            border: '1px solid #E2E8F0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

            <div style={{
              position: 'absolute',
              top: 12,
              right: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #CBD5E1',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 11,
              fontWeight: 700,
              color: '#0F172A',
              zIndex: 1000
            }}>
              FortyGuard LTM Thermal Anomaly: +8.4°F Above Baseline
            </div>
          </div>

          <p style={{ fontSize: 12, color: '#475569', lineHeight: 1.5 }}>
            Telemetry derived from FortyGuard's Large Temperature Model indicates this parcel is subject to <strong>{site.metrics.annual_derating_hours} annual hours of thermal derating</strong> (&gt;35°C / 95°F). Under unmitigated ambient conditions, fast chargers will curtail output power by 40–50% to prevent internal inverter failure, violating NEVI's mandatory 97% uptime SLA.
          </p>
        </div>

        {/* Financial & Uptime Impact Breakdown */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div style={{
            backgroundColor: '#FEF2F2',
            border: '1px solid #FECACA',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#991B1B' }}>UNMITIGATED ANNUAL LOSS</span>
            <strong style={{ fontSize: 24, color: '#DC2626', fontFamily: 'monospace' }}>
              -${site.metrics.estimated_revenue_loss_usd.toLocaleString()}/yr
            </strong>
            <span style={{ fontSize: 11, color: '#7F1D1D', lineHeight: 1.4 }}>
              Calculated across {site.metrics.annual_derating_hours} throttled hours and regional utility tariffs.
            </span>
          </div>

          <div style={{
            backgroundColor: '#ECFDF5',
            border: '1px solid #A7F3D0',
            borderRadius: 8,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#065F46' }}>PROJECTED MITIGATED RECOVERY</span>
            <strong style={{ fontSize: 24, color: '#059669', fontFamily: 'monospace' }}>
              +${Math.round(site.metrics.estimated_revenue_loss_usd * 0.82).toLocaleString()}/yr
            </strong>
            <span style={{ fontSize: 11, color: '#064E3B', lineHeight: 1.4 }}>
              With installation of 45kW solar canopy and cool pavement sealcoat.
            </span>
          </div>
        </div>

        {/* Proposed Engineering Mitigation Actions Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <h4 style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: '#64748B', borderBottom: '1px solid #E2E8F0', paddingBottom: 6 }}>
            RECOMMENDED ENGINEERING MITIGATION SPECIFICATIONS
          </h4>
          
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 700, fontSize: 11 }}>
                <th style={{ padding: '8px 12px' }}>MITIGATION ACTION</th>
                <th style={{ padding: '8px 12px' }}>TSS BENEFIT</th>
                <th style={{ padding: '8px 12px' }}>EST. CAPEX</th>
                <th style={{ padding: '8px 12px' }}>ANNUAL SAVINGS</th>
                <th style={{ padding: '8px 12px', textAlign: 'right' }}>PAYBACK</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>45kW Bifacial Solar Canopy over Stalls 1–8</td>
                <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 700 }}>+24 PTS</td>
                <td style={{ padding: '10px 12px' }}>$16,000</td>
                <td style={{ padding: '10px 12px', color: '#059669' }}>$8,400/yr</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>1.9 Years</td>
              </tr>
              <tr style={{ borderBottom: '1px solid #F1F5F9' }}>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Cool Reflective Polymer Sealcoat (Albedo 0.75)</td>
                <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 700 }}>+12 PTS</td>
                <td style={{ padding: '10px 12px' }}>$2,800</td>
                <td style={{ padding: '10px 12px', color: '#059669' }}>$2,100/yr</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>1.3 Years</td>
              </tr>
              <tr>
                <td style={{ padding: '10px 12px', fontWeight: 600 }}>Perimeter Vegetative Shade Buffer (Live Tree Row)</td>
                <td style={{ padding: '10px 12px', color: '#059669', fontWeight: 700 }}>+8 PTS</td>
                <td style={{ padding: '10px 12px' }}>$3,500</td>
                <td style={{ padding: '10px 12px', color: '#059669' }}>$950/yr</td>
                <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 700 }}>3.6 Years</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* NEVI Certification Signature Block */}
        <div style={{
          borderTop: '2px solid #0F172A',
          paddingTop: 18,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          fontSize: 11,
          color: '#475569'
        }}>
          <div>
            <span style={{ fontWeight: 800, color: '#0F172A', display: 'block', marginBottom: 4 }}>
              NEVI 23 CFR PART 680 CERTIFICATION STATEMENT
            </span>
            I hereby certify that the candidate site evaluated herein has undergone formal micro-climate thermal screening under FortyGuard LTM standards and meets preliminary resilience criteria for NEVI funding award consideration upon execution of the recommended mitigation canopy.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #94A3B8', paddingBottom: 4 }}>
              <span>AUDIT ENGINEER: Mara Velasquez, PE</span>
              <span>LIC # 8841-AZ</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>SIGNATURE: <em>M. Velasquez</em></span>
              <span>DATE: 10/24/2026</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
