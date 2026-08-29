import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import ExportModal from './ExportModal.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { getCopilotResponse } from '../mockData.js';
import { FileText, Edit, ShieldAlert, DollarSign, MessageSquare, Send, Settings } from 'lucide-react';

export default function Sandbox({ sites, user, onLogout }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showExportModal, setShowExportModal] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [chatLogs, setChatLogs] = useState([
    { sender: 'copilot', text: 'VoltShield Copilot Online. Ask me about thermal derating, canopies, or albedo calculations.' }
  ]);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const site = sites.find(s => s.site_id === id) || sites[0];

  useEffect(() => {
    if (!site || !mapRef.current) return;

    // Create Leaflet map centered close-up on the site coordinates
    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: false // disable scrolling so it doesn't hijack dashboard scroll
    }).setView([site.latitude, site.longitude], 17);

    mapInstanceRef.current = map;

    // Load CartoDB Dark Matter tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
    }).addTo(map);

    // Color code base on TSS
    const isCritical = site.metrics.thermal_siting_score < 50;
    const isOptimal = site.metrics.thermal_siting_score >= 80;
    const riskColor = isCritical ? '#EF4444' : (isOptimal ? '#10B981' : '#F59E0B');

    // Simulate FortyGuard Heatmap Layers (Adding circles representing hot spots)
    const hotSpots = [
      { coords: [site.latitude + 0.0002, site.longitude - 0.0002], radius: 25, color: '#EF4444', opacity: 0.5 },
      { coords: [site.latitude - 0.0001, site.longitude + 0.0003], radius: 35, color: '#EF4444', opacity: 0.4 },
      { coords: [site.latitude + 0.0001, site.longitude + 0.0001], radius: 45, color: '#F59E0B', opacity: 0.3 }
    ];

    hotSpots.forEach(spot => {
      L.circle(spot.coords, {
        color: 'transparent',
        fillColor: spot.color,
        fillOpacity: spot.opacity,
        radius: spot.radius
      }).addTo(map);
    });

    // Plot charger node pins
    const nodeIcon = L.divIcon({
      className: 'vs-charger-pin',
      html: `
        <div style="
          width: 14px; 
          height: 14px; 
          border-radius: 50%; 
          background-color: #3B82F6; 
          border: 2px solid #FFFFFF; 
          box-shadow: 0 0 8px #3B82F6;
        "></div>
      `,
      iconSize: [14, 14],
      iconAnchor: [7, 7]
    });

    // Place 3 charger points around the center
    const chargerOffsets = [
      [0.00005, -0.00005],
      [-0.00005, 0.00005],
      [0.00005, 0.0001]
    ];

    chargerOffsets.forEach((offset, idx) => {
      L.marker([site.latitude + offset[0], site.longitude + offset[1]], { icon: nodeIcon })
        .addTo(map)
        .bindPopup(`<strong style="color:#FFFFFF;">Stall N-${idx + 1}</strong><br/><span style="color:var(--text-muted);">Tritium Veefil 150kW</span>`);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [site]);

  if (!site) return <div>No sites found. Please create one.</div>;

  const handleSendChat = (e) => {
    e.preventDefault();
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

  const isCritical = site.metrics.thermal_siting_score < 50;
  const isOptimal = site.metrics.thermal_siting_score >= 80;
  const riskColor = isCritical ? 'var(--status-critical)' : (isOptimal ? 'var(--status-optimal)' : 'var(--status-warning)');

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0D0D11' }}>
      <Sidebar user={user} onLogout={onLogout} firstSiteId={site.site_id} />

      <div style={{ flex: 1, marginLeft: 240, padding: 32, display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Header */}
        <header style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--bg-border)',
          paddingBottom: 20
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: '#fff' }}>Thermal Siting Analysis</h2>
            <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Site: {site.site_name}</span>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => setShowExportModal(true)}>
              <FileText size={16} /> Export PDF
            </button>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }} onClick={() => navigate(`/editor/${site.site_id}`)}>
              <Edit size={16} /> Edit Site
            </button>
          </div>
        </header>

        {/* Map and Copilot Split Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 24 }}>
          {/* Map Area */}
          <div style={{
            height: 380,
            borderRadius: 16,
            border: '1px solid var(--bg-border)',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* Live Leaflet Map Container */}
            <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

            {/* Overlays top left */}
            <div style={{
              position: 'absolute',
              top: 16,
              left: 16,
              zIndex: 1000,
              backgroundColor: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid var(--status-critical)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              backdropFilter: 'blur(4px)'
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--status-critical)' }}></span>
              2 stalls exceeding thermal threshold
            </div>

            {/* Map buttons bottom */}
            <div style={{ position: 'absolute', bottom: 16, left: 16, zIndex: 1000, display: 'flex', gap: 10 }}>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'rgba(22, 23, 28, 0.85)' }}>Toggle heatmap layers</button>
              <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 11, backgroundColor: 'rgba(22, 23, 28, 0.85)' }}>Zoom to chargers</button>
            </div>
          </div>

          {/* VoltShield Copilot Card */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', height: 380, padding: 20, gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <MessageSquare size={18} color="var(--brand-orange)" />
                <strong style={{ fontSize: 14, color: '#fff' }}>VoltShield Copilot</strong>
              </div>
              <span style={{ fontSize: 10, color: 'var(--status-optimal)', fontWeight: 700 }}>ONLINE</span>
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
                    backgroundColor: msg.sender === 'copilot' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(255, 107, 0, 0.08)',
                    border: msg.sender === 'copilot' ? '1px solid var(--bg-border)' : '1px solid rgba(255, 107, 0, 0.2)',
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 12,
                    lineHeight: 1.4,
                    alignSelf: msg.sender === 'copilot' ? 'flex-start' : 'flex-end',
                    maxWidth: '85%'
                  }}
                >
                  <span style={{
                    fontWeight: 700,
                    fontSize: 10,
                    color: msg.sender === 'copilot' ? 'var(--brand-orange)' : '#fff',
                    display: 'block',
                    marginBottom: 4
                  }}>
                    {msg.sender === 'copilot' ? 'COPILOT DIAGNOSTIC' : 'YOU'}
                  </span>
                  {msg.text}
                </div>
              ))}
            </div>

            {/* Input field */}
            <form onSubmit={handleSendChat} style={{ display: 'flex', gap: 10 }}>
              <input
                type="text"
                value={chatQuery}
                onChange={e => setChatQuery(e.target.value)}
                placeholder="Ask about siting, mitigation or revenue..."
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
              <button type="submit" className="btn-primary" style={{ padding: 10, borderRadius: 8 }}><Send size={16} /></button>
            </form>
          </div>
        </div>

        {/* Scores & Financials Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 24 }}>
          {/* Siting Score Card */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Thermal Siting Score (TSS)</span>
              <span style={{ fontSize: 12, color: 'var(--text-dark)' }}>Heat dissipation index across all stalls</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span className="mono" style={{ fontSize: 36, fontWeight: 800 }}>{site.metrics.thermal_siting_score}</span>
                <span style={{ fontSize: 16, color: 'var(--text-dark)' }}>/100</span>
                <span style={{
                  color: riskColor,
                  fontSize: 11,
                  fontWeight: 700,
                  backgroundColor: `rgba(${isCritical ? '239,68,68' : '245,158,11'}, 0.1)`,
                  border: `1px solid ${riskColor}`,
                  borderRadius: 4,
                  padding: '2px 6px',
                  marginLeft: 8
                }}>{site.metrics.risk_level}</span>
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.05)', border: `1px solid ${riskColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={20} color={riskColor} />
            </div>
          </div>

          {/* Revenue Loss Card */}
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>Estimated Annual Revenue Loss</span>
              <span style={{ fontSize: 12, color: 'var(--text-dark)' }}>Due to thermal derating events</span>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginTop: 12 }}>
                <span className="mono" style={{ fontSize: 36, fontWeight: 800, color: 'var(--status-critical)' }}>
                  -${site.metrics.estimated_revenue_loss_usd.toLocaleString()}
                </span>
                <svg width="40" height="20" style={{ marginLeft: 8 }}>
                  <path d="M 0 5 Q 10 15 20 10 T 40 18" fill="none" stroke="var(--status-critical)" strokeWidth="2" />
                </svg>
              </div>
            </div>
            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'rgba(245, 158, 11, 0.05)', border: '1px solid var(--status-warning)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <DollarSign size={20} color="var(--status-warning)" />
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 24 }}>
          {/* Chart 1 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Heat Dissipation Ratio</span>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 160, position: 'relative' }}>
              <svg width="120" height="120" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--bg-border)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.915" fill="none" stroke="var(--brand-orange)" strokeWidth="3"
                        strokeDasharray={`${site.charts.heat_retained_pct} ${100 - site.charts.heat_retained_pct}`}
                        strokeDashoffset="25" />
              </svg>
              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span className="mono" style={{ fontSize: 16, fontWeight: 700 }}>{site.charts.heat_retained_pct}%</span>
                <span style={{ fontSize: 9, color: 'var(--text-dark)' }}>HEAT RETAINED</span>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }}></span> Heat Retained</span>
              <span className="mono">{site.charts.heat_retained_pct}%</span>
            </div>
          </div>

          {/* Chart 2 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Monthly Throttling Hours</span>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: 160, paddingBottom: 16 }}>
              {site.charts.monthly_throttling_hours.map((val, i) => {
                const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
                const h = (val / 160) * 120;
                return (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flex: 1 }}>
                    <div style={{
                      width: 12,
                      height: h,
                      backgroundColor: 'var(--brand-orange)',
                      borderRadius: '2px 2px 0 0'
                    }} />
                    <span style={{ fontSize: 9, color: 'var(--text-dark)' }}>{months[i]}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Chart 3 */}
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)' }}>Temp vs. Efficiency</span>
            <div style={{ height: 160, position: 'relative' }}>
              <svg width="100%" height="130" viewBox="0 0 100 50" preserveAspectRatio="none">
                <path d="M 0 45 L 20 40 L 40 30 L 60 20 L 80 10 L 100 5" fill="none" stroke="var(--status-critical)" strokeWidth="1.5" />
                <path d="M 0 5 L 20 8 L 40 15 L 60 25 L 80 38 L 100 45" fill="none" stroke="var(--status-optimal)" strokeWidth="1.5" />
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-dark)', marginTop: 8 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 2, backgroundColor: 'var(--status-optimal)' }}></span> Efficiency</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 12, height: 2, backgroundColor: 'var(--status-critical)' }}></span> Temp Trend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charger Nodes Table */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--bg-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>Charger Nodes</h4>
            <button className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>Filter</button>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--bg-border)', fontWeight: 600 }}>
                <th style={{ padding: '12px 24px' }}>STATION ID</th>
                <th style={{ padding: '12px 24px' }}>MAX LOAD</th>
                <th style={{ padding: '12px 24px' }}>PEAK TEMP</th>
                <th style={{ padding: '12px 24px' }}>STATUS</th>
                <th style={{ padding: '12px 24px', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {site.charger_nodes.map((node, i) => {
                const isCrit = node.status === 'Critical';
                const color = isCrit ? 'var(--status-critical)' : 'var(--status-optimal)';
                return (
                  <tr key={i} style={{ borderBottom: '1px solid var(--bg-border)' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 600, color: '#fff' }}>{node.station_id}</td>
                    <td style={{ padding: '16px 24px' }} className="mono">{node.max_load_kw} kW</td>
                    <td style={{ padding: '16px 24px', color: isCrit ? 'var(--status-critical)' : '#fff' }} className="mono">{node.peak_temp_f}°F</td>
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        color: color,
                        backgroundColor: `rgba(${isCrit ? '239,68,68' : '16,185,129'}, 0.1)`,
                        border: `1px solid ${color}`,
                        borderRadius: 4,
                        padding: '2px 6px',
                        fontSize: 10,
                        fontWeight: 700
                      }}>{node.status}</span>
                    </td>
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <button style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><Settings size={16} /></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ExportModal isOpen={showExportModal} onClose={() => setShowExportModal(false)} siteId={site.site_id} />
    </div>
  );
}
