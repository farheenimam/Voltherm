import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ExportModal from './ExportModal.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCopilotResponse } from '../mockData.js';
import { setMapTileLayer, createChargerNodePin } from '../utils/mapConfig.js';
import {
  FileText, Edit, ShieldAlert, DollarSign, MessageSquare, Send,
  Layers, Sun, Clock, Zap, AlertTriangle, CheckCircle, Info, Sparkles
} from 'lucide-react';

export default function Sandbox({ sites, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showExportModal, setShowExportModal] = useState(false);
  const [mapLayer, setMapLayer] = useState('osmDark'); // 'osmDark' | 'esriSatellite'
  const [activeHotspotOverlay, setActiveHotspotOverlay] = useState(true);
  const [hoveredBar, setHoveredBar] = useState(null);

  const [chatQuery, setChatQuery] = useState('');
  const [chatLogs, setChatLogs] = useState([
    {
      sender: 'copilot',
      text: 'VoltShield Copilot online. Hyperlocal FortyGuard thermal data loaded. Ask me for siting recommendations, solar canopy sizing, or NEVI compliance risks.'
    }
  ]);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const hotSpotsLayerRef = useRef(null);

  const site = sites.find(s => s.site_id === id) || sites[0];

  useEffect(() => {
    if (!site || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Initialize Leaflet map centered on site
    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: false
    }).setView([site.latitude, site.longitude], 17);

    mapInstanceRef.current = map;

    // Apply clean tile layer
    setMapTileLayer(map, mapLayer);

    // Create hotspot overlay layer group
    const hotSpotsLayer = L.layerGroup().addTo(map);
    hotSpotsLayerRef.current = hotSpotsLayer;

    // Heat circles representing FortyGuard thermal exceedance zones
    const hotSpots = [
      { coords: [site.latitude + 0.0002, site.longitude - 0.0002], radius: 30, color: '#EF4444', opacity: 0.45 },
      { coords: [site.latitude - 0.00015, site.longitude + 0.00025], radius: 38, color: '#EF4444', opacity: 0.4 },
      { coords: [site.latitude + 0.00008, site.longitude + 0.00008], radius: 50, color: '#F59E0B', opacity: 0.28 }
    ];

    hotSpots.forEach(spot => {
      L.circle(spot.coords, {
        color: 'transparent',
        fillColor: spot.color,
        fillOpacity: spot.opacity,
        radius: spot.radius
      }).addTo(hotSpotsLayer);
    });

    // Plot charger node pins around center
    const chargerOffsets = [
      [0.00006, -0.00006],
      [-0.00005, 0.00005],
      [0.00006, 0.00012],
      [-0.00006, -0.00010]
    ];

    site.charger_nodes.forEach((node, idx) => {
      const isCritical = node.status === 'Critical';
      const nodeIcon = createChargerNodePin(isCritical);
      const offset = chargerOffsets[idx % chargerOffsets.length];

      L.marker([site.latitude + offset[0], site.longitude + offset[1]], { icon: nodeIcon })
        .addTo(map)
        .bindPopup(`
          <div style="color: #fff; font-size: 12px; line-height: 1.4; padding: 2px;">
            <strong style="color: #fff; font-size: 13px;">${node.station_id}</strong><br/>
            <span style="color: #94A3B8;">Max Load:</span> <strong style="font-family: monospace;">${node.max_load_kw} kW</strong><br/>
            <span style="color: #94A3B8;">Peak Temp:</span> <strong style="color: ${isCritical ? '#EF4444' : '#10B981'}; font-family: monospace;">${node.peak_temp_f}°F</strong><br/>
            <span style="color: #94A3B8;">Status:</span> <span style="color: ${isCritical ? '#EF4444' : '#10B981'}; font-weight: 700;">${node.status}</span>
          </div>
        `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [site, mapLayer]);

  // Toggle thermal heat circles
  const toggleHotspots = () => {
    if (!hotSpotsLayerRef.current || !mapInstanceRef.current) return;
    if (activeHotspotOverlay) {
      mapInstanceRef.current.removeLayer(hotSpotsLayerRef.current);
      setActiveHotspotOverlay(false);
    } else {
      mapInstanceRef.current.addLayer(hotSpotsLayerRef.current);
      setActiveHotspotOverlay(true);
    }
  };

  const handleSendChat = (e) => {
    if (e) e.preventDefault();
    if (!chatQuery.trim()) return;

    const userMessage = chatQuery;
    const botResponse = getCopilotResponse(userMessage);

    setChatLogs(prev => [
      ...prev,
      { sender: 'user', text: userMessage },
      { sender: 'copilot', text: botResponse }
    ]);
    setChatQuery('');
  };

  const handleChipClick = (promptText) => {
    setChatQuery(promptText);
    const botResponse = getCopilotResponse(promptText);
    setChatLogs(prev => [
      ...prev,
      { sender: 'user', text: promptText },
      { sender: 'copilot', text: botResponse }
    ]);
    setChatQuery('');
  };

  if (!site) return <div style={{ color: '#fff', padding: 40 }}>Site not found.</div>;

  const isCritical = site.metrics.thermal_siting_score < 50;
  const isOptimal = site.metrics.thermal_siting_score >= 75;
  const riskColor = isCritical ? 'var(--status-critical)' : (isOptimal ? 'var(--status-optimal)' : 'var(--status-warning)');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0D0D11' }}>
      <Sidebar user={user} onLogout={onLogout} firstSiteId={site.site_id} />

      <div style={{ flex: 1, marginLeft: 240, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header matching Page 8 Mockup */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--bg-border)',
          paddingBottom: 20
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Thermal Siting Analysis</h2>
              
              {/* Site selector dropdown */}
              <div style={{ position: 'relative' }}>
                <select
                  value={site.site_id}
                  onChange={e => navigate(`/sandbox/${e.target.value}`)}
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    color: '#fff',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 8,
                    padding: '6px 28px 6px 12px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none'
                  }}
                >
                  {sites.map(s => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.site_name} (TSS {s.metrics.thermal_siting_score})
                    </option>
                  ))}
                </select>
              </div>

              <span style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--bg-border)',
                borderRadius: 16,
                padding: '3px 10px',
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--brand-orange)'
              }} className="mono">
                {site.site_id.toUpperCase()}
              </span>
            </div>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
              {site.site_name} &bull; {site.location} &bull; <span style={{ fontFamily: 'monospace' }}>[{site.latitude.toFixed(4)}°N, {Math.abs(site.longitude).toFixed(4)}°W]</span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button
              className="btn-secondary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => setShowExportModal(true)}
            >
              <FileText size={16} /> Export NEVI PDF
            </button>
            <button
              className="btn-primary"
              style={{ display: 'flex', alignItems: 'center', gap: 8 }}
              onClick={() => navigate(`/editor/${site.site_id}`)}
            >
              <Edit size={16} /> Mitigation Design Canvas
            </button>
          </div>
        </header>

        {/* Map & Copilot Split Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr', gap: 24 }}>
          
          {/* Map Area */}
          <div style={{
            height: 420,
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.4)'
          }}>
            {/* Live Leaflet Map */}
            <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

            {/* Overlays top left */}
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1000,
              display: 'flex',
              flexDirection: 'column',
              gap: 8
            }}>
              <div style={{
                backgroundColor: isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                border: `1px solid ${riskColor}`,
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                padding: '6px 12px',
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)'
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: riskColor }}></span>
                {isCritical ? '2 stalls exceeding 35°C thermal derating' : 'Stalls within thermal safety band'}
              </div>
            </div>

            {/* Map Controls bottom left */}
            <div style={{
              position: 'absolute',
              bottom: 16,
              left: 16,
              zIndex: 1000,
              display: 'flex',
              gap: 8
            }}>
              <button
                type="button"
                onClick={toggleHotspots}
                style={{
                  padding: '7px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: activeHotspotOverlay ? 'rgba(239, 68, 68, 0.25)' : 'rgba(22, 23, 28, 0.9)',
                  border: activeHotspotOverlay ? '1px solid var(--status-critical)' : '1px solid var(--bg-border)',
                  borderRadius: 6,
                  color: '#fff',
                  cursor: 'pointer',
                  backdropFilter: 'blur(8px)'
                }}
              >
                Heatmap Overlay: {activeHotspotOverlay ? 'ON' : 'OFF'}
              </button>

              <button
                type="button"
                onClick={() => setMapLayer(prev => prev === 'osmDark' ? 'esriSatellite' : 'osmDark')}
                style={{
                  padding: '7px 12px',
                  fontSize: 11,
                  fontWeight: 600,
                  backgroundColor: 'rgba(22, 23, 28, 0.9)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 6,
                  color: mapLayer === 'esriSatellite' ? 'var(--brand-orange)' : '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  backdropFilter: 'blur(8px)'
                }}
              >
                <Layers size={13} />
                {mapLayer === 'esriSatellite' ? 'Satellite Aerial' : 'Dark Streets'}
              </button>
            </div>
          </div>

          {/* VoltShield AI Copilot Right Console */}
          <div className="card" style={{
            display: 'flex',
            flexDirection: 'column',
            height: 420,
            padding: 20,
            gap: 14
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bg-border)', paddingBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={18} color="var(--brand-orange)" />
                <strong style={{ fontSize: 14, color: '#fff' }}>VoltShield AI Siting Copilot</strong>
              </div>
              <span style={{
                fontSize: 10,
                color: 'var(--status-optimal)',
                fontWeight: 700,
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                padding: '2px 8px',
                borderRadius: 4,
                border: '1px solid var(--status-optimal)'
              }}>ACTIVE AGENT</span>
            </div>

            {/* Quick Prompt Chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {[
                'Recommend Solar Canopy',
                'NEVI 97% Compliance Risk',
                'Cool Reflective Paint ROI'
              ].map(chip => (
                <button
                  key={chip}
                  type="button"
                  onClick={() => handleChipClick(chip)}
                  style={{
                    backgroundColor: 'rgba(255, 107, 0, 0.08)',
                    border: '1px solid rgba(255, 107, 0, 0.3)',
                    color: '#fff',
                    borderRadius: 14,
                    padding: '4px 10px',
                    fontSize: 10.5,
                    cursor: 'pointer'
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat message list area */}
            <div style={{
              flex: 1,
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
              padding: '4px 0'
            }}>
              {chatLogs.map((msg, index) => (
                <div
                  key={index}
                  style={{
                    backgroundColor: msg.sender === 'copilot' ? 'rgba(255, 255, 255, 0.025)' : 'rgba(255, 107, 0, 0.12)',
                    border: msg.sender === 'copilot' ? '1px solid var(--bg-border)' : '1px solid var(--brand-orange)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    fontSize: 12,
                    lineHeight: 1.45,
                    alignSelf: msg.sender === 'copilot' ? 'flex-start' : 'flex-end',
                    maxWidth: '90%'
                  }}
                >
                  <span style={{
                    fontWeight: 700,
                    fontSize: 10,
                    color: msg.sender === 'copilot' ? 'var(--brand-orange)' : '#FFFFFF',
                    display: 'block',
                    marginBottom: 4,
                    letterSpacing: '0.05em'
                  }}>
                    {msg.sender === 'copilot' ? 'ENGINEERING AGENT' : 'YOU'}
                  </span>
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input field */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
                placeholder="Ask about derating, cooling or albedo..."
                style={{
                  flex: 1,
                  backgroundColor: '#0D0D11',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 8,
                  padding: '10px 14px',
                  color: '#fff',
                  fontSize: 12,
                  outline: 'none'
                }}
              />
              <button type="submit" className="btn-primary" style={{ padding: '10px 14px', borderRadius: 8 }}>
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>

        {/* Key Metrics Row matching Reference Design */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          
          {/* Card 1: TSS Score */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>THERMAL SITING SCORE</span>
              <ShieldAlert size={16} color={riskColor} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono" style={{ fontSize: 36, fontWeight: 800 }}>{site.metrics.thermal_siting_score}</span>
              <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/100</span>
              <span style={{
                color: riskColor,
                fontSize: 10,
                fontWeight: 700,
                backgroundColor: `rgba(255, 255, 255, 0.05)`,
                border: `1px solid ${riskColor}`,
                borderRadius: 4,
                padding: '2px 6px',
                marginLeft: 4
              }}>{site.metrics.risk_level}</span>
            </div>
          </div>

          {/* Card 2: Revenue at Risk */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>ANNUAL REVENUE AT RISK</span>
              <DollarSign size={16} color="var(--status-critical)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--status-critical)' }}>
                -${site.metrics.estimated_revenue_loss_usd.toLocaleString()}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/yr</span>
            </div>
          </div>

          {/* Card 3: Derating Hours */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>DERATING HOURS (&gt;35°C)</span>
              <Clock size={16} color="var(--status-warning)" />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--status-warning)' }}>
                {site.metrics.annual_derating_hours}
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>hrs/year</span>
            </div>
          </div>

          {/* Card 4: Shade Coverage */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>NATURAL SHADE CANOPY</span>
              <Sun size={16} color={site.metrics.shade_coverage_pct > 15 ? 'var(--status-optimal)' : 'var(--status-critical)'} />
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="mono" style={{ fontSize: 36, fontWeight: 800, color: site.metrics.shade_coverage_pct > 15 ? 'var(--status-optimal)' : 'var(--status-critical)' }}>
                {site.metrics.shade_coverage_pct}%
              </span>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>of parcel lot</span>
            </div>
          </div>
        </div>

        {/* Interactive Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: 24 }}>
          
          {/* Chart 1: Heat Dissipation Donut */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              HEAT DISSIPATION RATIO
            </span>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160, position: 'relative' }}>
              <svg width="130" height="130" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--bg-border)" strokeWidth="3.5" />
                <circle
                  cx="18" cy="18" r="15.915" fill="none" stroke="var(--brand-orange)" strokeWidth="3.5"
                  strokeDasharray={`${site.charts.heat_retained_pct} ${100 - site.charts.heat_retained_pct}`}
                  strokeDashoffset="25"
                  strokeLinecap="round"
                />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 20, fontWeight: 800, color: 'var(--brand-orange)' }}>
                  {site.charts.heat_retained_pct}%
                </span>
                <span style={{ fontSize: 9, color: 'var(--text-muted)', fontWeight: 700 }}>HEAT TRAPPED</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, borderTop: '1px solid var(--bg-border)', paddingTop: 10 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }} />
                Retained Thermal Load
              </span>
              <span className="mono" style={{ fontWeight: 700 }}>{site.charts.heat_retained_pct}%</span>
            </div>
          </div>

          {/* Chart 2: Monthly Throttling Hours */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                MONTHLY DERATING HOURS
              </span>
              {hoveredBar !== null && (
                <span style={{ fontSize: 11, color: 'var(--brand-orange)', fontWeight: 700 }} className="mono">
                  {hoveredBar.month}: {hoveredBar.hours} hrs throttled
                </span>
              )}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              height: 160,
              paddingBottom: 10,
              gap: 8
            }}>
              {site.charts.monthly_throttling_hours.map((val, i) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
                const heightPct = Math.min(100, Math.max(10, (val / 150) * 100));
                const isSummerPeak = i >= 4 && i <= 6;

                return (
                  <div
                    key={i}
                    onMouseEnter={() => setHoveredBar({ month: months[i], hours: val })}
                    onMouseLeave={() => setHoveredBar(null)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 6,
                      flex: 1,
                      cursor: 'pointer'
                    }}
                  >
                    <div style={{
                      width: '100%',
                      maxWidth: 24,
                      height: `${heightPct}%`,
                      backgroundColor: isSummerPeak ? 'var(--brand-orange)' : 'rgba(255, 107, 0, 0.4)',
                      borderRadius: '3px 3px 0 0',
                      boxShadow: isSummerPeak ? '0 0 10px rgba(255, 107, 0, 0.5)' : 'none',
                      transition: 'height 0.3s'
                    }} />
                    <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 10 }}>
              <span>Summer Peak Window (Jun–Aug)</span>
              <span className="mono" style={{ color: 'var(--status-critical)', fontWeight: 700 }}>Severe Risk Zone</span>
            </div>
          </div>

          {/* Chart 3: Temperature vs Efficiency Curve */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              EFFICIENCY DERATING CURVE
            </span>
            <div style={{ height: 160, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="100%" height="130" viewBox="0 0 100 50" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="curveGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#10B981" />
                    <stop offset="50%" stopColor="#F59E0B" />
                    <stop offset="100%" stopColor="#EF4444" />
                  </linearGradient>
                </defs>
                {/* 100% baseline */}
                <line x1="0" y1="5" x2="100" y2="5" stroke="rgba(255,255,255,0.08)" strokeDasharray="2 2" />
                {/* Derating curve */}
                <path d="M 0 5 Q 40 8 60 25 T 100 45" fill="none" stroke="url(#curveGrad)" strokeWidth="2.5" />
                <circle cx="60" cy="25" r="3" fill="#F59E0B" />
                <circle cx="100" cy="45" r="3" fill="#EF4444" />
              </svg>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-muted)', borderTop: '1px solid var(--bg-border)', paddingTop: 10 }}>
              <span>75°F (100% Rate)</span>
              <span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>115°F (48% Rate)</span>
            </div>
          </div>
        </div>

        {/* Charger Nodes Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '16px 24px',
            borderBottom: '1px solid var(--bg-border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div>
              <h4 style={{ fontSize: 15, fontWeight: 800, color: '#fff' }}>Charger Dispenser Nodes</h4>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Live telemetry simulation across candidate lot stalls</span>
            </div>
            <span style={{
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--bg-border)',
              borderRadius: 6,
              padding: '4px 10px',
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)'
            }} className="mono">
              {site.charger_nodes.length} DISPENSERS MONITORED
            </span>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-border)', fontWeight: 600, fontSize: 11 }}>
                <th style={{ padding: '12px 24px' }}>STATION IDENTIFIER</th>
                <th style={{ padding: '12px 24px' }}>MAX POWER</th>
                <th style={{ padding: '12px 24px' }}>PEAK AMBIENT</th>
                <th style={{ padding: '12px 24px' }}>DERATING STATUS</th>
                <th style={{ padding: '12px 24px', textAlign: 'right' }}>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {site.charger_nodes.map((node, i) => {
                const isCrit = node.status === 'Critical';
                const color = isCrit ? 'var(--status-critical)' : 'var(--status-optimal)';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '14px 24px', fontWeight: 600, color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: color }} />
                        {node.station_id}
                      </div>
                    </td>
                    <td style={{ padding: '14px 24px' }} className="mono">{node.max_load_kw} kW</td>
                    <td style={{ padding: '14px 24px', color: isCrit ? 'var(--status-critical)' : '#fff' }} className="mono">
                      {node.peak_temp_f}°F
                    </td>
                    <td style={{ padding: '14px 24px' }}>
                      <span style={{
                        color: color,
                        backgroundColor: `rgba(${isCrit ? '239,68,68' : '16,185,129'}, 0.1)`,
                        border: `1px solid ${color}`,
                        borderRadius: 4,
                        padding: '3px 8px',
                        fontSize: 10,
                        fontWeight: 700
                      }}>
                        {node.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '14px 24px', textAlign: 'right' }}>
                      <button
                        onClick={() => navigate(`/editor/${site.site_id}`)}
                        style={{
                          background: 'none',
                          border: '1px solid var(--bg-border)',
                          borderRadius: 6,
                          color: 'var(--brand-orange)',
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        Apply Mitigation &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        siteId={site.site_id}
      />
    </div>
  );
}
