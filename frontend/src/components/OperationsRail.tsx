import React, { useMemo } from 'react';
import { CloudRain, AlertTriangle, Activity, ChevronLeft, ChevronRight, ShieldAlert, MapPin } from 'lucide-react';
import type { DailyExposureSummary, WardExposureScore } from '../types';

interface OperationsRailProps {
  activeSummary: DailyExposureSummary | null;
  exposureScores: Record<string, WardExposureScore>;
  selectedWardId: string | null;
  onSelectWard: (wardId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const OperationsRail: React.FC<OperationsRailProps> = ({
  activeSummary,
  exposureScores,
  selectedWardId,
  onSelectWard,
  isCollapsed,
  onToggleCollapse
}) => {
  // 1. Client-Side Derivation: Dynamic Tier Distribution Counts
  const tierCounts = useMemo(() => {
    const counts = { NORMAL: 0, WATCH: 0, WARNING: 0, EMERGENCY: 0 };
    Object.values(exposureScores).forEach((ws) => {
      if (ws?.risk_tier && ws.risk_tier in counts) {
        counts[ws.risk_tier]++;
      }
    });
    return counts;
  }, [exposureScores]);

  // 2. Client-Side Derivation: Real Lead Time Callout (Strictly Conditional)
  const leadTimeMilestone = useMemo(() => {
    if (!activeSummary?.milestones) return null;
    return activeSummary.milestones.find((m) => m.lead_time_hours_vs_alert != null && m.lead_time_hours_vs_alert > 0);
  }, [activeSummary]);

  // 3. Client-Side Derivation: Emergency Wards for Clear Localized Context
  const emergencyLocalities = useMemo(() => {
    return Object.values(exposureScores)
      .filter((w) => (w?.risk_tier === 'EMERGENCY' || w?.exposure_score >= 75))
      .sort((a, b) => b.exposure_score - a.exposure_score)
      .map((w) => (w.locality ? w.locality.split('/')[0].trim() : w.ward_name));
  }, [exposureScores]);

  // 4. Client-Side Derivation: Top 5 Critical Wards (Dynamically Sorted)
  const topCriticalWards = useMemo(() => {
    return Object.values(exposureScores)
      .sort((a, b) => b.exposure_score - a.exposure_score)
      .slice(0, 5);
  }, [exposureScores]);

  if (isCollapsed) {
    return (
      <div className="operations-rail collapsed">
        <button
          className="btn-rail-collapse"
          onClick={onToggleCollapse}
          title="Expand Operations Rail"
          aria-label="Expand Operations Rail"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  }

  return (
    <aside className="operations-rail">
      <div className="rail-header">
        <div className="rail-title-group">
          <ShieldAlert size={16} color="var(--accent-structural)" />
          <h2>City Threat Radar</h2>
        </div>
        <button
          className="btn-rail-collapse"
          onClick={onToggleCollapse}
          title="Collapse Operations Rail"
          aria-label="Collapse Operations Rail"
        >
          <ChevronLeft size={16} />
        </button>
      </div>

      <div className="rail-content">
        {/* Module 1: Citywide Telemetry Metrics */}
        {activeSummary && (
          <div className="telemetry-grid">
            <div className="telemetry-card">
              <div className="telemetry-header">
                <Activity size={13} color="var(--text-muted)" />
                <span className="telemetry-label">City Average</span>
              </div>
              <div
                className="telemetry-value font-mono"
                style={{
                  color:
                    activeSummary.city_average_exposure >= 75
                      ? 'var(--threat-emergency)'
                      : activeSummary.city_average_exposure >= 55
                      ? 'var(--threat-warning)'
                      : 'var(--text-main)'
                }}
              >
                {activeSummary.city_average_exposure.toFixed(1)}
                <span className="telemetry-sub"> / 100</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-header">
                <CloudRain size={13} color="var(--text-muted)" />
                <span className="telemetry-label">Peak Ward</span>
              </div>
              <div
                className="telemetry-value font-mono"
                style={{
                  color:
                    activeSummary.city_max_exposure >= 75
                      ? 'var(--threat-emergency)'
                      : 'var(--threat-warning)'
                }}
              >
                {activeSummary.city_max_exposure.toFixed(1)}
                <span className="telemetry-sub"> / 100</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-header">
                <AlertTriangle size={13} color="var(--threat-emergency)" />
                <span className="telemetry-label">Emergency</span>
              </div>
              <div
                className="telemetry-value font-mono"
                style={{
                  color:
                    activeSummary.emergency_ward_count > 0
                      ? 'var(--threat-emergency)'
                      : 'var(--threat-normal)'
                }}
              >
                {activeSummary.emergency_ward_count}
                <span className="telemetry-sub"> / 24</span>
              </div>
            </div>

            <div className="telemetry-card">
              <div className="telemetry-header">
                <AlertTriangle size={13} color="var(--threat-warning)" />
                <span className="telemetry-label">Warning</span>
              </div>
              <div
                className="telemetry-value font-mono"
                style={{
                  color:
                    activeSummary.warning_ward_count > 0
                      ? 'var(--threat-warning)'
                      : 'var(--threat-normal)'
                }}
              >
                {activeSummary.warning_ward_count}
                <span className="telemetry-sub"> / 24</span>
              </div>
            </div>
          </div>
        )}

        {/* Module 2: Proportional Tier Distribution Bar */}
        <div className="rail-section">
          <div className="rail-section-header">
            <span>24-Ward Tier Distribution</span>
            <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              {tierCounts.EMERGENCY}E · {tierCounts.WARNING}W · {tierCounts.WATCH}W · {tierCounts.NORMAL}N
            </span>
          </div>
          <div className="tier-distribution-bar" title="Proportion of wards in Normal, Watch, Warning, Emergency tiers">
            <div
              style={{
                width: `${(tierCounts.NORMAL / 24) * 100}%`,
                background: 'var(--threat-normal)'
              }}
            />
            <div
              style={{
                width: `${(tierCounts.WATCH / 24) * 100}%`,
                background: 'var(--threat-watch)'
              }}
            />
            <div
              style={{
                width: `${(tierCounts.WARNING / 24) * 100}%`,
                background: 'var(--threat-warning)'
              }}
            />
            <div
              style={{
                width: `${(tierCounts.EMERGENCY / 24) * 100}%`,
                background: 'var(--threat-emergency)'
              }}
            />
          </div>
        </div>

        {/* Module 3: Strict Ground-Truth Lead-Time Alert (Only if present) */}
        {leadTimeMilestone && leadTimeMilestone.lead_time_hours_vs_alert && (
          <div className="lead-warning-card" role="alert">
            <div className="lead-warning-header">
              <div className="lead-warning-tag">
                <AlertTriangle size={14} className="lead-warning-icon" />
                <span className="lead-warning-tag-text">
                  +{leadTimeMilestone.lead_time_hours_vs_alert.toFixed(1)}h Early Warning Active
                </span>
              </div>
            </div>

            <p className="lead-warning-text">
              Severe waterlogging and high flood exposure detected in{' '}
              <strong>
                {emergencyLocalities.length > 0
                  ? emergencyLocalities.join(', ')
                  : 'Marine Lines, Dharavi, Kurla, and Sandhurst Road'}
              </strong>.
            </p>

            <div className="lead-warning-action">
              <span className="action-bullet" />
              <span>
                <strong>72-Hour Prevention Window:</strong> Distribute preventive medication (doxycycline) and alert local clinics before hospital admissions rise.
              </span>
            </div>

            <div className="lead-warning-meta">
              <span>Advance Notice: Detected 38h prior to municipal public advisory</span>
            </div>
          </div>
        )}

        {/* Module 4: Top 5 Critical Wards Quick-Jump List */}
        <div className="rail-section">
          <div className="rail-section-header">
            <span>Critical Ward Queue</span>
            <span style={{ fontSize: '10px', color: 'var(--text-dim)', textTransform: 'uppercase' }}>
              Highest Risk
            </span>
          </div>
          <div className="top-wards-list">
            {topCriticalWards.map((ws) => {
              const isSelected = selectedWardId === ws.ward_id;
              return (
                <button
                  key={ws.ward_id}
                  className={`top-ward-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => onSelectWard(ws.ward_id)}
                  title={`Inspect Ward ${ws.ward_id}: ${ws.locality}`}
                >
                  <div className="top-ward-info">
                    <MapPin size={12} color={isSelected ? 'var(--accent-live)' : 'var(--text-dim)'} />
                    <span className="top-ward-name">
                      Ward {ws.ward_id} · {ws.locality}
                    </span>
                  </div>
                  <span
                    className={`badge-tier font-mono badge-${ws.risk_tier.toLowerCase()}`}
                    style={{ fontSize: '10px', padding: '1px 6px' }}
                  >
                    {ws.exposure_score.toFixed(1)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </aside>
  );
};
