import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/**
 * Clean Map Tile Configurations
 * - OpenStreetMap with CSS filter for dark streets (100% free, no API key required, zero watermarks)
 * - ESRI World Imagery for high-resolution aerial/satellite views (no API key required)
 */

export const TILE_PROVIDERS = {
  osmDark: {
    name: 'Dark Street',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    options: {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c']
    }
  },
  esriSatellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    options: {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community',
      maxZoom: 19
    }
  }
};

/**
 * Creates the appropriate tile layer on a map instance.
 * Automatically manages the .dark-mode-tiles class on map container so satellite images aren't inverted.
 */
export function setMapTileLayer(map, type = 'osmDark') {
  if (!map) return;

  const container = map.getContainer();

  // Remove existing tile layers
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });

  if (type === 'esriSatellite') {
    container.classList.remove('dark-mode-tiles');
    container.classList.add('satellite-tiles');
    return L.tileLayer(TILE_PROVIDERS.esriSatellite.url, TILE_PROVIDERS.esriSatellite.options).addTo(map);
  } else {
    container.classList.remove('satellite-tiles');
    container.classList.add('dark-mode-tiles');
    return L.tileLayer(TILE_PROVIDERS.osmDark.url, TILE_PROVIDERS.osmDark.options).addTo(map);
  }
}

/**
 * Custom DivIcons for VoltShield
 */

// Safety orange draggable/selectable location pin
export const createOrangeLocationPin = () => {
  return L.divIcon({
    className: 'vs-location-pin',
    html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background-color: #FF6B00;
        border: 3px solid #FFFFFF;
        box-shadow: 0 0 16px rgba(255, 107, 0, 0.85);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: grab;
      ">
        <div style="width: 8px; height: 8px; border-radius: 50%; background-color: #FFFFFF;"></div>
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

// Risk pin with pulsing aura for Grid Map
export const createRiskPin = (tssScore) => {
  let color = '#10B981'; // Green (Optimal)
  let glow = 'rgba(16, 185, 129, 0.6)';
  if (tssScore < 50) {
    color = '#EF4444'; // Red (Critical)
    glow = 'rgba(239, 68, 68, 0.6)';
  } else if (tssScore < 75) {
    color = '#F59E0B'; // Amber (Medium)
    glow = 'rgba(245, 158, 11, 0.6)';
  }

  return L.divIcon({
    className: 'vs-risk-pin',
    html: `
      <div style="position: relative; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
        <div style="
          position: absolute;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: ${glow};
          animation: vs-pulse 2s infinite ease-out;
        "></div>
        <div style="
          position: relative;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background-color: ${color};
          border: 2px solid #FFFFFF;
          box-shadow: 0 0 10px ${color};
        "></div>
      </div>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 12]
  });
};

// Blue EV Charger Node Pin
export const createChargerNodePin = (isCritical = false) => {
  const color = isCritical ? '#EF4444' : '#3B82F6';
  return L.divIcon({
    className: 'vs-charger-pin',
    html: `
      <div style="
        width: 16px;
        height: 16px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid #FFFFFF;
        box-shadow: 0 0 10px ${color};
        cursor: pointer;
      "></div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
};
