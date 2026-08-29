import React, { useEffect, useRef } from 'react';
import Sidebar from '../components/Sidebar.jsx';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Compass, ZoomIn, ZoomOut } from 'lucide-react';

export default function GridMap({ sites, user, onLogout }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Initialize leaflet map centered on USA
    const map = L.map(mapRef.current, {
      zoomControl: false // Disable default zoom control so we can position it custom
    }).setView([38.5, -98.0], 4);

    mapInstanceRef.current = map;

    // Load OpenStreetMap tiles (dark mode handled by CSS filters)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 20
    }).addTo(map);

    // Color definitions matching CSS tokens
    const getPinColor = (score) => {
      if (score < 50) return '#EF4444'; // Red
      if (score < 75) return '#F59E0B'; // Amber
      return '#10B981'; // Green
    };

    // Plot candidate markers
    sites.forEach(site => {
      const pinColor = getPinColor(site.metrics.thermal_siting_score);

      // Create a themed custom HTML div icon to avoid Vite default marker resolution bugs
      const customIcon = L.divIcon({
        className: 'voltshield-custom-pin',
        html: `
          <div style="
            width: 20px; 
            height: 20px; 
            border-radius: 50%; 
            background-color: ${pinColor}; 
            border: 2.5px solid #0D0D11; 
            box-shadow: 0 0 12px ${pinColor};
            display: flex;
            align-items: center;
            justify-content: center;
          ">
            <div style="width: 5px; height: 5px; border-radius: 50%; backgroundColor: #ffffff;"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });

      const popupContent = `
        <div style="
          color: #FFFFFF; 
          font-family: 'Inter', sans-serif; 
          font-size: 13px;
          line-height: 1.4;
          padding: 2px;
        ">
          <strong style="font-size: 14px; display: block; margin-bottom: 6px; color: #FFFFFF;">${site.site_name}</strong>
          <div style="margin-bottom: 4px;">
            TSS Score: <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: ${pinColor};">${site.metrics.thermal_siting_score}</span>
          </div>
          <div>
            Est. Loss: <span style="font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #EF4444;">-$${site.metrics.estimated_revenue_loss_usd.toLocaleString()}/yr</span>
          </div>
        </div>
      `;

      // Create and bind marker
      const marker = L.marker([site.latitude, site.longitude], { icon: customIcon }).addTo(map);
      
      // Leaflet popup options for dark theme
      const customPopup = L.popup({
        className: 'vs-dark-popup',
        closeButton: false,
        minWidth: 200
      }).setContent(popupContent);

      marker.bindPopup(customPopup);

      // Open Vegas popup by default to match Screen 3 reference design
      if (site.site_id === 'site_004') {
        setTimeout(() => {
          marker.openPopup();
        }, 300);
      }
    });

    return () => {
      map.remove();
    };
  }, [sites]);

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
        
        {/* Header overlays map */}
        <header style={{
          position: 'absolute',
          top: 24,
          left: 24,
          zIndex: 1000, // Make sure it sits on top of Leaflet layers (z-index 400+)
          display: 'flex',
          gap: 16
        }}>
          <div style={{
            backgroundColor: 'rgba(22, 23, 28, 0.95)',
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: '12px 24px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <Compass size={18} color="var(--brand-orange)" />
            <span style={{ fontWeight: 700, fontSize: 15 }}>Siting Feasibility Map</span>
          </div>
        </header>

        {/* Live Leaflet Map Container */}
        <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

        {/* Legend bottom right */}
        <div style={{
          position: 'absolute',
          bottom: 24,
          right: 24,
          zIndex: 1000,
          backgroundColor: 'rgba(22, 23, 28, 0.9)',
          border: '1px solid var(--bg-border)',
          borderRadius: 8,
          padding: '12px 16px',
          display: 'flex',
          gap: 16,
          fontSize: 12,
          color: 'var(--text-muted)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--status-critical)' }} />
            Critical Risk
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--status-warning)' }} />
            Caution
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--status-optimal)' }} />
            Optimal
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
          <button className="btn-secondary" onClick={zoomIn} style={{ padding: 10, borderRadius: 8, display: 'flex' }}><ZoomIn size={16} /></button>
          <button className="btn-secondary" onClick={zoomOut} style={{ padding: 10, borderRadius: 8, display: 'flex' }}><ZoomOut size={16} /></button>
        </div>
      </div>

      {/* Inject Leaflet dark theme override css styles */}
      <style>{`
        .leaflet-popup-content-wrapper, .leaflet-popup-tip {
          background-color: #16171C !important;
          border: 1px solid var(--bg-border) !important;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.7) !important;
          border-radius: 12px !important;
        }
        .vs-dark-popup .leaflet-popup-content {
          margin: 12px 16px !important;
        }
      `}</style>
    </div>
  );
}
