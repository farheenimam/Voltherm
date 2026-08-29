import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Save, Sun, TreePine, Paintbrush, Zap, Check,
  ShieldCheck, Layers, AlertTriangle, ChevronDown, CheckCircle2,
  DollarSign, Clock, Thermometer, Maximize2, RotateCcw
} from 'lucide-react';
import { simulateMitigations } from '../mockData.js';
import { saveMitigations } from '../services/api.js';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { setMapTileLayer, createChargerNodePin, createOrangeLocationPin } from '../utils/mapConfig.js';

export default function Editor({ sites, onUpdateSite }) {
  const { id } = useParams();
  const navigate = useNavigate();

  // Find currently selected site or fallback
  const site = sites.find(s => s.site_id === id) || sites[0];

  // Active mitigations state
  const [selectedMitigations, setSelectedMitigations] = useState([
    { type: 'Solar Canopy', coverage_pct: 100 }
  ]);

  // Layer toggles
  const [mapLayer, setMapLayer] = useState('esriSatellite'); // 'esriSatellite' | 'osmDark'
  const [showHotspots, setShowHotspots] = useState(true);
  const [showCanopyLayer, setShowCanopyLayer] = useState(true);
  const [showStallPins, setShowStallPins] = useState(true);
  const [selectedStallInfo, setSelectedStallInfo] = useState(null);
  const [saveToast, setSaveToast] = useState(false);

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const layersGroupRef = useRef(null);

  // Switch site handler
  const handleSwitchSite = (newSiteId) => {
    navigate(`/editor/${newSiteId}`);
  };

  // Mitigation toggle
  const handleToggleMitigation = (type) => {
    const exists = selectedMitigations.some(m => m.type === type);
    if (exists) {
      setSelectedMitigations(prev => prev.filter(m => m.type !== type));
    } else {
      setSelectedMitigations(prev => [...prev, { type, coverage_pct: 100 }]);
    }
  };

  // Quick Presets
  const applyPreset = (presetType) => {
    if (presetType === 'MAX') {
      setSelectedMitigations([
        { type: 'Solar Canopy', coverage_pct: 100 },
        { type: 'Cool Reflective Paint', coverage_pct: 100 },
        { type: 'Live Tree Wall', coverage_pct: 100 }
      ]);
    } else if (presetType === 'CANOPY_ONLY') {
      setSelectedMitigations([{ type: 'Solar Canopy', coverage_pct: 100 }]);
    } else if (presetType === 'PAINT_ONLY') {
      setSelectedMitigations([{ type: 'Cool Reflective Paint', coverage_pct: 100 }]);
    } else if (presetType === 'RESET') {
      setSelectedMitigations([]);
    }
  };

  const hasCanopy = selectedMitigations.some(m => m.type === 'Solar Canopy');
  const hasTree = selectedMitigations.some(m => m.type === 'Live Tree Wall');
  const hasPaint = selectedMitigations.some(m => m.type === 'Cool Reflective Paint');
  const hasLiquid = selectedMitigations.some(m => m.type === 'Liquid-Cooled Cable Retrofit');

  // Math simulation calculations
  const sim = simulateMitigations(site, selectedMitigations);
  const currentTss = selectedMitigations.length > 0 ? sim.tss_after : site.metrics.thermal_siting_score;
  const currentLoss = selectedMitigations.length > 0 ? sim.annual_revenue_loss_after_usd : site.metrics.estimated_revenue_loss_usd;
  const savings = selectedMitigations.length > 0 ? sim.annual_savings_usd : 0;
  const scoreDiff = currentTss - site.metrics.thermal_siting_score;
  const deratingHoursAfter = sim.derating_hours_after ?? Math.round(site.metrics.annual_derating_hours * (currentLoss / (site.metrics.estimated_revenue_loss_usd || 1)));

  // Estimated capex
  const capex = (hasCanopy ? 16000 : 0) + (hasPaint ? 2800 : 0) + (hasTree ? 3500 : 0) + (hasLiquid ? 8000 : 0);
  const paybackMonths = savings > 0 ? Math.round((capex / savings) * 12) : 0;
  const isNeviCompliant = currentTss >= 75;

  // Initialize and update accurate Geo-Spatial Leaflet Map
  useEffect(() => {
    if (!site || !mapRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Centered accurately at site coordinates
    const map = L.map(mapRef.current, {
      zoomControl: false,
      scrollWheelZoom: true
    }).setView([site.latitude, site.longitude], 18);

    mapInstanceRef.current = map;

    // Apply clean tile layer
    setMapTileLayer(map, mapLayer);

    const layersGroup = L.layerGroup().addTo(map);
    layersGroupRef.current = layersGroup;

    // 1. Hotspot Heat Zone (Unmitigated vs Mitigated buffer)
    if (showHotspots) {
      if (hasCanopy) {
        // Shaded cool buffer
        L.circle([site.latitude, site.longitude], {
          color: '#10B981',
          fillColor: '#10B981',
          fillOpacity: 0.25,
          radius: 35
        }).addTo(layersGroup).bindPopup('<strong>Solar Shaded Microclimate</strong><br/>Surface temp attenuated to 84°F.');
      } else {
        // High heat hotspot
        L.circle([site.latitude, site.longitude], {
          color: '#EF4444',
          fillColor: '#EF4444',
          fillOpacity: 0.45,
          radius: 40
        }).addTo(layersGroup).bindPopup('<strong>FortyGuard Extreme Heat Plume</strong><br/>Exceeds 35°C derating threshold for 380+ hrs/yr.');
      }
    }

    // 2. High-Albedo Sealcoat Parcel Polygon
    if (hasPaint) {
      const paintPolygon = [
        [site.latitude + 0.00025, site.longitude - 0.00030],
        [site.latitude + 0.00025, site.longitude + 0.00030],
        [site.latitude - 0.00025, site.longitude + 0.00030],
        [site.latitude - 0.00025, site.longitude - 0.00030]
      ];
      L.polygon(paintPolygon, {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.2,
        weight: 1.5,
        dashArray: '4, 4'
      }).addTo(layersGroup).bindPopup('<strong>Cool Polymer Sealcoat Applied</strong><br/>Albedo raised to 0.78 (SRI 82).');
    }

    // 3. Solar Canopy Roof Polygon
    if (hasCanopy && showCanopyLayer) {
      const canopyPolygon = [
        [site.latitude + 0.00015, site.longitude - 0.00022],
        [site.latitude + 0.00015, site.longitude + 0.00022],
        [site.latitude - 0.00015, site.longitude + 0.00022],
        [site.latitude - 0.00015, site.longitude - 0.00022]
      ];
      L.polygon(canopyPolygon, {
        color: '#FF6B00',
        fillColor: '#FF6B00',
        fillOpacity: 0.35,
        weight: 2.5
      }).addTo(layersGroup).bindPopup(`
        <div style="color: #fff; font-size: 12px; line-height: 1.4;">
          <strong style="color: #FF6B00;">Bifacial 45kW Solar Canopy</strong><br/>
          <span>Coverage: Stalls 1–${site.stall_count}</span><br/>
          <span>GHI Solar Attenuation: 85%</span><br/>
          <span style="color: #10B981; font-weight: 700;">Prevents 90% of Summer Curtailment</span>
        </div>
      `);
    }

    // 4. Perimeter Tree Row
    if (hasTree) {
      const treeOffsets = [
        [0.00028, -0.00025],
        [0.00028, 0.00000],
        [0.00028, 0.00025],
        [-0.00028, -0.00025],
        [-0.00028, 0.00000],
        [-0.00028, 0.00025]
      ];
      treeOffsets.forEach(offset => {
        const treeIcon = L.divIcon({
          className: 'vs-tree-icon',
          html: `<div style="background:#10B981; width:16px; height:16px; border-radius:50%; border:2px solid #fff; box-shadow:0 0 8px #10B981;"></div>`,
          iconSize: [16, 16],
          iconAnchor: [8, 8]
        });
        L.marker([site.latitude + offset[0], site.longitude + offset[1]], { icon: treeIcon })
          .addTo(layersGroup)
          .bindPopup('<strong>Live Vegetative Buffer</strong><br/>Mitigates crosswind heat.');
      });
    }

    // 5. Charger Dispenser Stalls Pins
    if (showStallPins) {
      const stallOffsets = [
        [-0.00008, -0.00015],
        [-0.00008, -0.00005],
        [-0.00008, 0.00005],
        [-0.00008, 0.00015],
        [0.00008, -0.00015],
        [0.00008, -0.00005],
        [0.00008, 0.00005],
        [0.00008, 0.00015]
      ];

      stallOffsets.slice(0, site.stall_count).forEach((offset, idx) => {
        const stallNum = idx + 1;
        const isCriticalWithoutCanopy = !hasCanopy && (idx === 0 || idx === 1);
        const stallIcon = createChargerNodePin(isCriticalWithoutCanopy);

        const marker = L.marker([site.latitude + offset[0], site.longitude + offset[1]], { icon: stallIcon })
          .addTo(layersGroup);

        marker.on('click', () => {
          setSelectedStallInfo({
            stallNum,
            powerKw: site.charger_model.includes('350kW') ? 350 : 180,
            preTemp: 118 - idx * 2,
            postTemp: hasCanopy ? 84 : (hasPaint ? 104 : 118 - idx * 2),
            derated: !hasCanopy && idx < 2
          });
        });

        marker.bindPopup(`
          <div style="color: #fff; font-size: 12px; line-height: 1.4;">
            <strong>Stall #${stallNum} (${site.charger_model})</strong><br/>
            <span>Operating Status: ${hasCanopy ? '<strong style="color:#10B981;">Optimal 100% Rate</strong>' : '<strong style="color:#EF4444;">Throttled at &gt;35°C</strong>'}</span><br/>
            <span>Core Temp: <strong style="font-family: monospace;">${hasCanopy ? '84°F' : '118°F'}</strong></span>
          </div>
        `);
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [site, mapLayer, selectedMitigations, showHotspots, showCanopyLayer, showStallPins]);

  const handleSave = async () => {
    // Persist to backend SQLite
    const backendSite = await saveMitigations(site.site_id, selectedMitigations);

    const updated = backendSite || {
      ...site,
      metrics: {
        ...site.metrics,
        thermal_siting_score: currentTss,
        estimated_revenue_loss_usd: currentLoss,
        annual_derating_hours: deratingHoursAfter,
        risk_level: currentTss < 50 ? "CRITICAL RISK" : (currentTss < 75 ? "MEDIUM RISK" : "OPTIMAL")
      }
    };

    if (onUpdateSite) {
      onUpdateSite(updated);
    }

    setSaveToast(true);
    setTimeout(() => {
      setSaveToast(false);
      navigate(`/sandbox/${site.site_id}`);
    }, 900);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0D0D11',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column'
    }}>
      
      {/* Top Header matching reference Page 3 */}
      <header style={{
        padding: '14px 28px',
        borderBottom: '1px solid var(--bg-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-card)',
        zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
          <button
            onClick={() => navigate(`/sandbox/${site.site_id}`)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: '8px 14px',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600
            }}
          >
            <ArrowLeft size={16} /> Back to Analysis
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>Mitigation Design Editor & Spatial Simulation</h2>
              <span style={{
                backgroundColor: 'rgba(255, 107, 0, 0.12)',
                border: '1px solid var(--brand-orange)',
                borderRadius: 14,
                padding: '2px 8px',
                fontSize: 10,
                fontWeight: 800,
                color: 'var(--brand-orange)'
              }}>
                WHAT-IF SANDBOX
              </span>
            </div>
            
            {/* Site Switcher Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Active Location:</span>
              <div style={{ position: 'relative' }}>
                <select
                  value={site.site_id}
                  onChange={e => handleSwitchSite(e.target.value)}
                  style={{
                    backgroundColor: '#0D0D11',
                    color: '#fff',
                    border: '1px solid var(--bg-border)',
                    borderRadius: 6,
                    padding: '4px 28px 4px 10px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    outline: 'none',
                    appearance: 'none'
                  }}
                >
                  {sites.map(s => (
                    <option key={s.site_id} value={s.site_id}>
                      {s.site_name} ({s.location.split('•')[0].trim()}) — TSS {s.metrics.thermal_siting_score}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} color="#94A3B8" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                [{site.latitude.toFixed(4)}°N, {Math.abs(site.longitude).toFixed(4)}°W]
              </span>
            </div>
          </div>
        </div>

        {/* Header Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {saveToast && (
            <span style={{ fontSize: 12, color: 'var(--status-optimal)', display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
              <CheckCircle2 size={16} /> Saved to Site Record!
            </span>
          )}
          <button
            className="btn-primary"
            style={{
              backgroundColor: 'var(--status-optimal)',
              boxShadow: '0 0 15px rgba(16, 185, 129, 0.4)',
              padding: '10px 20px',
              fontSize: 13
            }}
            onClick={handleSave}
          >
            <Save size={16} /> SAVE DESIGN & UPDATE AUDIT
          </button>
        </div>
      </header>

      {/* Main 3-Column Layout */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '290px 1fr 320px', height: 'calc(100vh - 69px)', overflow: 'hidden' }}>
        
        {/* ================= LEFT RAIL: TOOLBOX & PRESETS ================= */}
        <aside style={{
          backgroundColor: '#111216',
          borderRight: '1px solid var(--bg-border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
          overflowY: 'auto'
        }}>
          {/* Quick Presets */}
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              QUICK DESIGN PRESETS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <button
                type="button"
                onClick={() => applyPreset('MAX')}
                style={{
                  backgroundColor: 'rgba(255, 107, 0, 0.1)',
                  border: '1px solid var(--brand-orange)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 700,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Max Resilience Package</span>
                <span style={{ color: 'var(--status-optimal)' }} className="mono">+46 TSS</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('CANOPY_ONLY')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Solar Canopy Only</span>
                <span style={{ color: 'var(--brand-orange)' }} className="mono">+24 TSS</span>
              </button>

              <button
                type="button"
                onClick={() => applyPreset('PAINT_ONLY')}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.02)',
                  border: '1px solid var(--bg-border)',
                  borderRadius: 6,
                  padding: '8px 12px',
                  color: '#fff',
                  fontSize: 11.5,
                  fontWeight: 600,
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <span>Cool Sealcoat Only</span>
                <span style={{ color: '#3B82F6' }} className="mono">+12 TSS</span>
              </button>
            </div>
          </div>

          {/* Interventions Section */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              PHYSICAL MITIGATIONS
            </span>

            {/* 1. Solar Canopy */}
            <div
              onClick={() => handleToggleMitigation('Solar Canopy')}
              style={{
                backgroundColor: hasCanopy ? 'rgba(255, 107, 0, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: hasCanopy ? '2px solid var(--brand-orange)' : '1px solid var(--bg-border)',
                borderRadius: 10,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Sun size={16} color={hasCanopy ? 'var(--brand-orange)' : '#64748B'} />
                  <strong style={{ fontSize: 12.5, color: '#fff' }}>Bifacial Solar Canopy</strong>
                </div>
                {hasCanopy && <Check size={14} color="var(--brand-orange)" strokeWidth={3} />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 6px 0', lineHeight: 1.3 }}>
                Blocks 85% direct GHI radiation over dispensers & vehicles.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }} className="mono">
                <span style={{ color: 'var(--status-optimal)', fontWeight: 700 }}>+24 TSS Boost</span>
                <span style={{ color: 'var(--text-muted)' }}>$16,000 CAPEX</span>
              </div>
            </div>

            {/* 2. Cool Reflective Paint */}
            <div
              onClick={() => handleToggleMitigation('Cool Reflective Paint')}
              style={{
                backgroundColor: hasPaint ? 'rgba(59, 130, 246, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: hasPaint ? '2px solid #3B82F6' : '1px solid var(--bg-border)',
                borderRadius: 10,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Paintbrush size={16} color={hasPaint ? '#3B82F6' : '#64748B'} />
                  <strong style={{ fontSize: 12.5, color: '#fff' }}>Cool Reflective Sealcoat</strong>
                </div>
                {hasPaint && <Check size={14} color="#3B82F6" strokeWidth={3} />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 6px 0', lineHeight: 1.3 }}>
                Increases asphalt solar reflectance (SRI 82). Cuts pavement heat by 15°F.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }} className="mono">
                <span style={{ color: '#3B82F6', fontWeight: 700 }}>+12 TSS Boost</span>
                <span style={{ color: 'var(--text-muted)' }}>$2,800 CAPEX</span>
              </div>
            </div>

            {/* 3. Perimeter Tree Wall */}
            <div
              onClick={() => handleToggleMitigation('Live Tree Wall')}
              style={{
                backgroundColor: hasTree ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: hasTree ? '2px solid var(--status-optimal)' : '1px solid var(--bg-border)',
                borderRadius: 10,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TreePine size={16} color={hasTree ? 'var(--status-optimal)' : '#64748B'} />
                  <strong style={{ fontSize: 12.5, color: '#fff' }}>Perimeter Tree Buffer</strong>
                </div>
                {hasTree && <Check size={14} color="var(--status-optimal)" strokeWidth={3} />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 6px 0', lineHeight: 1.3 }}>
                Row of fast-growing canopy trees mitigating localized wind heat island.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }} className="mono">
                <span style={{ color: 'var(--status-optimal)', fontWeight: 700 }}>+8 TSS Boost</span>
                <span style={{ color: 'var(--text-muted)' }}>$3,500 CAPEX</span>
              </div>
            </div>

            {/* 4. Liquid-Cooled Cable Retrofit */}
            <div
              onClick={() => handleToggleMitigation('Liquid-Cooled Cable Retrofit')}
              style={{
                backgroundColor: hasLiquid ? 'rgba(168, 85, 247, 0.12)' : 'rgba(255, 255, 255, 0.02)',
                border: hasLiquid ? '2px solid #A855F7' : '1px solid var(--bg-border)',
                borderRadius: 10,
                padding: 12,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Zap size={16} color={hasLiquid ? '#A855F7' : '#64748B'} />
                  <strong style={{ fontSize: 12.5, color: '#fff' }}>Liquid-Cooled Cable Retrofit</strong>
                </div>
                {hasLiquid && <Check size={14} color="#A855F7" strokeWidth={3} />}
              </div>
              <p style={{ fontSize: 11, color: 'var(--text-muted)', margin: '4px 0 6px 0', lineHeight: 1.3 }}>
                Active chilled radiator cable loops allowing full current up to 115°F.
              </p>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5 }} className="mono">
                <span style={{ color: '#A855F7', fontWeight: 700 }}>+10 TSS Boost</span>
                <span style={{ color: 'var(--text-muted)' }}>$8,000 CAPEX</span>
              </div>
            </div>
          </div>

          {/* Layer Visibility Checklist */}
          <div style={{ borderTop: '1px solid var(--bg-border)', paddingTop: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>
              MAP GIS LAYERS
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showHotspots}
                  onChange={e => setShowHotspots(e.target.checked)}
                  style={{ accentColor: 'var(--brand-orange)' }}
                />
                FortyGuard Thermal Heat Plume
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showCanopyLayer}
                  onChange={e => setShowCanopyLayer(e.target.checked)}
                  style={{ accentColor: 'var(--brand-orange)' }}
                />
                Proposed Canopy Footprint
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showStallPins}
                  onChange={e => setShowStallPins(e.target.checked)}
                  style={{ accentColor: 'var(--brand-orange)' }}
                />
                Charger Dispensers ({site.stall_count} Stalls)
              </label>
            </div>
          </div>
        </aside>

        {/* ================= CENTER PANEL: ACCURATE GIS MAP CANVAS ================= */}
        <main style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0D0D11',
          overflow: 'hidden'
        }}>
          {/* Top Left Parcel Address Banner */}
          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 1000,
            backgroundColor: 'rgba(22, 23, 28, 0.92)',
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: '8px 14px',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: 'var(--brand-orange)' }} />
            <div>
              <strong style={{ fontSize: 13, color: '#fff' }}>{site.site_name}</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>
                {site.location.split('•')[0]}
              </span>
            </div>
          </div>

          {/* Top Right Map Controls */}
          <div style={{
            position: 'absolute',
            top: 16,
            right: 16,
            zIndex: 1000,
            display: 'flex',
            gap: 8
          }}>
            <button
              type="button"
              onClick={() => setMapLayer(prev => prev === 'esriSatellite' ? 'osmDark' : 'esriSatellite')}
              style={{
                backgroundColor: 'rgba(22, 23, 28, 0.92)',
                border: '1px solid var(--bg-border)',
                borderRadius: 8,
                padding: '8px 14px',
                color: mapLayer === 'esriSatellite' ? 'var(--brand-orange)' : '#fff',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                backdropFilter: 'blur(8px)'
              }}
            >
              <Layers size={14} />
              {mapLayer === 'esriSatellite' ? 'Satellite Imagery' : 'Dark Mode Street Map'}
            </button>
          </div>

          {/* Leaflet Map Container */}
          <div ref={mapRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

          {/* Selected Stall Inspector Drawer (Floating bottom center) */}
          {selectedStallInfo ? (
            <div style={{
              position: 'absolute',
              bottom: 24,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 1000,
              backgroundColor: 'rgba(22, 23, 28, 0.95)',
              border: '1px solid var(--brand-orange)',
              borderRadius: 12,
              padding: '14px 20px',
              backdropFilter: 'blur(12px)',
              display: 'flex',
              alignItems: 'center',
              gap: 24,
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)'
            }}>
              <div>
                <strong style={{ fontSize: 13, color: '#fff' }}>Stall #{selectedStallInfo.stallNum} Telemetry</strong>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block' }}>
                  {site.charger_model} &bull; {selectedStallInfo.powerKw} kW
                </span>
              </div>

              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>SURFACE TEMP</span>
                  <span className="mono" style={{ fontSize: 14, fontWeight: 700, color: hasCanopy ? 'var(--status-optimal)' : 'var(--status-critical)' }}>
                    {selectedStallInfo.postTemp}°F {hasCanopy && <span style={{ fontSize: 11, color: 'var(--status-optimal)' }}>(-34°F)</span>}
                  </span>
                </div>

                <div>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>DERATING STATUS</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: hasCanopy ? 'var(--status-optimal)' : 'var(--status-critical)' }}>
                    {hasCanopy ? 'Safe Band (100% Rate)' : 'Throttled by 50%'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedStallInfo(null)}
                style={{
                  background: 'none',
                  border: '1px solid var(--bg-border)',
                  color: 'var(--text-muted)',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 11,
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          ) : (
            <div style={{
              position: 'absolute',
              bottom: 20,
              left: 20,
              zIndex: 1000,
              backgroundColor: 'rgba(22, 23, 28, 0.88)',
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: '8px 14px',
              fontSize: 11,
              color: 'var(--text-muted)',
              backdropFilter: 'blur(8px)'
            }}>
              Tip: Click any dispenser pin on the map to inspect its real-time micro-climate delta
            </div>
          )}
        </main>

        {/* ================= RIGHT RAIL: REAL-TIME BEFORE/AFTER IMPACT ================= */}
        <aside style={{
          backgroundColor: '#111216',
          borderLeft: '1px solid var(--bg-border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
          overflowY: 'auto'
        }}>
          {/* 1. Parcel Profile Card */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>PARCEL ATTRIBUTES</span>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Surface:</span>
              <strong style={{ color: '#fff' }}>{hasPaint ? 'Cool Polymer (Albedo 0.78)' : site.surface_type.split('(')[0]}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Dispensers:</span>
              <strong style={{ color: '#fff' }}>{site.stall_count} Stalls ({site.cooling_type})</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Historical Peak:</span>
              <strong style={{ color: 'var(--status-critical)' }}>{site.peak_ambient_f}°F</strong>
            </div>
          </div>

          {/* 2. Real-Time Before/After TSS Scorecard */}
          <div className="card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              THERMAL RESILIENCE (TSS) GAIN
            </span>

            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>BASELINE</span>
                <span className="mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--status-critical)' }}>
                  {site.metrics.thermal_siting_score}
                </span>
              </div>

              <div style={{ fontSize: 18, color: 'var(--text-muted)' }}>&rarr;</div>

              <div>
                <span style={{ fontSize: 10, color: 'var(--text-muted)', display: 'block' }}>SIMULATED</span>
                <span className="mono" style={{ fontSize: 32, fontWeight: 900, color: 'var(--status-optimal)' }}>
                  {currentTss}
                </span>
              </div>
            </div>

            {/* Score progress track */}
            <div style={{
              width: '100%',
              height: 8,
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              borderRadius: 4,
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${currentTss}%`,
                backgroundColor: currentTss >= 75 ? 'var(--status-optimal)' : (currentTss >= 50 ? 'var(--status-warning)' : 'var(--status-critical)'),
                transition: 'width 0.3s'
              }} />
            </div>

            {scoreDiff > 0 && (
              <div style={{
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
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

          {/* 3. Micro-Climate Environmental Deltas */}
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid var(--bg-border)',
            borderRadius: 8,
            padding: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8
          }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
              MICROCLIMATE IMPACT METRICS
            </span>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Annual Derating Hours:</span>
              <strong className="mono" style={{ color: deratingHoursAfter < site.metrics.annual_derating_hours ? 'var(--status-optimal)' : '#fff' }}>
                {deratingHoursAfter} hrs <span style={{ fontSize: 10, color: 'var(--status-optimal)' }}>(-{site.metrics.annual_derating_hours - deratingHoursAfter}h)</span>
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Surface Temperature:</span>
              <strong className="mono" style={{ color: hasCanopy ? 'var(--status-optimal)' : '#fff' }}>
                {hasCanopy ? '84°F' : (hasPaint ? '103°F' : '118°F')} {hasCanopy && <span style={{ fontSize: 10, color: 'var(--status-optimal)' }}>(-34°F)</span>}
              </strong>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
              <span style={{ color: 'var(--text-muted)' }}>Solar Irradiance (GHI):</span>
              <strong className="mono" style={{ color: hasCanopy ? 'var(--status-optimal)' : '#fff' }}>
                {hasCanopy ? '128 W/m²' : '850 W/m²'} {hasCanopy && <span style={{ fontSize: 10, color: 'var(--status-optimal)' }}>(-85%)</span>}
              </strong>
            </div>
          </div>

          {/* 4. Financial Recovery & Payback */}
          <div className="card" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>ANNUAL REVENUE RECOVERED</span>
            <div className="mono" style={{ fontSize: 26, fontWeight: 800, color: 'var(--status-optimal)' }}>
              +${savings.toLocaleString()}
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
              Throughput preserved by avoiding 50% power curtailments.
            </span>
          </div>

          {/* 5. NEVI SLA Compliance Status */}
          <div style={{
            backgroundColor: isNeviCompliant ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
            border: isNeviCompliant ? '1px solid var(--status-optimal)' : '1px solid var(--status-critical)',
            borderRadius: 8,
            padding: 12
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <ShieldCheck size={16} color={isNeviCompliant ? 'var(--status-optimal)' : 'var(--status-critical)'} />
              <strong style={{ fontSize: 12, color: isNeviCompliant ? 'var(--status-optimal)' : 'var(--status-critical)' }}>
                {isNeviCompliant ? 'NEVI 97% SLA Compliant' : 'Non-Compliant with NEVI 97% SLA'}
              </strong>
            </div>
            <p style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.4 }}>
              {isNeviCompliant
                ? 'Projected thermal uptime of 98.4%. Qualifies for federal NEVI grant funding.'
                : 'Current derating exceeds allowable SLA downtime. Install Solar Canopy to unlock grant eligibility.'}
            </p>
          </div>

          {/* 6. CAPEX Payback Estimator */}
          {savings > 0 && (
            <div style={{
              border: '1px solid var(--bg-border)',
              borderRadius: 8,
              padding: 12,
              backgroundColor: 'rgba(255, 255, 255, 0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>PAYBACK ESTIMATE</span>
                <span className="mono" style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>
                  {paybackMonths} Months
                </span>
              </div>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 2, display: 'block' }}>
                CAPEX ${capex.toLocaleString()} / Annual ${savings.toLocaleString()}
              </span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
