import React, { useState, useEffect } from 'react';
import { 
  Activity, Pill, Users, 
  Radio, Volume2, ArrowRight, TrendingUp, CheckCircle 
} from 'lucide-react';
import type { WardSyndromicProfile } from '../types';

interface SyndromicTriangulationPanelProps {
  wardId: string;
  wardName: string;
  currentDate?: string;
  exposureScore: number;
  rainfallMm: number;
  onOpenAshaTelemetry?: () => void;
}

export const SyndromicTriangulationPanel: React.FC<SyndromicTriangulationPanelProps> = ({
  wardId,
  wardName,
  currentDate,
  exposureScore,
  rainfallMm,
  onOpenAshaTelemetry
}) => {
  const [profile, setProfile] = useState<WardSyndromicProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    const dateParam = currentDate ? `?date=${encodeURIComponent(currentDate)}` : '';
    fetch(`/api/v1/syndromic/ward/${encodeURIComponent(wardId)}${dateParam}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load syndromic profile');
        return res.json();
      })
      .then((data: WardSyndromicProfile) => {
        if (isMounted) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error('Syndromic profile error:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [wardId, currentDate]);

  if (loading) {
    return (
      <div className="syndromic-card loading">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)' }}>
          <Activity size={16} className="animate-spin" />
          <span style={{ fontSize: '11px' }}>Loading EARS Syndromic Ground-Truth Telemetry...</span>
        </div>
      </div>
    );
  }

  if (!profile || !profile.selected_day) {
    return null;
  }

  const day = profile.selected_day;
  const isCriticalAberration = day.composite_ears_zscore >= 3.0;
  const isWatchAberration = day.composite_ears_zscore >= 1.5 && !isCriticalAberration;

  const getQuadrantInfo = (quadrant: string) => {
    switch (quadrant) {
      case 'CONVERGENT_ACTIVE_EPIDEMIC':
        return {
          title: 'Stage 2: Convergent Active Epidemic',
          badgeColor: 'var(--threat-emergency)',
          badgeBg: 'var(--threat-emergency-bg)',
          desc: 'DUAL-SIGNAL CONVERGENCE: Physical flood hazard and clinical fever velocity cross-validated on ground. Active biological surge in progress.',
          actionText: 'Deploy ICU fever vans & dispatch emergency Ceftriaxone to Aapla Dawakhana.'
        };
      case 'SILENT_INCUBATION_WINDOW':
        return {
          title: 'Stage 1: Silent Incubation / Golden Window',
          badgeColor: 'var(--threat-watch)',
          badgeBg: 'var(--threat-watch-bg)',
          desc: 'HIGH ENVIRONMENTAL HAZARD: Floodwaters contaminated, but clinical symptoms still latent inside patients (Days 1–4 post-flood).',
          actionText: 'Mobilize mass oral Doxycycline prophylaxis within 72h before fever onset!'
        };
      case 'LOCALIZED_COMMUNITY_CLUSTER':
        return {
          title: 'Stage 3: Localized Infrastructure Cluster',
          badgeColor: 'var(--threat-warning)',
          badgeBg: 'var(--threat-warning-bg)',
          desc: 'SYNDROMIC SPIKE WITHOUT RAIN: High fever/myalgia aberration without heavy rainfall. Signals drinking water pipe intrusion or foodborne source.',
          actionText: 'Alert BMC Hydraulic Engineering Dept to sample local municipal water mains.'
        };
      default:
        return {
          title: 'Stage 4: Normal Baseline Equilibrium',
          badgeColor: 'var(--threat-normal)',
          badgeBg: 'var(--threat-normal-bg)',
          desc: 'STABLE BASELINE: Both physical weather hazard and community fever purchasing stay within historical normal parameters.',
          actionText: 'Maintain routine monsoon hygiene and preventive larvicidal surveillance.'
        };
    }
  };

  const quad = getQuadrantInfo(day.triangulation_quadrant);

  return (
    <div className="syndromic-card">
      {/* Header Banner */}
      <div className="syndromic-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div className="syndromic-icon-box">
            <Activity size={16} color="var(--threat-warning)" />
          </div>
          <div>
            <div className="syndromic-title">
              EARS-Sanjeevani · Syndromic Ground-Truth
            </div>
            <div className="syndromic-subtitle">
              Ward {profile.ward_id} ({wardName}) · Rain: {rainfallMm.toFixed(1)} mm · {profile.pharmacy_count} Chemists & {profile.chv_asha_count} CHVs
            </div>
          </div>
        </div>

        <span
          className="syndromic-badge"
          style={{
            background: isCriticalAberration ? 'var(--threat-emergency-bg)' : isWatchAberration ? 'var(--threat-watch-bg)' : 'var(--threat-normal-bg)',
            color: isCriticalAberration ? 'var(--threat-emergency)' : isWatchAberration ? 'var(--threat-watch)' : 'var(--threat-normal)',
            border: `1px solid ${isCriticalAberration ? 'var(--threat-emergency-border)' : isWatchAberration ? 'var(--threat-watch-border)' : 'var(--threat-normal-border)'}`
          }}
        >
          {isCriticalAberration ? 'CRITICAL ABERRATION (+3σ)' : isWatchAberration ? 'SYNDROMIC WATCH' : 'NORMAL BASELINE'}
        </span>
      </div>

      {/* Dual-Sentinel Velocity Cards */}
      <div className="syndromic-grid">
        {/* Stream 1: Retail Chemist OTC Velocity */}
        <div className="syndromic-tile">
          <div className="syndromic-tile-header">
            <Pill size={13} color="var(--threat-watch)" />
            <span>Retail Pharmacy OTC Velocity</span>
          </div>
          <div className="syndromic-tile-body">
            <div className="font-mono syndromic-main-val">
              {day.otc_antipyretic_sales.toLocaleString()}
              <span className="syndromic-unit"> units/day</span>
            </div>
            <div className="syndromic-sub-val">
              Baseline: {day.otc_baseline_mean.toFixed(0)} · Z-Score:{' '}
              <strong style={{ color: day.otc_c2_zscore >= 3.0 ? 'var(--threat-emergency)' : 'var(--threat-watch)' }}>
                +{day.otc_c2_zscore.toFixed(1)}σ
              </strong>
            </div>
          </div>
          <div className="syndromic-tile-footer">
            Paracetamol / Dolo 650 sales across {profile.pharmacy_count} licensed chemists
          </div>
        </div>

        {/* Stream 2: Frontline ASHA Survey Tally */}
        <div className="syndromic-tile">
          <div className="syndromic-tile-header">
            <Users size={13} color="var(--threat-normal)" />
            <span>Frontline CHV/ASHA Tally</span>
          </div>
          <div className="syndromic-tile-body">
            <div className="font-mono syndromic-main-val">
              {day.asha_fever_cases.toLocaleString()}
              <span className="syndromic-unit"> fever calls</span>
            </div>
            <div className="syndromic-sub-val">
              Baseline: {day.asha_baseline_mean.toFixed(0)} · Z-Score:{' '}
              <strong style={{ color: day.asha_c2_zscore >= 3.0 ? 'var(--threat-emergency)' : 'var(--threat-normal)' }}>
                +{day.asha_c2_zscore.toFixed(1)}σ
              </strong>
            </div>
          </div>
          <div className="syndromic-tile-footer">
            Door-to-door survey reports from {profile.chv_asha_count} municipal health volunteers
          </div>
        </div>
      </div>

      {/* Bivariate Outbreak Triangulation Matrix Box */}
      <div className="triangulation-box" style={{ borderColor: quad.badgeColor }}>
        <div className="triangulation-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Radio size={14} color={quad.badgeColor} />
            <strong style={{ fontSize: '12px', color: quad.badgeColor }}>{quad.title}</strong>
          </div>
          <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            E(w): {exposureScore.toFixed(1)} | Z: +{day.composite_ears_zscore.toFixed(2)}σ
          </span>
        </div>

        <p className="triangulation-desc">{quad.desc}</p>

        <div className="triangulation-action">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle size={13} color={quad.badgeColor} style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '11px', color: 'var(--text-main)' }}>
              <strong>Municipal Directive:</strong> {quad.actionText}
            </span>
          </div>
        </div>
      </div>

      {/* Early Warning Lead Time Advantage Pill */}
      <div className="leadtime-callout">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <TrendingUp size={14} color="var(--threat-normal)" />
          <span style={{ fontSize: '11px', color: 'var(--text-main)' }}>
            <strong>+48h Early Detection Advantage:</strong> Retail chemist antipyretic velocity detected this outbreak 48 hours before tertiary hospital ICU triage.
          </span>
        </div>

        {onOpenAshaTelemetry && (
          <button
            onClick={onOpenAshaTelemetry}
            className="btn-asha-telemetry"
            title="Listen to authentic Marathi & Hindi ASHA voice reports"
          >
            <Volume2 size={13} />
            <span>ASHA Voice Feed</span>
            <ArrowRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
