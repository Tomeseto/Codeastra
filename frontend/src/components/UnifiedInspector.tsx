import React, { useState, useMemo } from 'react';
import { 
  Activity, ShieldAlert, AlertTriangle, ChevronRight, ChevronLeft, 
  ChevronDown, ChevronUp, ArrowLeft, Zap, MapPin, Database, Users, Droplets
} from 'lucide-react';
import { ExposureGauge } from './ExposureGauge';
import type { DailyExposureSummary, WardExposureScore, ChronicHotspot } from '../types';

interface UnifiedInspectorProps {
  activeSummary: DailyExposureSummary | null;
  exposureScores: Record<string, WardExposureScore>;
  selectedWardId: string | null;
  onSelectWard: (wardId: string | null) => void;
  wardScore: WardExposureScore | null;
  wardProperties: any;
  hotspots: ChronicHotspot[];
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const UnifiedInspector: React.FC<UnifiedInspectorProps> = ({
  activeSummary,
  exposureScores,
  selectedWardId,
  onSelectWard,
  wardScore,
  wardProperties,
  hotspots,
  isCollapsed,
  onToggleCollapse
}) => {
  const [showMathAccordion, setShowMathAccordion] = useState<boolean>(false);
  const [showHotspotsAccordion, setShowHotspotsAccordion] = useState<boolean>(false);

  // Dynamic Tier Counts
  const tierCounts = useMemo(() => {
    const counts = { NORMAL: 0, WATCH: 0, WARNING: 0, EMERGENCY: 0 };
    Object.values(exposureScores).forEach((ws) => {
      if (ws?.risk_tier && ws.risk_tier in counts) {
        counts[ws.risk_tier]++;
      }
    });
    return counts;
  }, [exposureScores]);

  // Lead Time Alert (strictly conditional)
  const leadTimeMilestone = useMemo(() => {
    if (!activeSummary?.milestones) return null;
    return activeSummary.milestones.find((m) => m.lead_time_hours_vs_alert != null && m.lead_time_hours_vs_alert > 0);
  }, [activeSummary]);

  // Top Critical Wards
  const topCriticalWards = useMemo(() => {
    return Object.values(exposureScores)
      .sort((a, b) => b.exposure_score - a.exposure_score)
      .slice(0, 5);
  }, [exposureScores]);

  if (isCollapsed) {
    return (
      <aside className="unified-inspector collapsed">
        <button
          className="btn-inspector-toggle"
          onClick={onToggleCollapse}
          title="Open Intelligence Inspector"
          aria-label="Open Intelligence Inspector"
        >
          <ChevronLeft size={16} />
        </button>
      </aside>
    );
  }

  // View B: Selected Ward Action Dossier
  if (selectedWardId && wardScore && wardProperties) {
    const H = wardScore.hazard.hazard_score_H;
    const M = wardScore.susceptibility.multiplier_M;
    const R = wardScore.hazard.rainfall_mm;
    const totalPop = wardProperties.total_population || 0;
    const slumPop = wardProperties.slum_population || 0;
    const slumPct = totalPop > 0 ? (slumPop / totalPop) * 100 : 0;
    const isPartial = wardScore.susceptibility.status === 'PROVISIONAL_PARTIAL';

    return (
      <aside className="unified-inspector">
        {/* Navigation Bar */}
        <div className="inspector-header">
          <button 
            className="btn-back-overview" 
            onClick={() => onSelectWard(null)}
            title="Return to Citywide Overview"
          >
            <ArrowLeft size={13} />
            <span>City Overview</span>
          </button>
          <button
            className="btn-inspector-toggle"
            onClick={onToggleCollapse}
            title="Collapse Inspector"
            aria-label="Collapse Inspector"
          >
            <ChevronRight size={15} />
          </button>
        </div>

        <div className="inspector-scrollable">
          {/* Ward Title & Classification */}
          <div className="ward-hero-masthead">
            <div className="ward-breadcrumbs">
              <span className="zone-pill">{wardProperties.zone || 'Mumbai'}</span>
              <span className="ward-id-pill font-mono">Ward {wardScore.ward_id}</span>
            </div>
            <h2 className="ward-title-main">{wardProperties.locality}</h2>
          </div>

          {/* Exposure Score Hero Card */}
          <div className="ward-score-hero-card">
            <div className="gauge-container">
              <ExposureGauge 
                score={wardScore.exposure_score} 
                tier={wardScore.risk_tier} 
                size={88} 
                strokeWidth={8} 
              />
            </div>
            <div className="gauge-details">
              <span className="gauge-label">Environmental Exposure</span>
              <div className="gauge-badge-row">
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

          {/* Provisional Warning if applicable */}
          {isPartial && (
            <div className="callout-warning">
              <AlertTriangle size={14} color="var(--threat-watch)" style={{ flexShrink: 0 }} />
              <div>
                <strong style={{ fontSize: '11px', display: 'block' }}>Provisional Data</strong>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                  {wardScore.susceptibility.warning_message}
                </span>
              </div>
            </div>
          )}

          {/* Key Vulnerability Metrics Grid */}
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

          {/* Progressive Disclosure 1: Mathematical Lineage */}
          <div className="accordion-card">
            <button 
              className="accordion-header"
              onClick={() => setShowMathAccordion(!showMathAccordion)}
              aria-expanded={showMathAccordion}
            >
              <div className="accordion-title-group">
                <Activity size={13} color="var(--accent-structural)" />
                <span>Mathematical Lineage & Formula</span>
              </div>
              {showMathAccordion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showMathAccordion && (
              <div className="accordion-body animate-slide-up">
                <div className="formula-box font-mono">
                  E(w, d) = min(100.0, round(H(R) × M(w), 1))
                </div>
                <div className="math-step-row">
                  <div>
                    <span className="step-title">1. IMD Rainfall Hazard H(R)</span>
                    <span className="step-desc">Derived from {R.toFixed(1)} mm accumulation</span>
                  </div>
                  <strong className="font-mono">{H.toFixed(2)}</strong>
                </div>
                <div className="math-step-row">
                  <div>
                    <span className="step-title">2. Susceptibility Multiplier M(w)</span>
                    <span className="step-desc">Flood Propensity + Census Slum Ratio</span>
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

          {/* Progressive Disclosure 2: Chronic Flood Spots */}
          <div className="accordion-card">
            <button 
              className="accordion-header"
              onClick={() => setShowHotspotsAccordion(!showHotspotsAccordion)}
              aria-expanded={showHotspotsAccordion}
            >
              <div className="accordion-title-group">
                <MapPin size={13} color="var(--accent-structural)" />
                <span>Verified Chronic Flood Spots ({hotspots.length})</span>
              </div>
              {showHotspotsAccordion ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showHotspotsAccordion && (
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
        </div>
      </aside>
    );
  }

  // View A: Citywide Surveillance Overview (Default)
  return (
    <aside className="unified-inspector">
      <div className="inspector-header">
        <div className="inspector-title-group">
          <ShieldAlert size={15} color="var(--accent-structural)" />
          <h2>City Threat Radar</h2>
        </div>
        <button
          className="btn-inspector-toggle"
          onClick={onToggleCollapse}
          title="Collapse Inspector"
          aria-label="Collapse Inspector"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="inspector-scrollable">
        {/* City Exposure Index Card */}
        {activeSummary && (
          <div className="city-telemetry-hero">
            <div className="telemetry-stat-row">
              <div>
                <span className="telemetry-headline">City Exposure Index</span>
                <span className="telemetry-subheadline">24-Ward Weighted Exposure Average</span>
              </div>
              <div 
                className="city-big-score font-mono"
                style={{
                  color:
                    activeSummary.city_average_exposure >= 75
                      ? 'var(--threat-emergency)'
                      : activeSummary.city_average_exposure >= 55
                      ? 'var(--threat-warning)'
                      : 'var(--threat-normal)'
                }}
              >
                {activeSummary.city_average_exposure.toFixed(1)}
                <span className="score-denom"> / 100</span>
              </div>
            </div>

            {/* Distribution Bar */}
            <div className="tier-breakdown-strip">
              <div className="tier-pill-count emergency">
                <span className="dot" />
                <span>{tierCounts.EMERGENCY} Emergency</span>
              </div>
              <div className="tier-pill-count warning">
                <span className="dot" />
                <span>{tierCounts.WARNING} Warning</span>
              </div>
              <div className="tier-pill-count watch">
                <span className="dot" />
                <span>{tierCounts.WATCH} Watch</span>
              </div>
              <div className="tier-pill-count normal">
                <span className="dot" />
                <span>{tierCounts.NORMAL} Normal</span>
              </div>
            </div>
          </div>
        )}

        {/* Priority Early-Warning Lead Time Alert */}
        {leadTimeMilestone && (
          <div className="lead-time-callout-card">
            <div className="callout-top">
              <Zap size={14} className="pulse-icon" />
              <strong>+{leadTimeMilestone.lead_time_hours_vs_alert?.toFixed(1)}h Early Warning Active</strong>
            </div>
            <p className="callout-desc">
              Severe flood risk detected across high-risk wards. 72-hour preventive window open for clinical alerts and medicine distribution.
            </p>
          </div>
        )}

        {/* Critical Ward Queue */}
        <div className="critical-queue-section">
          <div className="section-header-row">
            <span className="section-title">Critical Ward Queue</span>
            <span className="section-meta">Highest Risk Wards</span>
          </div>

          <div className="critical-ward-cards">
            {topCriticalWards.map((w) => {
              const isSelected = selectedWardId === w.ward_id;
              return (
                <button
                  key={w.ward_id}
                  className={`ward-queue-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectWard(w.ward_id)}
                >
                  <div className="queue-item-left">
                    <span className="queue-ward-id font-mono">Ward {w.ward_id}</span>
                    <strong className="queue-locality text-truncate">{w.locality}</strong>
                  </div>
                  <div className="queue-item-right">
                    <span className={`badge-tier badge-${w.risk_tier.toLowerCase()}`}>
                      {w.exposure_score.toFixed(1)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
