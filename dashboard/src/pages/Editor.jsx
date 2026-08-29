import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Sun, TreePine, Paintbrush, Zap, Check, ShieldCheck, Layers } from 'lucide-react';
import { simulateMitigations } from '../mockData.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setMapTileLayer } from '../utils/mapConfig.js';

export default function Editor({ sites, onUpdateSite }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const site = sites.find(s => s.site_id === id) || sites[0];

  const [activeTab, setActiveTab] = useState('Design');
  const [selectedMitigations, setSelectedMitigations] = useState([
    { type: 'Solar Canopy', coverage_pct: 100 }
  ]);
  const [coveredStalls, setCoveredStalls] = useState([1, 2, 3, 4, 5, 6, 7, 8]);
  const [mapLayer, setMapLayer] = useState('esriSatellite'); // default to satellite for parcel inspection

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!site || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: false,
      dragging: false
    }).setView([site.latitude, site.longitude], 18);

    mapInstanceRef.current = map;

    setMapTileLayer(map, mapLayer);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [site, mapLayer]);

  if (!site) return <div style={{ color: '#fff', padding: 40 }}>Site not found.</div>;

  const handleToggleMitigation = (type) => {
    const exists = selectedMitigations.some(m => m.type === type);
    if (exists) {
      setSelectedMitigations(prev => prev.filter(m => m.type !== type));
    } else {
      setSelectedMitigations(prev => [...prev, { type, coverage_pct: 100 }]);
    }
  };

  const toggleStallCover = (stallNum) => {
    setCoveredStalls(prev =>
      prev.includes(stallNum) ? prev.filter(n => n !== stallNum) : [...prev, stallNum]
    );
  };

  // Run simulation calculation
  const sim = simulateMitigations(site, selectedMitigations);
  const currentTss = selectedMitigations.length > 0 ? sim.tss_after : site.metrics.thermal_siting_score;
  const currentLoss = selectedMitigations.length > 0 ? sim.annual_revenue_loss_after_usd : site.metrics.estimated_revenue_loss_usd;
  const savings = selectedMitigations.length > 0 ? sim.annual_savings_usd : 0;
  const scoreDiff = currentTss - site.metrics.thermal_siting_score;

  const hasCanopy = selectedMitigations.some(m => m.type === 'Solar Canopy');
  const hasTree = selectedMitigations.some(m => m.type === 'Live Tree Wall');
  const hasPaint = selectedMitigations.some(m => m.type === 'Cool Reflective Paint');
  const hasLiquid = selectedMitigations.some(m => m.type === 'Liquid-Cooled Cable Retrofit');

  const handleSave = () => {
    const updated = {
      ...site,
      metrics: {
        ...site.metrics,
        thermal_siting_score: currentTss,
        estimated_revenue_loss_usd: currentLoss,
        risk_level: currentTss < 50 ? "CRITICAL RISK" : (currentTss < 75 ? "MEDIUM RISK" : "OPTIMAL")
      }
    };
    if (onUpdateSite) {
      onUpdateSite(updated);
    }
    navigate(`/sandbox/${site.site_id}`);
  };

  // Estimated capex
  const capex = (hasCanopy ? 16000 : 0) + (hasPaint ? 2500 : 0) + (hasTree ? 4000 : 0) + (hasLiquid ? 8000 : 0);
  const paybackMonths = savings > 0 ? Math.round((capex / savings) * 12) : 0;

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Top Header matching Page 9 reference */}
      <header style={{
        padding: '16px 28px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            onClick={() => navigate(`/sandbox/${site.site_id}`)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: '8px 12px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <ArrowLeft size={16} /> Back to Analysis
          </button>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h2 style={{ fontSize: 16, fontWeight: 800 }}>Mitigation Design Editor & ROI Sandbox</h2>
            <span style={{ fontSize: 11, color: 'var(--brand-orange)', letterSpacing: '0.05em', fontWeight: 700 }} className="mono">
              TARGET: {site.site_name.toUpperCase()}
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            className="btn-primary"
            style={{ backgroundColor: 'var(--status-optimal)', boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)' }}
            onClick={handleSave}
          >
            <Save size={16} /> SAVE DESIGN & UPDATE AUDIT
          </button>
        </div>
      </header>

      {/* Editor 3-Column Layout matching Reference */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '280px 1fr 300px', height: 'calc(100vh - 69px)' }}>
        
        {/* Left Sidebar: Mitigation Toolbox */}
        <aside style={{
          backgroundColor: '#111216',
          borderRight: '1px solid var(--bg-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
          overflowY: 'auto'
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
              SHADE INFRASTRUCTURE
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {/* Solar Canopy Option */}
              <div
                onClick={() => handleToggleMitigation('Solar Canopy')}
                style={{
                  backgroundColor: hasCanopy ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: hasCanopy ? '2px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                  borderRadius: 10,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Sun size={16} color={hasCanopy ? 'var(--brand-orange)' : '#64748B'} />
                    <strong style={{ fontSize: 13, color: '#fff' }}>Bifacial Solar Canopy</strong>
                  </div>
                  {hasCanopy && <Check size={14} color="var(--brand-orange)" />}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Blocks 85% of GHI direct solar radiation over chargers and EV battery packs.
                </p>
                <span style={{ fontSize: 11, color: 'var(--status-optimal)', fontWeight: 700 }} className="mono">
                  +18 to +24 TSS Impact
                </span>
              </div>

              {/* Live Tree Wall Option */}
              <div
                onClick={() => handleToggleMitigation('Live Tree Wall')}
                style={{
                  backgroundColor: hasTree ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                  border: hasTree ? '2px solid var(--status-optimal)' : '1px solid var(--bg-border)',
                  borderRadius: 10,
                  padding: 14,
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <TreePine size={16} color={hasTree ? 'var(--status-optimal)' : '#64748B'} />
                    <strong style={{ fontSize: 13, color: '#fff' }}>Perimeter Tree Buffer</strong>
                  </div>
                  {hasTree && <Check size={14} color="var(--status-optimal)" />}
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                  Natural canopy row mitigating localized micro-climate asphalt heat island.
                </p>
                <span style={{ fontSize: 11, color: 'var(--status-optimal)', fontWeight: 700 }} className="mono">
                  +8 TSS Impact
                </span>
              </div>
            </div>
          </div>

          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
              SURFACE ALBEDO COATINGS
            </span>
            {/* Cool Reflective Paint */}
            <div
              onClick={() => handleToggleMitigation('Cool Reflective Paint')}
              style={{
                backgroundColor: hasPaint ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: hasPaint ? '2px solid #3B82F6' : '1px solid var(--bg-border)',
                borderRadius: 10,
                padding: 14,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paintbrush size={16} color={hasPaint ? '#3B82F6' : '#64748B'} />
                  <strong style={{ fontSize: 13, color: '#fff' }}>Cool Reflective Sealcoat</strong>
                </div>
                {hasPaint && <Check size={14} color="#3B82F6" />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>
                Raises pavement solar reflectance index (SRI) from 0.08 to 0.72. Lowers surface temp by 15°F.
              </p>
              <span style={{ fontSize: 11, color: '#3B82F6', fontWeight: 700 }} className="mono">
                +12 TSS Impact
              </span>
            </div>
          </div>

          {/* Bottom Live Capex Box */}
          <div style={{
            marginTop: 'auto',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--bg-border)',
            borderRadius: 10,
            padding: 16
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>ESTIMATED MITIGATION CAPEX</span>
            <div className="mono" style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>
              ${capex.toLocaleString()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--status-optimal)', marginTop: 4, display: 'block' }}>
              Eligible for 80% NEVI federal match
            </span>
          </div>
        </aside>

        {/* Center Panel: Interactive Mitigation Map & Stalls Canvas */}
        <main style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0D0D11',
          overflow: 'hidden'
        }}>
          {/* Background Map Container */}
          <div ref={mapRef} style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            opacity: 0.65,
            zIndex: 1
          }} />

          {/* Interactive Stalls Canvas Layer */}
          <div style={{
            position: 'relative',
            zIndex: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 32,
            background: 'radial-gradient(ellipse at center, rgba(13, 13, 17, 0.4) 0%, rgba(13, 13, 17, 0.85) 100%)'
          }}>
            
            {/* Interactive Parking Lot Framework */}
            <div style={{
              maxWidth: 720,
              width: '100%',
              backgroundColor: hasPaint ? 'rgba(70, 90, 110, 0.8)' : 'rgba(22, 24, 30, 0.85)',
              border: hasCanopy ? '3px dashed var(--brand-orange)' : '2px solid var(--bg-border)',
              borderRadius: 16,
              padding: 28,
              backdropFilter: 'blur(12px)',
              boxShadow: hasCanopy ? '0 0 35px rgba(255, 107, 0, 0.3)' : '0 20px 40px rgba(0,0,0,0.6)',
              position: 'relative',
              transition: 'all 0.4s ease'
            }}>
              
              {/* Canopy Badge Overlay */}
              {hasCanopy && (
                <div style={{
                  position: 'absolute',
                  top: -14,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  backgroundColor: 'var(--brand-orange)',
                  color: '#fff',
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '4px 14px',
                  borderRadius: 14,
                  letterSpacing: '0.05em',
                  boxShadow: '0 0 15px rgba(255, 107, 0, 0.6)'
                }}>
                  PROPOSED 45kW BIFACIAL SOLAR CANOPY OVERLAY
                </div>
              )}

              {/* Tree Wall indicators along left and top margins */}
              {hasTree && (
                <div style={{
                  position: 'absolute',
                  top: -8,
                  left: 12,
                  right: 12,
                  display: 'flex',
                  justifyContent: 'space-around',
                  pointerEvents: 'none'
                }}>
                  {Array.from({ length: 7 }).map((_, idx) => (
                    <div key={idx} style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.9)',
                      color: '#000',
                      borderRadius: '50%',
                      width: 18,
                      height: 18,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)'
                    }}>
                      <TreePine size={12} color="#0D0D11" />
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>EV Charging Dispenser Layout</h3>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                    Click individual stalls to assign canopy coverage
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setCoveredStalls([1, 2, 3, 4, 5, 6, 7, 8])}
                    style={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--bg-border)',
                      color: '#fff',
                      borderRadius: 6,
                      padding: '4px 10px',
                      fontSize: 11,
                      cursor: 'pointer'
                    }}
                  >
                    Cover All
                  </button>
                </div>
              </div>

              {/* 8 Parking Stalls Grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 16
              }}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const stallNum = i + 1;
                  const isCovered = hasCanopy && coveredStalls.includes(stallNum);

                  return (
                    <div
                      key={stallNum}
                      onClick={() => toggleStallCover(stallNum)}
                      style={{
                        height: 110,
                        borderRadius: 10,
                        backgroundColor: isCovered ? 'rgba(255, 107, 0, 0.16)' : 'rgba(255, 255, 255, 0.03)',
                        border: isCovered ? '2px solid var(--brand-orange)' : '1px dashed var(--bg-border)',
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: isCovered ? 'inset 0 0 15px rgba(255, 107, 0, 0.2)' : 'none'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>STALL #{stallNum}</span>
                        {isCovered ? (
                          <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--brand-orange)', backgroundColor: 'rgba(255,107,0,0.1)', padding: '2px 6px', borderRadius: 4 }}>
                            CANOPY
                          </span>
                        ) : (
                          <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>EXPOSED</span>
                        )}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Zap size={22} color={isCovered ? 'var(--status-optimal)' : 'var(--status-critical)'} />
                      </div>

                      <div style={{ fontSize: 10, color: isCovered ? 'var(--status-optimal)' : 'var(--status-critical)', fontWeight: 600, textAlign: 'center' }}>
                        {isCovered ? '84°F Cabinet Peak' : '118°F Derating Peak'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Bottom map layer toggle */}
          <div style={{
            position: 'absolute',
            bottom: 20,
            right: 24,
            zIndex: 10,
            display: 'flex',
            gap: 8
          }}>
            <button
              type="button"
              onClick={() => setMapLayer(prev => prev === 'esriSatellite' ? 'osmDark' : 'esriSatellite')}
              style={{
                backgroundColor: 'rgba(22, 23, 28, 0.95)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                padding: '8px 14px',
                color: mapLayer === 'esriSatellite' ? 'var(--brand-orange)' : '#fff',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <Layers size={14} />
              {mapLayer === 'esriSatellite' ? 'Satellite View' : 'Dark Map View'}
            </button>
          </div>
        </main>

        {/* Right Sidebar: Real-Time Before/After Impact Panel */}
        <aside style={{
          backgroundColor: '#111216',
          borderLeft: '1px solid var(--bg-border)',
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto'
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>
              SIMULATED RESILIENCE GAIN
            </span>

            {/* Before vs After Card */}
            <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Baseline Score:</span>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--status-critical)' }}>
                  {site.metrics.thermal_siting_score} / 100
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Mitigated Score:</span>
                <span className="mono" style={{ fontSize: 28, fontWeight: 900, color: 'var(--status-optimal)' }}>
                  {currentTss} / 100
                </span>
              </div>

              {scoreDiff > 0 && (
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.1)',
                  border: '1px solid var(--status-optimal)',
                  borderRadius: 6,
                  padding: '6px 10px',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 800,
                  color: 'var(--status-optimal)'
                }}>
                  +{scoreDiff} POINT RESILIENCE BOOST
                </div>
              )}
            </div>
          </div>

          {/* Annual Financial Savings */}
          <div className="card" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ANNUAL REVENUE SAVED</span>
            <div className="mono" style={{ fontSize: 28, fontWeight: 800, color: 'var(--status-optimal)' }}>
              +${savings.toLocaleString()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Prevents {Math.round(scoreDiff * 7.5)} annual derating hours during summer peak hours.
            </span>
          </div>

          {/* NEVI SLA Compliance Status */}
          <div style={{
            backgroundColor: currentTss >= 75 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
            border: currentTss >= 75 ? '1px solid var(--status-optimal)' : '1px solid var(--status-warning)',
            borderRadius: 8,
            padding: 14
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <ShieldCheck size={16} color={currentTss >= 75 ? 'var(--status-optimal)' : 'var(--status-warning)'} />
              <strong style={{ fontSize: 12, color: currentTss >= 75 ? 'var(--status-optimal)' : 'var(--status-warning)' }}>
                {currentTss >= 75 ? 'NEVI 97% SLA Compliant' : 'Conditional NEVI Approval'}
              </strong>
            </div>
            <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {currentTss >= 75
                ? 'Thermal uptime projected at 98.4%. Qualifies for federal NEVI grant funding.'
                : 'Consider combining Solar Canopy with Cool Sealcoat to achieve full 97% uptime guarantee.'}
            </p>
          </div>

          {/* Payback period */}
          {savings > 0 && (
            <div style={{
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: 14,
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>
                CAPEX PAYBACK PERIOD
              </span>
              <div className="mono" style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>
                {paybackMonths} Months
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Based on saved kWh delivery & avoided downtime fines.
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
