import React, { useState } from 'react';
import { 
  X, AlertTriangle, ChevronDown, ChevronUp, Activity, 
  MapPin, Droplets, Users, Database, ShieldAlert, Bug, CheckCircle
} from 'lucide-react';
import { ExposureGauge } from './ExposureGauge';
import type { WardExposureScore, ChronicHotspot } from '../types';
import { ActionDirectivePanel } from './ActionDirectivePanel';
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
  const [activeTab, setActiveTab] = useState<'dossier' | 'action' | 'incubation'>('dossier');
  const [showMathDropdown, setShowMathDropdown] = useState<boolean>(false);
  const [showHotspotsDropdown, setShowHotspotsDropdown] = useState<boolean>(false);

  if (!wardScore || !wardProperties) {
    return (
      <aside className="evidence-drawer empty">
        <div className="evidence-header">
          <h3>Ward Dossier</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close Drawer" title="Close Drawer">
            <X size={16} />
          </button>
        </div>
        <div className="evidence-empty-state">
          <p style={{ color: 'var(--text-dim)', fontSize: '11px', padding: '14px' }}>
            Select any ward on the tactical map to inspect exposure, demographics, and chronic flood hotspots.
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

      {/* 3 Navigation Tabs: Dossier vs Civic Directives vs Epidemiology */}
      <div className="drawer-tabs-nav">
        <button
          className={`drawer-tab-btn ${activeTab === 'dossier' ? 'active' : ''}`}
          onClick={() => setActiveTab('dossier')}
        >
          <Activity size={13} />
          <span>Dossier</span>
        </button>
        <button
          className={`drawer-tab-btn ${activeTab === 'action' ? 'active' : ''}`}
          onClick={() => setActiveTab('action')}
        >
          <ShieldAlert size={13} />
          <span>Civic Directives</span>
        </button>
        <button
          className={`drawer-tab-btn ${activeTab === 'incubation' ? 'active' : ''}`}
          onClick={() => setActiveTab('incubation')}
        >
          <Bug size={13} />
          <span>Incubation Curve</span>
        </button>
      </div>

      {activeTab === 'dossier' && (
        <div className="evidence-content">
          {/* Module 1: Radial Exposure Score Hero */}
          <div className="evidence-hero-card">
            <div className="hero-gauge-wrapper">
              <ExposureGauge score={wardScore.exposure_score} tier={wardScore.risk_tier} size={88} strokeWidth={8} />
            </div>
            <div className="hero-metrics">
              <span className="hero-label">Environmental Exposure</span>
              <div className="hero-score-row">
                <span className={`badge-tier badge-${wardScore.risk_tier.toLowerCase()}`}>
                  {wardScore.risk_tier}
                </span>
              </div>
              <p className="gauge-narrative">
                {wardScore.risk_tier === 'EMERGENCY'
                  ? 'Critical deluge over high-density informal settlement. High leptospirosis risk.'
                  : wardScore.risk_tier === 'WARNING'
                  ? 'Severe rainfall accumulation. Early runoff saturation detected.'
                  : wardScore.risk_tier === 'WATCH'
                  ? 'Moderate accumulation. Vulnerable low-lying zones on alert.'
                  : 'Baseline seasonal conditions. Minimal environmental exposure.'}
              </p>
            </div>
          </div>

          {/* Warning if Provisional/Partial Data */}
          {isPartial && (
            <div className="callout-warning">
              <AlertTriangle size={14} color="var(--threat-watch)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '11px', display: 'block', color: 'var(--text-main)' }}>
                  Provisional Data Protocol
                </strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {wardScore.susceptibility.warning_message}
                </span>
              </div>
            </div>
          )}

          {/* Module 2: Key 3-Stat Metric Grid */}
          <div className="inspector-stats-grid">
            <div className="stat-tile">
              <div className="stat-tile-label">
                <Droplets size={12} color="var(--text-muted)" />
                <span>24h Rainfall</span>
              </div>
              <div className="stat-tile-value font-mono">
                {R.toFixed(1)} <span className="stat-tile-unit">mm</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-tile-label">
                <Users size={12} color="var(--text-muted)" />
                <span>Slum Density</span>
              </div>
              <div className="stat-tile-value font-mono">
                {slumPct.toFixed(0)}<span className="stat-tile-unit">%</span>
              </div>
            </div>

            <div className="stat-tile">
              <div className="stat-tile-label">
                <Database size={12} color="var(--text-muted)" />
                <span>Ward Pop.</span>
              </div>
              <div className="stat-tile-value font-mono">
                {(totalPop / 1000).toFixed(0)}<span className="stat-tile-unit">k</span>
              </div>
            </div>
          </div>

          {/* Module 3: Mathematical Lineage & Formula Dropdown Accordion */}
          <div className="accordion-card">
            <button 
              className="accordion-header"
              onClick={() => setShowMathDropdown(!showMathDropdown)}
              aria-expanded={showMathDropdown}
            >
              <div className="accordion-title-group">
                <Activity size={13} color="var(--accent-structural)" />
                <span>Mathematical Lineage & Formula</span>
              </div>
              {showMathDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showMathDropdown && (
              <div className="accordion-body animate-slide-up">
                <div className="formula-box font-mono">
                  E(w, d) = min(100.0, round(H(R) × M(w), 1))
                </div>
                <div className="math-step-row">
                  <div>
                    <span className="step-title">1. IMD Rainfall Hazard H(R)</span>
                    <span className="step-desc">Derived from {R.toFixed(1)} mm ({wardScore.hazard.imd_category})</span>
                  </div>
                  <strong className="font-mono">{H.toFixed(2)}</strong>
                </div>
                <div className="math-step-row">
                  <div>
                    <span className="step-title">2. Susceptibility Multiplier M(w)</span>
                    <span className="step-desc">
                      0.70 + 0.30·F_norm({F_norm !== null && F_norm !== undefined ? F_norm.toFixed(3) : '0.000'}) + 0.30·V_norm({V_norm !== undefined ? V_norm.toFixed(3) : '0.000'})
                    </span>
                  </div>
                  <strong className="font-mono">{M.toFixed(3)}</strong>
                </div>
                <div className="math-step-row audited-calc">
                  <span>Audited Exposure Calculation</span>
                  <strong className="font-mono">{H.toFixed(2)} × {M.toFixed(3)} = {wardScore.exposure_score.toFixed(1)}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Module 4: Verified Chronic Flood Spots Dropdown Accordion */}
          <div className="accordion-card">
            <button 
              className="accordion-header"
              onClick={() => setShowHotspotsDropdown(!showHotspotsDropdown)}
              aria-expanded={showHotspotsDropdown}
            >
              <div className="accordion-title-group">
                <MapPin size={13} color="var(--accent-structural)" />
                <span>Verified Chronic Flood Spots ({hotspots.length})</span>
              </div>
              {showHotspotsDropdown ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showHotspotsDropdown && (
              <div className="accordion-body animate-slide-up">
                {hotspots.length === 0 ? (
                  <p className="no-spots-text">No chronic waterlogging hotspots recorded in this ward.</p>
                ) : (
                  <div className="hotspots-list">
                    {hotspots.map((spot, i) => (
                      <div key={i} className="hotspot-item">
                        <div className="hotspot-item-header">
                          <strong className="hotspot-name">{spot.name}</strong>
                          <span className={`spot-severity-badge ${spot.severity.toLowerCase()}`}>
                            {spot.severity}
                          </span>
                        </div>
                        <span className="hotspot-source font-mono">{spot.source}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Lineage, Resolution & Source Callout */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px', fontSize: '10.5px', color: 'var(--text-dim)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: wardScore.data_lineage === 'ESTIMATED' ? 'var(--threat-watch)' : 'var(--threat-normal)' }}>
              <CheckCircle size={12} />
              <span style={{ fontWeight: 600 }}>
                Lineage: {wardScore.data_lineage === 'ESTIMATED' ? 'SIMULATED SCENARIO (Hypothetical)' : 'DERIVED (Observed Demographics + ERA5 Reanalysis)'}
              </span>
            </div>
            <div>
              • <strong>Demographics:</strong> Census of India 2011 Primary Abstract (MCGM Table 1)<br/>
              • <strong>Rainfall Source:</strong> Open-Meteo ERA5 reanalysis (~9 km grid; 6 regional centroids across Mumbai)<br/>
              • <strong>Flood Hotspots:</strong> BMC Disaster Management & Traffic Police records
            </div>
            <div style={{ fontStyle: 'italic', marginTop: '2px', color: 'var(--text-dim)', fontSize: '10px' }}>
              Notice: Environmental exposure score models surface water accumulation and demographic vulnerability; it is not a clinical prediction of pathogen transmission or patient caseloads.
            </div>
          </div>
        </div>
      )}

      {activeTab === 'action' && (
        <div className="evidence-content" style={{ padding: '10px' }}>
          <ActionDirectivePanel
            wardId={wardScore.ward_id}
            exposureScore={wardScore.exposure_score}
            slumPopulation={wardProperties.slum_population || 0}
            locality={wardProperties.locality || ''}
          />
        </div>
      )}

      {activeTab === 'incubation' && (
        <div className="evidence-content" style={{ padding: '10px' }}>
          <IncubationTimelineChart
            wardId={wardScore.ward_id}
            wardName={wardProperties.ward_name || wardProperties.locality}
            exposureScore={wardScore.exposure_score}
            rainfallMm={wardScore.hazard.rainfall_mm}
          />
        </div>
      )}
    </aside>
  );
};
