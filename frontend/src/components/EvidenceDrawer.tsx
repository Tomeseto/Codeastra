import React from 'react';
import { X, Droplets, Users, AlertTriangle, CheckCircle, Info } from 'lucide-react';
import type { WardExposureScore, ChronicHotspot } from '../types';
import { IncubationTimelineChart } from './IncubationTimelineChart';

interface EvidenceDrawerProps {
  wardScore: WardExposureScore | null;
  wardProperties: any;
  hotspots: ChronicHotspot[];
  onClose: () => void;
}

export const EvidenceDrawer: React.FC<EvidenceDrawerProps> = ({
  wardScore,
  wardProperties,
  hotspots,
  onClose
}) => {
  if (!wardScore || !wardProperties) {
    return (
      <aside className="evidence-drawer">
        <div className="drawer-header">
          <h3>Ward Evidence & Explainability</h3>
          <button className="btn-secondary" onClick={onClose} style={{ padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
        <div className="drawer-content" style={{ alignItems: 'center', justifyContent: 'center', height: '80%' }}>
          <Info size={36} color="#64748b" />
          <p style={{ color: '#94a3b8', textAlign: 'center', marginTop: '12px', fontSize: '13px' }}>
            Click any ward polygon on the map to inspect its verified evidence, census vulnerability, and mathematical exposure derivation.
          </p>
        </div>
      </aside>
    );
  }

  const getTierClass = (tier: string) => {
    switch (tier) {
      case 'NORMAL': return 'badge-normal';
      case 'WATCH': return 'badge-watch';
      case 'WARNING': return 'badge-warning';
      case 'EMERGENCY': return 'badge-emergency pulse-emergency';
      default: return 'badge-normal';
    }
  };

  const H = wardScore.hazard.hazard_score_H;
  const M = wardScore.susceptibility.multiplier_M;
  const R = wardScore.hazard.rainfall_mm;
  const F_norm = wardScore.susceptibility.flood_propensity_F_norm;
  const V_norm = wardScore.susceptibility.demographic_vulnerability_V_norm;
  const isPartial = wardScore.susceptibility.status === 'PROVISIONAL_PARTIAL';

  return (
    <aside className="evidence-drawer">
      <div className="drawer-header">
        <div>
          <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700 }}>
            {wardProperties.zone} · Ward {wardScore.ward_id}
          </span>
          <h2 style={{ fontSize: '16px', color: '#ffffff', marginTop: '2px' }}>
            {wardProperties.locality}
          </h2>
        </div>
        <button className="btn-secondary" onClick={onClose} style={{ padding: '6px' }} title="Close Drawer">
          <X size={16} />
        </button>
      </div>

      <div className="drawer-content">
        {/* Score & Risk Tier Hero Banner */}
        <div className="glass-card" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#94a3b8', fontWeight: 600 }}>
              Environmental Exposure Score E(w, d)
            </div>
            <div style={{ fontSize: '32px', fontFamily: 'var(--font-heading)', fontWeight: 800, color: '#ffffff', marginTop: '2px' }}>
              {wardScore.exposure_score.toFixed(1)}
              <span style={{ fontSize: '14px', color: '#64748b', fontWeight: 500 }}> / 100</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span className={`badge-tier ${getTierClass(wardScore.risk_tier)}`}>
              {wardScore.risk_tier}
            </span>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
              24h Rain: <strong style={{ color: '#38bdf8' }}>{R.toFixed(1)} mm</strong>
            </div>
          </div>
        </div>

        {/* Warning if Partial Data */}
        {isPartial && (
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', border: '1px solid #f59e0b', borderRadius: '8px', padding: '10px 12px', display: 'flex', gap: '8px' }}>
            <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '11px', color: '#fef3c7' }}>
              <strong>PARTIAL DATA WARNING:</strong> {wardScore.susceptibility.warning_message}
            </div>
          </div>
        )}

        {/* 14-Day Epidemiological Incubation Surge Curve & Mosquito Stagnation Index (Civilian First) */}
        <IncubationTimelineChart
          wardId={wardScore.ward_id}
          wardName={wardProperties.ward_name || wardProperties.locality}
          exposureScore={wardScore.exposure_score}
          rainfallMm={wardScore.hazard.rainfall_mm}
        />

        {/* Verified Census 2011 Demographics */}
        <div>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Users size={14} color="#38bdf8" />
            Verified Census 2011 Demographics
          </h4>
          <div className="metrics-2col">
            <div className="metric-box">
              <div className="metric-label">Total Population</div>
              <div className="metric-val">{wardProperties.total_population.toLocaleString()}</div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Slum Population</div>
              <div className="metric-val">
                {wardProperties.slum_population.toLocaleString()}
                <span style={{ fontSize: '11px', color: '#f97316', marginLeft: '4px' }}>
                  ({(wardProperties.slum_ratio * 100).toFixed(1)}%)
                </span>
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Population Density</div>
              <div className="metric-val">
                {wardProperties.population_density.toLocaleString(undefined, { maximumFractionDigits: 0 })} /km²
              </div>
            </div>
            <div className="metric-box">
              <div className="metric-label">Vulnerability Index (V_norm)</div>
              <div className="metric-val" style={{ color: '#38bdf8' }}>
                {(wardProperties.vulnerability_norm * 100).toFixed(1)}%
              </div>
            </div>
          </div>
        </div>

        {/* Chronic Flood Hotspots */}
        <div>
          <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: '#94a3b8', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Droplets size={14} color="#f97316" />
            Chronic Waterlogging Hotspots ({hotspots.length})
          </h4>
          {hotspots.length === 0 ? (
            <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', padding: '8px' }}>
              No chronic high-risk flood hotspots logged in municipal priority register.
            </div>
          ) : (
            <div className="hotspot-chip-list">
              {hotspots.map((spot) => (
                <div key={spot.id} className="hotspot-item">
                  <span style={{ color: '#ffffff', fontWeight: 500 }}>{spot.name}</span>
                  <span style={{ color: spot.severity === 'HIGH' ? '#ef4444' : '#f59e0b', fontWeight: 700 }}>
                    {spot.severity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deterministic Exposure Derivation Card (Auditable Math) */}
        <div className="math-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
            <div className="math-title" style={{ marginBottom: 0 }}>Deterministic Exposure Derivation</div>
            <span style={{ fontSize: '9px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', textTransform: 'uppercase' }}>
              Formula Audit
            </span>
          </div>
          <div className="math-formula">
            E(w, d) = min(100.0, round(H(R) × M(w), 1))<br/>
            E = min(100.0, round({H.toFixed(2)} × {M.toFixed(3)}, 1)) = <strong>{wardScore.exposure_score.toFixed(1)}</strong>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '11px', color: '#94a3b8' }}>
            <div>
              • <strong>Hazard H(R):</strong> {H.toFixed(2)} / 100 ({wardScore.hazard.imd_category})
            </div>
            <div>
              • <strong>Susceptibility M(w):</strong> {M.toFixed(3)} (Range [0.70, 1.30])
              <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px' }}>
                Formula: 0.70 + 0.30·F_norm({F_norm !== null ? F_norm.toFixed(3) : 'None'}) + 0.30·V_norm({V_norm.toFixed(3)})
              </div>
            </div>
          </div>
        </div>

        {/* Lineage, Resolution & Source Callout */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '10px', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: wardScore.data_lineage === 'ESTIMATED' ? '#f59e0b' : '#10b981' }}>
            <CheckCircle size={12} />
            <span>
              Lineage: {wardScore.data_lineage === 'ESTIMATED' ? 'SIMULATED SCENARIO (Hypothetical)' : 'DERIVED (Observed Demographics + ERA5 Reanalysis)'}
            </span>
          </div>
          <div style={{ color: '#94a3b8' }}>
            • <strong>Demographics:</strong> Census of India 2011 Primary Abstract (MCGM Table 1)<br/>
            • <strong>Rainfall Source:</strong> Open-Meteo ERA5 reanalysis (~9 km grid; 6 regional centroids across Mumbai)<br/>
            • <strong>Flood Hotspots:</strong> BMC Disaster Management & Traffic Police records
          </div>
          <div style={{ fontStyle: 'italic', marginTop: '4px' }}>
            Notice: Environmental exposure score models surface water accumulation and demographic vulnerability; it is not a clinical prediction of pathogen transmission or patient caseloads.
          </div>
        </div>
      </div>
    </aside>
  );
};
