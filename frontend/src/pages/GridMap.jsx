import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, ZoomIn, ZoomOut, Layers, AlertTriangle, CheckCircle, TrendingDown } from 'lucide-react';
import { setMapTileLayer, createRiskPin } from '../utils/mapConfig.js';

export default function GridMap({ sites, user, onLogout }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [mapLayer, setMapLayer] = useState('osmDark'); // 'osmDark' | 'esriSatellite'
  const navigate = useNavigate();

  // Aggregate stats
  const criticalCount = sites.filter(s => s.metrics.thermal_siting_score < 50).length;
  const optimalCount = sites.filter(s => s.metrics.thermal_siting_score >= 75).length;
  const totalLoss = sites.reduce((sum, s) => sum + s.metrics.estimated_revenue_loss_usd, 0);

  useEffect(() => {
    if (!mapRef.current) return;

    // Prevent duplicate map initialization
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // US Continental Boundary Bounds for FortyGuard LTM Coverage
    const usBounds = L.latLngBounds(
      [24.0, -125.0], // South-West (Key West / San Diego)
      [49.5, -66.5]   // North-East (Maine / Washington state)
    );

    // Initialize leaflet map centered and locked strictly to US territory
    const map = L.map(mapRef.current, {
      zoomControl: false,
      minZoom: 4.5,
      maxZoom: 16,
      maxBounds: usBounds,
      maxBoundsViscosity: 1.0 // Prevents panning outside US bounds
    }).setView([38.8, -96.5], 5);

    mapInstanceRef.current = map;

    // Apply clean tile layer
    setMapTileLayer(map, mapLayer);

    // Plot candidate markers
    sites.forEach(site => {
      const pinIcon = createRiskPin(site.metrics.thermal_siting_score);

      const isCritical = site.metrics.thermal_siting_score < 50;
      const isOptimal = site.metrics.thermal_siting_score >= 75;
      const scoreColor = isCritical ? '#EF4444' : (isOptimal ? '#10B981' : '#F59E0B');
      const badgeText = isCritical ? 'CRITICAL RISK' : (isOptimal ? 'OPTIMAL' : 'MEDIUM RISK');

      const popupContent = `
        <div style="
          color: #FFFFFF;
          font-family: 'Inter', sans-serif;
          min-width: 220px;
          line-height: 1.4;
        ">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px;">
            <strong style="font-size: 14px; color: #FFFFFF;">${site.site_name}</strong>
            <span style="
              font-size: 10px;
              font-weight: 800;
              color: ${scoreColor};
              background: rgba(255, 255, 255, 0.06);
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid ${scoreColor};
            ">${badgeText}</span>
          </div>
          <div style="font-size: 11px; color: #94A3B8; margin-bottom: 10px;">${site.location}</div>
          
          <div style="
            background: rgba(0, 0, 0, 0.4);
            border-radius: 6px;
            padding: 8px 10px;
            margin-bottom: 10px;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            font-size: 11px;
          ">
            <div>
              <span style="color: #64748B; display: block; font-size: 10px;">TSS SCORE</span>
              <strong style="font-size: 16px; color: ${scoreColor}; font-family: monospace;">${site.metrics.thermal_siting_score}</strong>
            </div>
            <div>
              <span style="color: #64748B; display: block; font-size: 10px;">ANNUAL LOSS</span>
              <strong style="font-size: 14px; color: #EF4444; font-family: monospace;">-$${(site.metrics.estimated_revenue_loss_usd / 1000).toFixed(1)}k</strong>
            </div>
          </div>

          <a href="/sandbox/${site.site_id}" style="
            display: block;
            text-align: center;
            background-color: #FF6B00;
            color: #FFFFFF;
            text-decoration: none;
            font-size: 12px;
            font-weight: 700;
            padding: 8px 12px;
            border-radius: 6px;
            box-shadow: 0 0 10px rgba(255, 107, 0, 0.3);
          ">Open Thermal Sandbox &rarr;</a>
        </div>
      `;

      const marker = L.marker([site.latitude, site.longitude], { icon: pinIcon }).addTo(map);

      const customPopup = L.popup({
        className: 'vs-dark-popup',
        closeButton: false,
        minWidth: 230
      }).setContent(popupContent);

      marker.bindPopup(customPopup);

      // Open Vegas or first critical popup by default
      if (site.site_id === 'site_001') {
        setTimeout(() => {
          marker.openPopup();
        }, 400);
      }
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [sites, mapLayer]);

  const toggleLayer = () => {
    setMapLayer(prev => prev === 'osmDark' ? 'esriSatellite' : 'osmDark');
  };

  const zoomIn = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomIn();
  };

  const zoomOut = () => {
    if (mapInstanceRef.current) mapInstanceRef.current.zoomOut();
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#0D0D11' }}>
      <Sidebar user={user} onLogout={onLogout} firstSiteId={sites[0]?.site_id} />

      <div style={{ flex: 1, marginLeft: 240, position: 'relative', height: '100vh', overflow: 'hidden' }}>
        
        {/* Header Overlay */}
        <header style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 1000,
          display: 'flex',
          gap: 16,
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'rgba(22, 23, 28, 0.92)',
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: '10px 20px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Compass size={18} color="var(--brand-orange)" />
            <span style={{ fontWeight: 800, fontSize: 14, color: '#FFFFFF' }}>US Grid Map • FortyGuard 10m LTM Coverage</span>
          </div>

          {/* Layer switcher button */}
          <button
            onClick={toggleLayer}
            style={{
              backgroundColor: 'rgba(22, 23, 28, 0.92)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: '10px 16px',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              color: mapLayer === 'esriSatellite' ? 'var(--brand-orange)' : '#FFFFFF',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Layers size={16} />
            {mapLayer === 'esriSatellite' ? 'Satellite Aerial View' : 'Dark Mode Street Map'}
          </button>
        </header>

        {/* Floating Top-Right Stats Overlay matching Screen 3 Mockup */}
        <div style={{
          position: 'absolute',
          top: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: 'rgba(22, 23, 28, 0.92)',
          border: '1px solid var(--bg-border)',
          borderRadius: 12,
          padding: '14px 20px',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: 24,
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>CANDIDATES</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#fff' }} className="mono">{sites.length} SITES</span>
          </div>
          <div style={{ width: 1, height: 28, backgroundColor: 'var(--bg-border)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: 'var(--status-critical)', fontWeight: 700, letterSpacing: '0.05em' }}>HIGH RISK</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-critical)' }} className="mono">{criticalCount}</span>
          </div>
          <div style={{ width: 1, height: 28, backgroundColor: 'var(--bg-border)' }}></div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '0.05em' }}>REVENUE AT RISK</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: 'var(--status-warning)' }} className="mono">${(totalLoss / 1000).toFixed(1)}k</span>
          </div>
        </div>

        {/* Live Leaflet Map Container */}
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Legend bottom right */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: 'rgba(22, 23, 28, 0.92)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          padding: '12px 16px',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          gap: 18,
          fontSize: 12,
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--status-critical)', boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)' }} />
            Critical Risk (TSS &lt; 50)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--status-warning)', boxShadow: '0 0 8px rgba(245, 158, 11, 0.6)' }} />
            Medium Risk (50-74)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: 'var(--status-optimal)', boxShadow: '0 0 8px rgba(16, 185, 129, 0.6)' }} />
            Optimal (75+)
          </div>
        </div>

        {/* Map controls bottom left */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: 8
        }}>
          <button className="btn-secondary" onClick={zoomIn} style={{ padding: 10, borderRadius: 8, display: 'flex' }} title="Zoom In">
            <ZoomIn size={16} />
          </button>
          <button className="btn-secondary" onClick={zoomOut} style={{ padding: 10, borderRadius: 8, display: 'flex' }} title="Zoom Out">
            <ZoomOut size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
