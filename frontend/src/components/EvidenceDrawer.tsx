import React from 'react';
import { X, AlertTriangle, Info, MapPin, Database, Users, ShieldAlert } from 'lucide-react';
import { ExposureGauge } from './ExposureGauge';
import type { WardExposureScore, ChronicHotspot } from '../types';

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
      <aside className="evidence-drawer empty">
        <div className="evidence-header">
          <h3>Forensic Evidence Dossier</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close Drawer" title="Close Drawer">
            <X size={16} />
          </button>
        </div>
        <div className="evidence-empty-state">
          <Info size={32} color="var(--text-dim)" />
          <p>
            Select any ward polygon on the tactical map or click an entry in the critical queue to inspect mathematical lineage, census vulnerability, and chronic flood spots.
          </p>
        </div>
      </aside>
    );
  }

  const H = wardScore.hazard.hazard_score_H;
  const M = wardScore.susceptibility.multiplier_M;
  const R = wardScore.hazard.rainfall_mm;
  const F_norm = wardScore.susceptibility.flood_propensity_F_norm;
  const V_norm = wardScore.susceptibility.demographic_vulnerability_V_norm;
  const isPartial = wardScore.susceptibility.status === 'PROVISIONAL_PARTIAL';

  const totalPop = wardProperties.total_population || 0;
  const slumPop = wardProperties.slum_population || 0;
  const slumPct = totalPop > 0 ? (slumPop / totalPop) * 100 : 0;

  return (
    <aside className="evidence-drawer animate-slide-up">
      {/* Top Header */}
      <div className="evidence-header">
        <div>
          <span className="ward-zone-tag">
            {wardProperties.zone || 'Mumbai'} · Ward {wardScore.ward_id}
          </span>
          <h2 className="ward-locality-title">
            {wardProperties.locality}
          </h2>
        </div>
        <button className="btn-icon" onClick={onClose} aria-label="Close Drawer" title="Close Drawer">
          <X size={16} />
        </button>
      </div>

      <div className="evidence-content">
        {/* Module 1: Radial Exposure Score Hero */}
        <div className="evidence-hero-card">
          <div className="hero-gauge-wrapper">
            <ExposureGauge score={wardScore.exposure_score} tier={wardScore.risk_tier} size={100} strokeWidth={9} />
          </div>
          <div className="hero-metrics">
            <span className="hero-label">Environmental Exposure Score</span>
            <div className="hero-score-row">
              <span className={`badge-tier badge-${wardScore.risk_tier.toLowerCase()}`}>
                {wardScore.risk_tier}
              </span>
            </div>
            <div className="hero-rainfall-row font-mono">
              <span>24h Rainfall:</span>
              <strong style={{ color: 'var(--accent-live)' }}>{R.toFixed(1)} mm</strong>
            </div>
          </div>
        </div>

        {/* Warning if Provisional/Partial Data */}
        {isPartial && (
          <div className="callout-warning">
            <AlertTriangle size={16} color="var(--threat-watch)" style={{ flexShrink: 0 }} />
            <div>
              <strong style={{ fontSize: '11px', display: 'block', color: 'var(--text-main)' }}>
                PROVISIONAL DATA PROTOCOL
              </strong>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {wardScore.susceptibility.warning_message}
              </span>
            </div>
          </div>
        )}

        {/* Module 2: Formula Deconstruction Card */}
        <div className="drawer-card">
          <div className="drawer-card-header">
            <ShieldAlert size={14} color="var(--accent-live)" />
            <span>Mathematical Lineage Deconstructor</span>
          </div>
          <div className="formula-display font-mono">
            E(w, d) = min(100.0, round(H(R) × M(w), 1))
          </div>

          <div className="math-step-list">
            <div className="math-step-item">
              <div className="math-step-top">
                <span className="math-step-name">1. IMD Rainfall Hazard H(R)</span>
                <span className="math-step-val font-mono">{H.toFixed(2)}</span>
              </div>
              <span className="math-step-desc">
                Derived from {R.toFixed(1)} mm continuous 24h accumulation
              </span>
            </div>

            <div className="math-step-item">
              <div className="math-step-top">
                <span className="math-step-name">2. Susceptibility Multiplier M(w)</span>
                <span className="math-step-val font-mono">{M.toFixed(3)}</span>
              </div>
              <div className="math-step-subgrid font-mono">
                <span>Base: 0.70</span>
                <span>Flood Propensity F: {F_norm != null ? F_norm.toFixed(3) : 'N/A'}</span>
                <span>Census Vulnerability V: {V_norm.toFixed(3)}</span>
              </div>
            </div>

            <div className="math-step-item highlight">
              <div className="math-step-top">
                <span className="math-step-name">Final Audited Score</span>
                <span className="math-step-val font-mono" style={{ color: 'var(--text-main)', fontSize: '14px' }}>
                  {H.toFixed(2)} × {M.toFixed(3)} = {wardScore.exposure_score.toFixed(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Module 3: Census Demographic Vulnerability Split Bar */}
        <div className="drawer-card">
          <div className="drawer-card-header">
            <Users size={14} color="var(--accent-live)" />
            <span>Census 2011 Demographic Exposure</span>
          </div>

          <div className="demographic-stats-grid">
            <div>
              <span className="stat-caption">Total Ward Population</span>
              <strong className="stat-figure font-mono">{totalPop.toLocaleString()}</strong>
            </div>
            <div>
              <span className="stat-caption">Slum Population</span>
              <strong className="stat-figure font-mono" style={{ color: 'var(--threat-warning)' }}>
                {slumPop.toLocaleString()} ({slumPct.toFixed(1)}%)
              </strong>
            </div>
          </div>

          <div className="demographic-bar-wrapper">
            <div
              className="demographic-bar-slum"
              style={{ width: `${Math.min(100, slumPct)}%` }}
              title={`Slum Population: ${slumPct.toFixed(1)}%`}
            />
            <div
              className="demographic-bar-nonslum"
              style={{ width: `${Math.max(0, 100 - slumPct)}%` }}
              title={`Non-Slum Population: ${(100 - slumPct).toFixed(1)}%`}
            />
          </div>
          <div className="demographic-bar-legend">
            <span>● Slum Density ({slumPct.toFixed(1)}%)</span>
            <span>○ Non-Slum ({(100 - slumPct).toFixed(1)}%)</span>
          </div>
        </div>

        {/* Module 4: Verified Chronic Flood Hotspots in Ward */}
        <div className="drawer-card">
          <div className="drawer-card-header">
            <MapPin size={14} color="var(--threat-warning)" />
            <span>Verified BMC Chronic Flood Spots ({hotspots.length})</span>
          </div>

          {hotspots.length === 0 ? (
            <p style={{ fontSize: '11px', color: 'var(--text-dim)', margin: '4px 0' }}>
              Zero chronic waterlogging spots recorded in municipal database for Ward {wardScore.ward_id}.
            </p>
          ) : (
            <ul className="hotspot-list">
              {hotspots.map((h, i) => (
                <li key={h.id || i} className="hotspot-list-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div className="hotspot-marker-dot" />
                    <span className="hotspot-name">{h.name || (h as any).spot_name}</span>
                  </div>
                  <span className="hotspot-coords font-mono">
                    {(h.lat ?? (h as any).latitude ?? 0).toFixed(4)}, {(h.lon ?? (h as any).longitude ?? 0).toFixed(4)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Module 5: Cryptographic Provenance Ledger */}
        <div className="lineage-footer">
          <Database size={12} color="var(--text-dim)" />
          <span>
            Data Lineage: {wardScore.data_lineage} · Centroid: {(wardProperties.centroid_lat ?? 19.085).toFixed(3)}°N, {(wardProperties.centroid_lon ?? 72.877).toFixed(3)}°E
          </span>
        </div>
      </div>
    </aside>
  );
};
