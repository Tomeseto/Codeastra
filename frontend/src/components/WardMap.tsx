import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
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
    if (score === undefined) return '#475569';
    if (score < 30.0) return '#10b981'; // NORMAL - Emerald
    if (score < 55.0) return '#f59e0b'; // WATCH - Amber
    if (score < 75.0) return '#f97316'; // WARNING - Orange
    return '#ef4444'; // EMERGENCY - Crimson
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [19.0850, 72.8777],
      zoom: 11,
      minZoom: 10,
      maxZoom: 15,
      zoomControl: true
    });

    // Sleek Dark Basemap (Esri World Dark Gray Base — 100% Free, No API Key, No Watermark)
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
          fillOpacity: isSelected ? 0.85 : 0.65,
          color: isSelected ? '#38bdf8' : (isEmergency ? '#fecaca' : '#ffffff'),
          weight: isSelected ? 3.5 : (isEmergency ? 2.5 : 1.2),
          dashArray: isSelected ? '' : (isEmergency ? '4, 4' : '')
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
                weight: 2.5,
                color: '#38bdf8',
                fillOpacity: 0.80
              });
            }
          },
          mouseout: (e) => {
            if (geojsonLayerRef.current) {
              geojsonLayerRef.current.resetStyle(e.target);
            }
          }
        });

        // Interactive Tooltip
        const scoreData = exposureScores[wid];
        const score = scoreData ? scoreData.exposure_score.toFixed(1) : '—';
        const tier = scoreData ? scoreData.risk_tier : '—';
        const rain = scoreData ? scoreData.hazard.rainfall_mm.toFixed(1) : '—';

        layer.bindTooltip(
          `
          <div style="font-family: var(--font-body); padding: 4px 6px;">
            <div style="font-weight: 700; font-size: 13px; color: #ffffff;">
              Ward ${wid} · ${props.locality || ''}
            </div>
            <div style="font-size: 11px; color: #94a3b8; margin-top: 2px;">
              Exposure Score: <strong style="color: ${getExposureColor(scoreData?.exposure_score)}; font-size: 13px;">${score}</strong> (${tier})
            </div>
            <div style="font-size: 11px; color: #94a3b8;">
              24h Rainfall: <strong style="color: #38bdf8;">${rain} mm</strong> · Vulnerability: <strong>${(props.vulnerability_norm * 100).toFixed(0)}%</strong>
            </div>
          </div>
          `,
          { sticky: true, className: 'ward-tooltip' }
        );
      }
    });

    geoLayer.addTo(map);
    geojsonLayerRef.current = geoLayer;

    // Auto-fit map bounds to the 24 wards of Mumbai
    if (geoLayer.getLayers().length > 0) {
      try {
        map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });
      } catch {
        // ignore
      }
    }
  }, [geojsonData, exposureScores, selectedWardId, onSelectWard]);

  // 3. Render Flood Hotspots Layer
  useEffect(() => {
    const group = hotspotsLayerRef.current;
    if (!group) return;

    group.clearLayers();

    if (showHotspots && hotspotsList.length > 0) {
      hotspotsList.forEach((spot) => {
        const marker = L.circleMarker([spot.lat, spot.lon], {
          radius: 5,
          fillColor: '#f97316',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        });

        marker.bindPopup(`
          <div style="font-family: var(--font-body); font-size: 12px; padding: 4px;">
            <div style="font-weight: 700; color: #f97316;">⚠️ Chronic Flood Hotspot</div>
            <div style="font-weight: 600; color: #ffffff; margin-top: 2px;">${spot.name}</div>
            <div style="color: #94a3b8; font-size: 11px;">Ward: <strong>${spot.ward_id}</strong> · Severity: <strong>${spot.severity}</strong></div>
            <div style="color: #64748b; font-size: 10px; margin-top: 4px;">Source: ${spot.source}</div>
          </div>
        `);

        group.addLayer(marker);
      });
    }
  }, [showHotspots, hotspotsList]);

  return (
    <div className="map-viewport">
      <div ref={mapContainerRef} className="map-container" />
    </div>
  );
};
