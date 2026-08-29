import React, { useState, useEffect, useRef } from 'react';
import { useNavigate as useNav } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ArrowLeft, ArrowRight, Check, Zap, AlertTriangle, Wind, Droplets, MapPin, Layers, DollarSign, Calendar, TrendingUp } from 'lucide-react';
import { setMapTileLayer, createOrangeLocationPin } from '../utils/mapConfig.js';

export default function Wizard({ onAddSite }) {
  const [step, setStep] = useState(1);
  const navigate = useNav();

  // Step 1 State: Location
  const [siteName, setSiteName] = useState('City Center Parking');
  const [addressSearch, setAddressSearch] = useState('742 Evergreen Terrace, Phoenix, AZ');
  const [lat, setLat] = useState(33.4484);
  const [lng, setLng] = useState(-112.0740);
  const [propertyType, setPropertyType] = useState('Open-Air Parking Lot');
  const [mapLayer, setMapLayer] = useState('osmDark'); // 'osmDark' | 'esriSatellite'

  // Step 2 State: Hardware
  const [chargerModel, setChargerModel] = useState('ABB Terra 184 (180kW)');
  const [coolingType, setCoolingType] = useState('Air-Cooled');
  const [stalls, setStalls] = useState(8);

  // Step 3 State: Financials
  const [utilityRate, setUtilityRate] = useState(0.18);
  const [retailPrice, setRetailPrice] = useState(0.45);
  const [dailySessions, setDailySessions] = useState(12);

  // Map references
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Location Presets
  const presets = [
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740, type: 'Open-Air Parking Lot' },
    { name: 'Dallas, TX', lat: 32.7801, lng: -96.7970, type: 'Urban Commercial Lot' },
    { name: 'Seattle, WA', lat: 47.6062, lng: -122.3321, type: 'Canopy Marina Lot' },
    { name: 'Las Vegas, NV', lat: 36.1699, lng: -115.1398, type: 'Highway Transit Plaza' }
  ];

  const handleSelectPreset = (preset) => {
    setSiteName(`${preset.name} • Hub`);
    setAddressSearch(`${preset.name}, USA`);
    setLat(preset.lat);
    setLng(preset.lng);
    setPropertyType(preset.type);

    if (markerRef.current) {
      markerRef.current.setLatLng([preset.lat, preset.lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([preset.lat, preset.lng], 14);
    }
  };

  // Initialize interactive map for Step 1
  useEffect(() => {
    if (step !== 1 || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapRef.current, {
      zoomControl: false
    }).setView([lat, lng], 13);

    mapInstanceRef.current = map;

    // Set clean tile layer (OpenStreetMap Dark or ESRI Satellite)
    setMapTileLayer(map, mapLayer);

    // Custom safety orange pin icon
    const orangePin = createOrangeLocationPin();

    const marker = L.marker([lat, lng], { icon: orangePin, draggable: true }).addTo(map);
    markerRef.current = marker;

    marker.on('dragend', () => {
      const position = marker.getLatLng();
      const newLat = parseFloat(position.lat.toFixed(4));
      const newLng = parseFloat(position.lng.toFixed(4));
      setLat(newLat);
      setLng(newLng);
    });

    map.on('click', (e) => {
      const clickLat = parseFloat(e.latlng.lat.toFixed(4));
      const clickLng = parseFloat(e.latlng.lng.toFixed(4));
      setLat(clickLat);
      setLng(clickLng);
      marker.setLatLng([clickLat, clickLng]);
      map.panTo([clickLat, clickLng]);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [step, mapLayer]);

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

  // Dynamic Financial Calculations
  const marginPerKwh = Math.max(0, retailPrice - utilityRate);
  const avgKwhPerSession = 42; // typical DC fast charge
  const dailyKwhDelivered = stalls * dailySessions * avgKwhPerSession;
  const projectedDailyRevenue = Math.round(dailyKwhDelivered * retailPrice);
  const projectedAnnualRevenue = Math.round(projectedDailyRevenue * 365);
  const projectedAnnualGrossMargin = Math.round(dailyKwhDelivered * marginPerKwh * 365);

  // Hardware stress calculations
  const chargerPowerKw = chargerModel.includes('350kW') ? 350 : (chargerModel.includes('250kW') ? 250 : 180);
  const heatDissipationKw = Math.round(chargerPowerKw * 0.06); // ~6% heat loss
  const deratingThresholdC = coolingType === 'Air-Cooled' ? 35 : 46;

  const handleRunAnalysis = () => {
    const siteId = `site_${Date.now().toString().slice(-4)}`;
    
    // Calculate deterministic base TSS based on cooling and location
    let baseTss = 58;
    if (coolingType === 'Liquid-Cooled') baseTss += 18;
    if (lat > 40) baseTss += 12; // Cooler northern climate
    if (lat < 35) baseTss -= 14; // Hotter sunbelt climate
    const tss = Math.min(94, Math.max(38, baseTss));

    const deratingHours = Math.round((100 - tss) * 6.2);
    const estLoss = Math.round(stalls * deratingHours * 4.8);

    const newSite = {
      site_id: siteId,
      site_name: siteName,
      location: `${addressSearch} • Lat ${lat}, Lng ${lng}`,
      latitude: lat,
      longitude: lng,
      surface_type: propertyType === 'Open-Air Parking Lot' ? 'Dark Asphalt (Albedo 0.08)' : 'Porous Concrete (Albedo 0.32)',
      peak_ambient_f: lat < 36 ? 112.4 : 96.2,
      charger_model: chargerModel,
      cooling_type: coolingType,
      stall_count: Number(stalls),
      utility_rate_kwh: Number(utilityRate),
      customer_price_kwh: Number(retailPrice),
      daily_sessions: Number(dailySessions),
      metrics: {
        thermal_siting_score: tss,
        risk_level: tss < 50 ? 'CRITICAL RISK' : (tss < 75 ? 'MEDIUM RISK' : 'OPTIMAL'),
        annual_derating_hours: deratingHours,
        shade_coverage_pct: coolingType === 'Liquid-Cooled' ? 22.0 : 8.5,
        estimated_revenue_loss_usd: estLoss
      },
      charts: {
        heat_dissipated_pct: tss,
        heat_retained_pct: 100 - tss,
        monthly_throttling_hours: [12, 24, 48, 72, 98, 124, 118, 80],
        efficiency_trend: [100, 99, 96, 91, 84, 72, 60, 48]
      },
      charger_nodes: Array.from({ length: Math.min(stalls, 4) }, (_, i) => ({
        station_id: `Station ${i + 1} (ID-VS-${siteId.slice(-3)}-${String.fromCharCode(65 + i)})`,
        max_load_kw: chargerPowerKw > 200 ? 22 : 11,
        peak_temp_f: coolingType === 'Air-Cooled' ? 116 - i * 4 : 92 - i * 3,
        status: (coolingType === 'Air-Cooled' && i === 0) ? 'Critical' : 'Normal'
      }))
    };

    // Save site to pending storage for Loader to claim
    sessionStorage.setItem('voltshield_pending_site', JSON.stringify(newSite));
    if (onAddSite) {
      onAddSite(newSite);
    }
    navigate('/loader');
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      color: '#fff',
      padding: '40px 24px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }} className="bg-road-grid">
      
      {/* Stepper Header matching reference */}
      <div style={{
        maxWidth: 1040,
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 36,
        padding: '0 16px'
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
            fontWeight: 800,
            fontSize: 13,
            boxShadow: step === 1 ? '0 0 12px rgba(255, 107, 0, 0.5)' : 'none'
          }}>
            {step > 1 ? <Check size={16} color="#fff" /> : '1'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: step === 1 ? '#fff' : 'var(--text-muted)' }}>LOCATION AUDIT</span>
        </div>

        <div style={{ flex: 1, height: 2, backgroundColor: step > 1 ? 'var(--status-optimal)' : 'var(--bg-border)', margin: '0 20px' }} />

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
            fontWeight: 800,
            fontSize: 13,
            boxShadow: step === 2 ? '0 0 12px rgba(255, 107, 0, 0.5)' : 'none'
          }}>
            {step > 2 ? <Check size={16} color="#fff" /> : '2'}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: step === 2 ? '#fff' : 'var(--text-muted)' }}>HARDWARE CONFIG</span>
        </div>

        <div style={{ flex: 1, height: 2, backgroundColor: step > 2 ? 'var(--status-optimal)' : 'var(--bg-border)', margin: '0 20px' }} />

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
            fontWeight: 800,
            fontSize: 13,
            boxShadow: step === 3 ? '0 0 12px rgba(255, 107, 0, 0.5)' : 'none'
          }}>
            3
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: step === 3 ? '#fff' : 'var(--text-muted)' }}>UTILITY & REVENUE</span>
        </div>
      </div>

      {/* Form Container Card */}
      <div style={{
        maxWidth: 1040,
        width: '100%',
        backgroundColor: 'var(--bg-card)',
        border: '1px solid var(--bg-border)',
        borderRadius: 16,
        padding: 36,
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 36,
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.4)'
      }}>
        
        {/* ================= STEP 1: LOCATION ================= */}
        {step === 1 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Site Location & Boundary</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Enter parcel details or drag the pin on the map to anchor coordinates for FortyGuard thermal querying.
                </p>
              </div>

              {/* Presets */}
              <div>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', display: 'block', marginBottom: 8 }}>QUICK PRESETS</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {presets.map(p => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => handleSelectPreset(p)}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.04)',
                        border: '1px solid var(--bg-border)',
                        color: '#fff',
                        fontSize: 12,
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer'
                      }}
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SITE / PLAZA NAME</label>
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

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>ADDRESS OR CORRIDOR</label>
                <input
                  type="text"
                  value={addressSearch}
                  onChange={e => setAddressSearch(e.target.value)}
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
                      outline: 'none',
                      fontFamily: 'monospace'
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
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>SURFACE / PROPERTY TYPE</label>
                <div style={{ display: 'flex', gap: 10 }}>
                  {['Open-Air Parking Lot', 'Multi-Level Garage', 'Highway Rest Stop'].map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPropertyType(type)}
                      style={{
                        flex: 1,
                        padding: '10px 12px',
                        borderRadius: 8,
                        fontSize: 11,
                        fontWeight: 600,
                        backgroundColor: propertyType === type ? 'rgba(255, 107, 0, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                        border: propertyType === type ? '1px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                        color: propertyType === type ? 'var(--brand-orange)' : 'var(--text-muted)',
                        cursor: 'pointer'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn-primary" onClick={() => setStep(2)}>
                  Next: Hardware Config <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Map Panel */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>LIVE PARCEL GIS LOCATOR</span>
                <button
                  type="button"
                  onClick={() => setMapLayer(prev => prev === 'osmDark' ? 'esriSatellite' : 'osmDark')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--brand-orange)',
                    fontSize: 11,
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <Layers size={14} />
                  {mapLayer === 'esriSatellite' ? 'Switch to Dark Map' : 'Switch to Satellite'}
                </button>
              </div>

              <div style={{
                height: 380,
                borderRadius: 12,
                border: '1px solid var(--bg-border)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

                <div style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 12,
                  zIndex: 1000,
                  backgroundColor: 'rgba(22, 23, 28, 0.9)',
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--bg-border)',
                  fontSize: 11,
                  color: 'var(--text-muted)'
                }}>
                  Click or drag pin to position
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 107, 0, 0.05)',
                border: '1px solid rgba(255, 107, 0, 0.2)',
                borderRadius: 8,
                padding: 12,
                fontSize: 12,
                color: 'var(--text-muted)',
                lineHeight: 1.4
              }}>
                <strong style={{ color: 'var(--brand-orange)' }}>NEVI Siting Requirement:</strong> Coordinates will be queried against FortyGuard 10m-resolution surface albedo and 35°C exceedance indices.
              </div>
            </div>
          </>
        )}

        {/* ================= STEP 2: HARDWARE CONFIG ================= */}
        {step === 2 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Power & Hardware Architecture</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Configure charging cabinet power ratings and thermal rejection cooling mechanics.
                </p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CHARGER MODEL & OUTPUT</label>
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
                    fontSize: 14
                  }}
                >
                  <option value="ABB Terra 184 (180kW)">ABB Terra 184 (180kW Dual Port)</option>
                  <option value="Tritium Veefil-RT (150kW)">Tritium Veefil-RT (150kW)</option>
                  <option value="ChargePoint Express Plus (350kW)">ChargePoint Express Plus (350kW High-Power)</option>
                  <option value="Tesla Supercharger V3 (250kW)">Tesla Supercharger V3 (250kW)</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>CABINET COOLING MECHANISM</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => setCoolingType('Air-Cooled')}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      backgroundColor: coolingType === 'Air-Cooled' ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: coolingType === 'Air-Cooled' ? '2px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Wind size={18} color={coolingType === 'Air-Cooled' ? 'var(--brand-orange)' : '#64748B'} />
                      <strong style={{ color: coolingType === 'Air-Cooled' ? '#fff' : 'var(--text-muted)', fontSize: 13 }}>Air-Cooled</strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Standard forced air fans. Derates at &gt;35°C ambient. Lower CAPEX.</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCoolingType('Liquid-Cooled')}
                    style={{
                      padding: 16,
                      borderRadius: 10,
                      backgroundColor: coolingType === 'Liquid-Cooled' ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                      border: coolingType === 'Liquid-Cooled' ? '2px solid #3B82F6' : '1px solid var(--bg-border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      cursor: 'pointer',
                      textAlign: 'left'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Droplets size={18} color={coolingType === 'Liquid-Cooled' ? '#3B82F6' : '#64748B'} />
                      <strong style={{ color: coolingType === 'Liquid-Cooled' ? '#fff' : 'var(--text-muted)', fontSize: 13 }}>Liquid-Cooled</strong>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Chilled loop radiators. Derates at &gt;46°C ambient. Higher resilience.</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>DISPENSER STALL COUNT</label>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-orange)' }}>{stalls} STALLS</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="24"
                  step="2"
                  value={stalls}
                  onChange={e => setStalls(parseInt(e.target.value))}
                  style={{ accentColor: 'var(--brand-orange)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12 }}>
                <button className="btn-secondary" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-primary" onClick={() => setStep(3)}>
                  Next: Utility & Financials <ArrowRight size={16} />
                </button>
              </div>
            </div>

            {/* Right Stress Preview Panel matching Page 1 reference */}
            <div style={{
              backgroundColor: '#111216',
              borderRadius: 12,
              border: '1px solid var(--bg-border)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                THERMAL STRESS PREVIEW
              </span>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Cabinet Heat Rejection:</span>
                  <strong style={{ color: '#fff' }} className="mono">{heatDissipationKw * stalls} kW Total</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Thermal Derating Threshold:</span>
                  <strong style={{ color: coolingType === 'Air-Cooled' ? 'var(--status-critical)' : 'var(--status-optimal)' }} className="mono">
                    {deratingThresholdC}°C ({Math.round(deratingThresholdC * 9/5 + 32)}°F)
                  </strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Total Site Power Draw:</span>
                  <strong style={{ color: '#fff' }} className="mono">{(chargerPowerKw * stalls / 1000).toFixed(2)} MW</strong>
                </div>
              </div>

              <div style={{
                backgroundColor: coolingType === 'Air-Cooled' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(16, 185, 129, 0.08)',
                border: coolingType === 'Air-Cooled' ? '1px solid var(--status-critical)' : '1px solid var(--status-optimal)',
                borderRadius: 8,
                padding: 16
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  {coolingType === 'Air-Cooled' ? (
                    <AlertTriangle size={16} color="var(--status-critical)" />
                  ) : (
                    <Check size={16} color="var(--status-optimal)" />
                  )}
                  <strong style={{ fontSize: 12, color: coolingType === 'Air-Cooled' ? 'var(--status-critical)' : 'var(--status-optimal)' }}>
                    {coolingType === 'Air-Cooled' ? 'Elevated Summer Derating Risk' : 'High Thermal Heat Dissipation Buffer'}
                  </strong>
                </div>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  {coolingType === 'Air-Cooled'
                    ? 'In unshaded asphalt lots, ambient temperatures above 95°F will trigger 50% dispenser throttling. Solar canopy mitigation strongly recommended.'
                    : 'Liquid cooling maintains full 150-350kW output up to 115°F. Reduces downtime violations under NEVI SLA.'}
                </p>
              </div>
            </div>
          </>
        )}

        {/* ================= STEP 3: UTILITY & FINANCIALS ================= */}
        {step === 3 && (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Utility Tariffs & Dwell Parameters</h3>
                <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                  Set commercial electricity rates and charging session targets to model revenue-at-risk.
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>GRID TARIFF ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={utilityRate}
                    onChange={e => setUtilityRate(parseFloat(e.target.value) || 0)}
                    style={{
                      backgroundColor: '#0D0D11',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      color: '#fff',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>RETAIL PRICE ($/kWh)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={retailPrice}
                    onChange={e => setRetailPrice(parseFloat(e.target.value) || 0)}
                    style={{
                      backgroundColor: '#0D0D11',
                      border: '1px solid var(--bg-border)',
                      borderRadius: 8,
                      padding: '12px 16px',
                      color: '#fff',
                      outline: 'none',
                      fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>AVG SESSIONS / STALL / DAY</label>
                  <span className="mono" style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand-orange)' }}>{dailySessions} SESSIONS</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="28"
                  step="1"
                  value={dailySessions}
                  onChange={e => setDailySessions(parseInt(e.target.value))}
                  style={{ accentColor: 'var(--brand-orange)', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16 }}>
                <button className="btn-secondary" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button className="btn-primary" onClick={handleRunAnalysis}>
                  Run Thermal Analysis &rarr;
                </button>
              </div>
            </div>

            {/* Right Financial Projections Panel matching Page 3 reference */}
            <div style={{
              backgroundColor: '#111216',
              borderRadius: 12,
              border: '1px solid var(--bg-border)',
              padding: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 20
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                PROJECTED RUN-RATE FINANCIALS
              </span>

              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Gross Energy Margin:</span>
                  <strong style={{ color: 'var(--status-optimal)' }} className="mono">${marginPerKwh.toFixed(2)}/kWh</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated Daily Revenue:</span>
                  <strong style={{ color: '#fff' }} className="mono">${projectedDailyRevenue.toLocaleString()}/day</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Projected Annual Revenue:</span>
                  <strong style={{ color: '#fff' }} className="mono">${projectedAnnualRevenue.toLocaleString()}/yr</strong>
                </div>
              </div>

              <div style={{
                backgroundColor: 'rgba(255, 107, 0, 0.06)',
                border: '1px solid var(--brand-orange)',
                borderRadius: 8,
                padding: 16
              }}>
                <span style={{ fontSize: 11, color: 'var(--brand-orange)', fontWeight: 700, display: 'block', marginBottom: 4 }}>
                  NEVI PROGRAM INCENTIVE ELIGIBLE
                </span>
                <p style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Sites with quantified thermal resilience mitigation plans are eligible for 80% federal NEVI CAPEX matching funds.
                </p>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
