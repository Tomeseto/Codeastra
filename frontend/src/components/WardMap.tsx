import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RotateCcw } from 'lucide-react';
import type { WardExposureScore, ChronicHotspot } from '../types';

interface WardMapProps {
  geojsonData: any;
  exposureScores: Record<string, WardExposureScore>;
  selectedWardId: string | null;
  onSelectWard: (wardId: string) => void;
  showHotspots: boolean;
  hotspotsList: ChronicHotspot[];
}

export const WardMap: React.FC<WardMapProps> = ({
  geojsonData,
  exposureScores,
  selectedWardId,
  onSelectWard,
  showHotspots,
  hotspotsList
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const geojsonLayerRef = useRef<L.GeoJSON | null>(null);
  const hotspotsLayerRef = useRef<L.LayerGroup | null>(null);

  // Helper function to get fill color based on exposure score
  const getExposureColor = (score: number | undefined): string => {
    if (score === undefined) return 'var(--accent-structural)';
    if (score < 30.0) return 'var(--threat-normal)';
    if (score < 55.0) return 'var(--threat-watch)';
    if (score < 75.0) return 'var(--threat-warning)';
    return 'var(--threat-emergency)';
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.0850, 72.8777],
      zoom: 11,
      minZoom: 10,
      maxZoom: 15,
      zoomControl: false // Custom placement or minimalist
    });

    // Custom Zoom Control top-left
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Sleek Dark Basemap (Esri World Dark Gray Base — 100% Free, Keyless, Watermark-Free)
    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
      maxZoom: 16
    }).addTo(map);

    hotspotsLayerRef.current = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // 2. Render GeoJSON Layer when geojsonData or exposureScores change
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !geojsonData) return;

    if (geojsonLayerRef.current) {
      map.removeLayer(geojsonLayerRef.current);
    }

    const geoLayer = L.geoJSON(geojsonData, {
      style: (feature) => {
        const wid = feature?.properties?.ward_id;
        const scoreData = exposureScores[wid];
        const score = scoreData?.exposure_score;
        const isSelected = selectedWardId === wid;
        const isEmergency = score !== undefined && score >= 75.0;

        return {
          fillColor: getExposureColor(score),
          fillOpacity: isSelected ? 0.88 : 0.62,
          color: isSelected ? 'var(--accent-live)' : isEmergency ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
          weight: isSelected ? 3.0 : isEmergency ? 2.0 : 1.0,
          dashArray: isSelected ? '' : isEmergency ? '4, 4' : ''
        };
      },
      onEachFeature: (feature, layer) => {
        const props = feature.properties;
        const wid = props.ward_id;

        layer.on({
          click: () => {
            onSelectWard(wid);
          },
          mouseover: (e) => {
            const l = e.target;
            if (selectedWardId !== wid) {
              l.setStyle({
                weight: 2.2,
                color: 'var(--accent-live)',
                fillOpacity: 0.78
              });
            }
          },
          mouseout: (e) => {
            if (geojsonLayerRef.current) {
              geojsonLayerRef.current.resetStyle(e.target);
            }
          }
        });

        // Tactical Hover Tooltip (Zero raw colors, using semantic tokens)
        const scoreData = exposureScores[wid];
        const score = scoreData ? scoreData.exposure_score.toFixed(1) : '—';
        const tier = scoreData ? scoreData.risk_tier : '—';
        const rain = scoreData ? scoreData.hazard.rainfall_mm.toFixed(1) : '—';
        const tierClass = tier !== '—' ? `badge-${tier.toLowerCase()}` : '';

        layer.bindTooltip(
          `
          <div style="font-family: var(--font-body); padding: 4px 6px;">
            <div style="font-weight: 700; font-size: 13px; color: var(--text-main);">
              Ward ${wid} · ${props.locality || ''}
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 3px; display: flex; align-items: center; gap: 6px;">
              <span>Score: <strong style="color: var(--text-main); font-size: 13px;">${score}</strong></span>
              <span class="badge-tier ${tierClass}" style="font-size: 9px; padding: 1px 4px;">${tier}</span>
            </div>
            <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
              24h Rain: <strong style="color: var(--accent-live);">${rain} mm</strong> · Slum Ratio: <strong>${(props.slum_ratio * 100).toFixed(0)}%</strong>
            </div>
          </div>
          `,
          { sticky: true, className: 'ward-tooltip' }
        );
      }
    });

    geoLayer.addTo(map);
    geojsonLayerRef.current = geoLayer;
  }, [geojsonData, exposureScores, selectedWardId, onSelectWard]);

  // 3. Render Flood Hotspots Layer (Removed Emoji, Using SVG Icon)
  useEffect(() => {
    const group = hotspotsLayerRef.current;
    if (!group) return;

    group.clearLayers();

    if (showHotspots && hotspotsList.length > 0) {
      hotspotsList.forEach((spot) => {
        const marker = L.circleMarker([spot.lat, spot.lon], {
          radius: 5,
          fillColor: 'var(--threat-warning)',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.9
        });

        // Popup without emojis — using clean SVG alert triangle
        marker.bindPopup(`
          <div style="font-family: var(--font-body); font-size: 12px; padding: 2px;">
            <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: var(--threat-warning);">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span>Chronic Flood Hotspot</span>
            </div>
            <div style="font-weight: 600; color: var(--text-main); margin-top: 3px;">${spot.name}</div>
            <div style="color: var(--text-muted); font-size: 11px; margin-top: 2px;">
              Ward: <strong>${spot.ward_id}</strong> · Severity: <strong>${spot.severity}</strong>
            </div>
            <div style="color: var(--text-dim); font-size: 10px; margin-top: 4px;">Source: ${spot.source}</div>
          </div>
        `);

        group.addLayer(marker);
      });
    }
  }, [showHotspots, hotspotsList]);

  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([19.0850, 72.8777], 11, { animate: true });
    }
  };

  return (
    <div className="map-viewport">
      <div ref={mapContainerRef} className="map-container" />
      {/* Tactical Map Overlay HUD Button */}
      <div className="map-hud-controls">
        <button
          className="btn-hud"
          onClick={handleRecenter}
          title="Recenter Mumbai Extents"
          aria-label="Recenter Map"
        >
          <RotateCcw size={13} />
          <span>Recenter</span>
        </button>
      </div>
    </div>
  );
};
