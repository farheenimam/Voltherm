import React, { useState, useEffect, useRef } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, ArrowRight, Check, Zap, AlertTriangle } from 'lucide-react';

export default function Wizard() {
  const [step, setStep] = useState(1);
  const navigate = useNav();

  // Step 1 State
  const [siteName, setSiteName] = useState('City Center Parking');
  const [lat, setLat] = useState(34.0522);
  const [lng, setLng] = useState(-118.2437);
  const [propertyType, setPropertyType] = useState('Open-Air Parking Lot');

  // Step 2 State
  const [chargerModel, setChargerModel] = useState('ABB Terra 184 (180kW)');
  const [coolingType, setCoolingType] = useState('Air-Cooled');
  const [stalls, setStalls] = useState(8);

  // Step 3 State
  const [utilityRate, setUtilityRate] = useState(0.18);
  const [retailPrice, setRetailPrice] = useState(0.45);
  const [dailySessions, setDailySessions] = useState(12);

  // Map references
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize interactive map for Step 1 location selection
  useEffect(() => {
    if (step !== 1 || !mapRef.current) return;

    // Create map centered on input coordinates
    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([lat, lng], 13);

    mapInstanceRef.current = map;

    // Use OpenStreetMap Standard styled dark tile layers
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);

    // Custom safety orange pin icon
    const orangePin = L.divIcon({
      className: 'vs-wizard-pin',
      html: `
        <div style="
          width: 24px; 
          height: 24px; 
          border-radius: 50%; 
          background-color: var(--brand-orange); 
          border: 3px solid #FFFFFF; 
          box-shadow: 0 0 15px var(--brand-orange);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <div style="width: 6px; height: 6px; border-radius: 50%; background-color: #FFFFFF;"></div>
        </div>
      `,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    // Create drag-position marker
    const marker = L.marker([lat, lng], { icon: orangePin, draggable: true }).addTo(map);
    markerRef.current = marker;

    // Sync drag events back to state
    marker.on('dragend', () => {
      const position = marker.getLatLng();
      setLat(parseFloat(position.lat.toFixed(6)));
      setLng(parseFloat(position.lng.toFixed(6)));
    });

    // Map click sets marker and updates state coordinates
    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      setLat(parseFloat(clickLat.toFixed(6)));
      setLng(parseFloat(clickLng.toFixed(6)));
      marker.setLatLng([clickLat, clickLng]);
      map.panTo([clickLat, clickLng]);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markerRef.current = null;
    };
  }, [step]);

  // Sync inputs to map coordinates
  const handleCoordInputChange = (newLat, newLng) => {
    setLat(newLat);
    setLng(newLng);
    if (markerRef.current) {
      markerRef.current.setLatLng([newLat, newLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo([newLat, newLng]);
    }
  };

  // Calculate dynamic projected revenue
  const margin = Math.max(0, retailPrice - utilityRate);
  const avgKwhPerSession = 35.0; 
  const totalSessions = dailySessions * stalls;
  const projectedRevenue = Math.round(totalSessions * avgKwhPerSession * margin);

  const handleNext = () => {
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleTriggerAnalysis = () => {
    const siteId = `site_${Math.floor(Math.random() * 1000)}`;
    const latHash = Math.sin(lat * 10);
    const tss = Math.round(40 + (Math.abs(latHash) * 50));
    const exceedanceHours = Math.round((100 - tss) * 5.2);
    const revLoss = stalls * exceedanceHours * 12.50;

    const newSite = {
      site_id: siteId,
      site_name: siteName,
      location: `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
      latitude: lat,
      longitude: lng,
      surface_type: propertyType,
      peak_ambient_f: 110.0,
      charger_model: chargerModel,
      cooling_type: coolingType,
      stall_count: stalls,
      utility_rate_kwh: utilityRate,
      customer_price_kwh: retailPrice,
      daily_sessions: dailySessions,
      metrics: {
        thermal_siting_score: tss,
        risk_level: tss < 50 ? "CRITICAL RISK" : (tss < 75 ? "MEDIUM RISK" : "OPTIMAL"),
        annual_derating_hours: exceedanceHours,
        shade_coverage_pct: Math.round(5.0 + (Math.abs(latHash) * 20)),
        estimated_revenue_loss_usd: revLoss
      },
      charts: {
        heat_dissipated_pct: tss,
        heat_retained_pct: 100 - tss,
        monthly_throttling_hours: [10, 25, 45, 60, 80, 110, 105, 70],
        efficiency_trend: [100, 98, 94, 88, 80, 68, 55, 45]
      },
      charger_nodes: [
        { station_id: `Station 11 (ID-${siteId.split('_')[1]})`, max_load_kw: 11, peak_temp_f: 105, status: "Normal" }
      ]
    };

    sessionStorage.setItem('voltshield_pending_site', JSON.stringify(newSite));
    navigate('/loader');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      color: '#fff',
      padding: '48px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      {/* Stepper Header */}
      <div style={{
        maxWidth: 960,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 48,
        padding: '0 24px'
      }}>
        {/* Step 1 Location */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: step > 1 ? 'var(--status-optimal)' : (step === 1 ? 'var(--brand-orange)' : '#1E293B'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14
          }}>
            {step > 1 ? <Check size={16} color="#fff" /> : '1'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: step === 1 ? '#fff' : 'var(--text-muted)' }}>LOCATION</span>
        </div>

        <div style={{ flex: 1, height: 2, backgroundColor: step > 1 ? 'var(--status-optimal)' : '#1E293B', margin: '0 16px' }} />

        {/* Step 2 Hardware */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: step > 2 ? 'var(--status-optimal)' : (step === 2 ? 'var(--brand-orange)' : '#1E293B'),
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14
          }}>
            {step > 2 ? <Check size={16} color="#fff" /> : '2'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: step === 2 ? '#fff' : 'var(--text-muted)' }}>HARDWARE</span>
        </div>

        <div style={{ flex: 1, height: 2, backgroundColor: step > 2 ? 'var(--status-optimal)' : '#1E293B', margin: '0 16px' }} />

        {/* Step 3 Utility */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: step === 3 ? 'var(--brand-orange)' : '#1E293B',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14
          }}>
            3
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: step === 3 ? '#fff' : 'var(--text-muted)' }}>UTILITY</span>
        </div>
      </div>

      {/* Form Container Card */}
      <div style={{
        maxWidth: 960,
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 16,
        padding: 40,
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 40
      }}>
        {/* Left Form Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {step === 1 && (
            <>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Enter Site Details</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Search and click on the map to automatically lock in GPS coordinates.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SITE NAME</label>
                <input
                  type="text"
                  value={siteName}
                  onChange={e => setSiteName(e.target.value)}
                  style={{
                    backgroundColor: '#0D0D11',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>LATITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={e => handleCoordInputChange(parseFloat(e.target.value) || 0, lng)}
                    style={{
                      backgroundColor: '#0D0D11',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>LONGITUDE</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={e => handleCoordInputChange(lat, parseFloat(e.target.value) || 0)}
                    style={{
                      backgroundColor: '#0D0D11',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      color: '#fff',
                      outline: 'none'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>PROPERTY TYPE</label>
                <select
                  value={propertyType}
                  onChange={e => setPropertyType(e.target.value)}
                  style={{
                    backgroundColor: '#0D0D11',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#fff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="Open-Air Parking Lot">Open-Air Parking Lot</option>
                  <option value="Retail Parking">Retail Parking</option>
                  <option value="Commercial Garage">Commercial Garage</option>
                  <option value="Public Lot">Public Lot</option>
                </select>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Hardware Configuration</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Select your charger specs to calculate thermal derating curves.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CHARGER MODEL</label>
                <select
                  value={chargerModel}
                  onChange={e => setChargerModel(e.target.value)}
                  style={{
                    backgroundColor: '#0D0D11',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#fff',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="ABB Terra 184 (180kW)">ABB Terra 184 (180kW)</option>
                  <option value="Tritium Veefil 350kW">Tritium Veefil 350kW</option>
                  <option value="ChargePoint Express 250">ChargePoint Express 250</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>COOLING SYSTEM</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <button
                    type="button"
                    onClick={() => setCoolingType('Air-Cooled')}
                    style={{
                      backgroundColor: coolingType === 'Air-Cooled' ? 'rgba(255, 107, 0, 0.1)' : '#0D0D11',
                      border: coolingType === 'Air-Cooled' ? '2px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                      borderRadius: 8,
                      padding: 16,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Zap size={20} color={coolingType === 'Air-Cooled' ? 'var(--brand-orange)' : '#64748B'} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Air Cooled</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCoolingType('Liquid-Cooled')}
                    style={{
                      backgroundColor: coolingType === 'Liquid-Cooled' ? 'rgba(255, 107, 0, 0.1)' : '#0D0D11',
                      border: coolingType === 'Liquid-Cooled' ? '2px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                      borderRadius: 8,
                      padding: 16,
                      color: '#fff',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 8
                    }}
                  >
                    <Zap size={20} color={coolingType === 'Liquid-Cooled' ? 'var(--brand-orange)' : '#64748B'} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>Liquid Cooled</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>NUMBER OF STALLS</label>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{stalls}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <input
                    type="range"
                    min="1"
                    max="24"
                    value={stalls}
                    onChange={e => setStalls(parseInt(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--brand-orange)', height: 6, cursor: 'pointer' }}
                  />
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, marginBottom: 8 }}>Step 3 of 3: Utility & Financials</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Configure pricing structures to calculate revenue-at-risk projections.</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ELECTRICITY RATE ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={utilityRate}
                  onChange={e => setUtilityRate(parseFloat(e.target.value))}
                  style={{
                    backgroundColor: '#0D0D11',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CUSTOMER PRICING ($/kWh)</label>
                <input
                  type="number"
                  step="0.01"
                  value={retailPrice}
                  onChange={e => setRetailPrice(parseFloat(e.target.value))}
                  style={{
                    backgroundColor: '#0D0D11',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    padding: '12px 16px',
                    color: '#fff',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>AVERAGE DAILY SESSIONS PER CHARGER</label>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 700 }}>{dailySessions}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  value={dailySessions}
                  onChange={e => setDailySessions(parseInt(e.target.value))}
                  style={{ accentColor: 'var(--brand-orange)', height: 6, cursor: 'pointer' }}
                />
              </div>
            </>
          )}

          {/* Buttons Navigation */}
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            {step > 1 ? (
              <button className="btn-secondary" style={{ flex: 1 }} onClick={handleBack}>
                <ArrowLeft size={16} /> Back
              </button>
            ) : (
              <button className="btn-secondary" style={{ flex: 1 }} onClick={() => navigate('/portfolio')}>
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleNext}>
                Next Step <ArrowRight size={16} />
              </button>
            ) : (
              <button className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} onClick={handleTriggerAnalysis}>
                Run Thermal Analysis
              </button>
            )}
          </div>
        </div>

        {/* Right Info / Map Panel */}
        <div style={{
          backgroundColor: '#0D0D11',
          border: '1px solid var(--bg-border)',
          borderRadius: 12,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          position: 'relative'
        }}>
          {step === 1 && (
            <>
              {/* Interactive Leaflet Map for wizard location placement */}
              <div style={{
                width: '100%',
                height: 220,
                borderRadius: 8,
                overflow: 'hidden',
                border: '1px solid var(--bg-border)',
                zIndex: 1
              }} ref={mapRef} />
              <div style={{ width: '100%', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>
                <h4 style={{ color: '#fff', marginBottom: 4 }}>Site Geographic Audit</h4>
                Drag the marker or click on the map to set the charger bounds.
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{
                width: '100%',
                height: 180,
                borderRadius: 8,
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--bg-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-dark)',
                fontSize: 13,
                fontWeight: 600,
                textAlign: 'center',
                padding: 16
              }}>
                [ THERMAL STRESS PREVIEW ]<br />
                ABB Terra 184 — 68% PEAK THERMAL LOAD
              </div>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{
                  backgroundColor: 'rgba(245, 158, 11, 0.05)',
                  border: '1px solid var(--status-warning)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  gap: 10,
                  fontSize: 12.5,
                  alignItems: 'center'
                }}>
                  <AlertTriangle size={18} color="var(--status-warning)" />
                  <div>
                    <strong style={{ color: '#fff', display: 'block' }}>Critical Thermal Zone</strong>
                    Estimated 4h/day of thermal derating.
                  </div>
                </div>
                <div style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.05)',
                  border: '1px solid var(--status-optimal)',
                  borderRadius: 8,
                  padding: 12,
                  display: 'flex',
                  gap: 10,
                  fontSize: 12.5,
                  alignItems: 'center'
                }}>
                  <Check size={18} color="var(--status-optimal)" />
                  <div>
                    <strong style={{ color: '#fff', display: 'block' }}>Efficiency Opportunity</strong>
                    Shade canopy could save $1,200/mo.
                  </div>
                </div>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                  PROJECTED DAILY REVENUE
                </span>
                <span className="mono" style={{ fontSize: 44, fontWeight: 800, color: 'var(--status-optimal)' }}>
                  ${projectedRevenue.toLocaleString()}
                </span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Based on {totalSessions} daily sessions and ${(margin).toFixed(2)}/kWh retail margin.
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      <span style={{ fontSize: 12, color: 'var(--text-dark)', marginTop: 24 }}>Data powered by FortyGuard Urban Heat Intelligence</span>
    </div>
  );
}
