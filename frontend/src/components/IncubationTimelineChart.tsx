import React, { useState, useEffect } from 'react';
import { ShieldCheck, Bug, Activity, Clock } from 'lucide-react';
import type { WardEpidemiologyForecast, IncubationTimelinePoint } from '../types';

interface IncubationTimelineChartProps {
  wardId: string;
  wardName: string;
  exposureScore: number;
  rainfallMm: number;
}

export const IncubationTimelineChart: React.FC<IncubationTimelineChartProps> = ({
  wardId,
  wardName,
  exposureScore,
  rainfallMm
}) => {
  const [forecast, setForecast] = useState<WardEpidemiologyForecast | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDay, setSelectedDay] = useState<number>(3); // Default to Day 3 (Golden window deadline)

  useEffect(() => {
    setLoading(true);
    fetch(`/api/v1/epidemiology/surge-curve/${wardId}?exposure_score=${exposureScore}&rainfall_mm=${rainfallMm}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch surge curve');
        return res.json();
      })
      .then((data: WardEpidemiologyForecast) => {
        setForecast(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching epidemiology forecast:', err);
        // Fallback local calculation
        const fallback = generateFallbackForecast(wardId, wardName, exposureScore, rainfallMm);
        setForecast(fallback);
        setLoading(false);
      });
  }, [wardId, exposureScore, rainfallMm, wardName]);

  if (loading && !forecast) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Activity size={20} color="var(--accent-structural)" style={{ margin: '0 auto 8px', display: 'block' }} />
        <div style={{ fontSize: '11px', fontWeight: 600 }}>Calculating 14-day clinical incubation curve...</div>
      </div>
    );
  }

  const selectedPoint: IncubationTimelinePoint | undefined = forecast?.surge_curve.timeline.find(
    (p) => p.day === selectedDay
  );

  // SVG dimensions
  const svgWidth = 460;
  const svgHeight = 160;
  const paddingX = 24;
  const paddingBottom = 30;
  const paddingTop = 20;
  const chartW = svgWidth - paddingX * 2;
  const chartH = svgHeight - paddingTop - paddingBottom;

  // Build SVG path points
  const points = forecast?.surge_curve.timeline || [];
  const maxVal = Math.max(10, ...points.map((p) => p.surge_intensity_index));

  const svgCoords = points.map((p, idx) => {
    const x = paddingX + (idx / 13) * chartW;
    const y = paddingTop + chartH - (p.surge_intensity_index / maxVal) * chartH;
    return { x, y, point: p };
  });

  const pathD = svgCoords.length > 0
    ? svgCoords.reduce((acc, curr, idx) => {
        return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
      }, '')
    : '';

  const areaD = svgCoords.length > 0
    ? `${pathD} L ${paddingX + chartW} ${paddingTop + chartH} L ${paddingX} ${paddingTop + chartH} Z`
    : '';

  return (
    <div className="incubation-panel-card">
      {/* Header */}
      <div className="incubation-header">
        <div>
          <div className="incubation-kicker">
            <Activity size={14} color="var(--threat-emergency)" />
            <span>Pathogen Kinetics & Outpatient Surge Model</span>
          </div>
          <h4 className="incubation-title">
            14-Day Clinical Progression Curve
          </h4>
        </div>
        <span
          className="incubation-citation-badge"
          title="Anchored on Supe et al. (National Medical Journal of India 2018)"
        >
          Supe et al. (NMJI 2018)
        </span>
      </div>

      {/* Plain Language Civilian Advice Banner */}
      <div className="incubation-golden-banner">
        <ShieldCheck size={20} color="var(--threat-normal)" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div className="incubation-golden-title">
            Golden Prevention Rule (First 72 Hours)
          </div>
          <p className="incubation-golden-desc">
            If you walked through floodwaters today, visit your nearest <strong>Aapla Dawakhana</strong> dispensary within <strong>72 hours</strong>. 
            One free preventive tablet stops the bacterial infection before fever can begin!
          </p>
        </div>
      </div>

      {/* 4 Phase Pills (Civilian Explainer) */}
      <div className="incubation-pills-grid">
        <div
          onClick={() => setSelectedDay(2)}
          className={`incubation-pill ${selectedDay <= 3 ? 'active-green' : ''}`}
        >
          <div className="incubation-pill-range" style={{ color: 'var(--threat-normal)' }}>DAYS 1–3</div>
          <div className="incubation-pill-title">Take Medicine</div>
          <div className="incubation-pill-subtitle">Golden Window</div>
        </div>

        <div
          onClick={() => setSelectedDay(5)}
          className={`incubation-pill ${selectedDay >= 4 && selectedDay <= 6 ? 'active-amber' : ''}`}
        >
          <div className="incubation-pill-range" style={{ color: 'var(--threat-watch)' }}>DAYS 4–6</div>
          <div className="incubation-pill-title">Silent Phase</div>
          <div className="incubation-pill-subtitle">No Symptoms</div>
        </div>

        <div
          onClick={() => setSelectedDay(9)}
          className={`incubation-pill ${selectedDay >= 7 && selectedDay <= 12 ? 'active-red' : ''}`}
        >
          <div className="incubation-pill-range" style={{ color: 'var(--threat-emergency)' }}>DAYS 7–12</div>
          <div className="incubation-pill-title">Fever Rush</div>
          <div className="incubation-pill-subtitle">Peak Outpatient</div>
        </div>

        <div
          onClick={() => setSelectedDay(13)}
          className={`incubation-pill ${selectedDay >= 13 ? 'active-purple' : ''}`}
        >
          <div className="incubation-pill-range" style={{ color: '#854d9a' }}>DAYS 13–14</div>
          <div className="incubation-pill-title">Hospital Care</div>
          <div className="incubation-pill-subtitle">Complications</div>
        </div>
      </div>

      {/* SVG Curve */}
      <div style={{ position: 'relative', width: '100%', height: `${svgHeight}px`, overflow: 'hidden' }}>
        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          style={{ width: '100%', height: '100%', display: 'block' }}
        >
          <defs>
            <linearGradient id="curveGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#287342" stopOpacity="0.22" />
              <stop offset="35%" stopColor="#b07412" stopOpacity="0.25" />
              <stop offset="65%" stopColor="#C35150" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#854d9a" stopOpacity="0.22" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#287342" />
              <stop offset="35%" stopColor="#b07412" />
              <stop offset="65%" stopColor="#C35150" />
              <stop offset="100%" stopColor="#854d9a" />
            </linearGradient>
          </defs>

          {/* Background Shading for 4 Zones */}
          {/* Zone 1: Days 1-3 */}
          <rect
            x={paddingX}
            y={paddingTop}
            width={(2.5 / 13) * chartW}
            height={chartH}
            fill="rgba(40, 115, 66, 0.06)"
          />
          {/* Zone 2: Days 4-6 */}
          <rect
            x={paddingX + (2.5 / 13) * chartW}
            y={paddingTop}
            width={(3.0 / 13) * chartW}
            height={chartH}
            fill="rgba(176, 116, 18, 0.06)"
          />
          {/* Zone 3: Days 7-12 */}
          <rect
            x={paddingX + (5.5 / 13) * chartW}
            y={paddingTop}
            width={(6.0 / 13) * chartW}
            height={chartH}
            fill="rgba(195, 81, 80, 0.07)"
          />
          {/* Zone 4: Days 13-14 */}
          <rect
            x={paddingX + (11.5 / 13) * chartW}
            y={paddingTop}
            width={(1.5 / 13) * chartW}
            height={chartH}
            fill="rgba(133, 77, 154, 0.06)"
          />

          {/* Area Fill & Stroke Line */}
          {areaD && <path d={areaD} fill="url(#curveGradient)" />}
          {pathD && <path d={pathD} fill="none" stroke="url(#strokeGradient)" strokeWidth="2.5" strokeLinecap="round" />}

          {/* Baseline */}
          <line
            x1={paddingX}
            y1={paddingTop + chartH}
            x2={paddingX + chartW}
            y2={paddingTop + chartH}
            stroke="rgba(120, 100, 75, 0.25)"
            strokeWidth="1"
          />

          {/* Days Interactive Dots */}
          {svgCoords.map(({ x, y, point }) => {
            const isSelected = point.day === selectedDay;
            const isPeak = point.is_peak;
            return (
              <g key={point.day} style={{ cursor: 'pointer' }} onClick={() => setSelectedDay(point.day)}>
                {/* Vertical guide line on selection */}
                {isSelected && (
                  <line
                    x1={x}
                    y1={paddingTop}
                    x2={x}
                    y2={paddingTop + chartH}
                    stroke={point.zone_color}
                    strokeDasharray="2,2"
                    strokeWidth="1.5"
                  />
                )}
                {/* Peak Halo */}
                {isPeak && (
                  <circle cx={x} cy={y} r="8" fill="none" stroke="#C35150" strokeWidth="1.5" opacity="0.6" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : isPeak ? 5 : 3.5}
                  fill={isSelected ? '#ffffff' : point.zone_color}
                  stroke={point.zone_color}
                  strokeWidth="2.5"
                />
                <text
                  x={x}
                  y={paddingTop + chartH + 16}
                  textAnchor="middle"
                  fill={isSelected ? '#1f1b17' : '#8c7e6f'}
                  fontSize="10"
                  fontFamily="var(--font-mono)"
                  fontWeight={isSelected ? 'bold' : 'normal'}
                >
                  D{point.day}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Day Civilian Context Card */}
      {selectedPoint && (
        <div
          className="incubation-selected-card"
          style={{ borderLeft: `4px solid ${selectedPoint.zone_color}` }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: selectedPoint.zone_color, fontWeight: 800 }}>
              {selectedPoint.phase_label}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Surge Index: <strong style={{ color: selectedPoint.zone_color }}>{selectedPoint.surge_intensity_index.toFixed(1)}</strong> / 100
            </span>
          </div>

          <div className="incubation-selected-headline">
            {selectedPoint.civilian_headline}
          </div>

          <p className="incubation-selected-desc">
            {selectedPoint.civilian_explanation}
          </p>

          <div className="incubation-doctor-order">
            <Clock size={13} color="var(--accent-structural)" style={{ flexShrink: 0 }} />
            <span>Doctor's Order: {selectedPoint.medical_action}</span>
          </div>
        </div>
      )}

      {/* Secondary Vector Stagnation Card (Dengue & Malaria) */}
      {forecast?.vector_risk && (
        <div className="incubation-vector-card">
          <div className="incubation-vector-header">
            <div className="incubation-vector-title">
              <Bug size={16} color="var(--threat-watch)" />
              <span>Post-Flood Mosquito Breeding Index</span>
            </div>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor:
                  forecast.vector_risk.risk_tier === 'CRITICAL'
                    ? 'var(--threat-emergency-bg)'
                    : forecast.vector_risk.risk_tier === 'HIGH'
                    ? 'var(--threat-warning-bg)'
                    : forecast.vector_risk.risk_tier === 'MODERATE'
                    ? 'var(--threat-watch-bg)'
                    : 'var(--threat-normal-bg)',
                color:
                  forecast.vector_risk.risk_tier === 'CRITICAL'
                    ? 'var(--threat-emergency)'
                    : forecast.vector_risk.risk_tier === 'HIGH'
                    ? 'var(--threat-warning)'
                    : forecast.vector_risk.risk_tier === 'MODERATE'
                    ? 'var(--threat-watch)'
                    : 'var(--threat-normal)',
                border: `1px solid ${
                  forecast.vector_risk.risk_tier === 'CRITICAL'
                    ? 'var(--threat-emergency-border)'
                    : forecast.vector_risk.risk_tier === 'HIGH'
                    ? 'var(--threat-warning-border)'
                    : forecast.vector_risk.risk_tier === 'MODERATE'
                    ? 'var(--threat-watch-border)'
                    : 'var(--threat-normal-border)'
                }`
              }}
            >
              {forecast.vector_risk.risk_tier} RISK ({forecast.vector_risk.stagnation_risk_score}/100)
            </span>
          </div>

          {/* Target Vectors Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {forecast.vector_risk.target_vectors?.map((vec, idx) => (
              <span key={idx} className="incubation-vector-chip">
                🦟 {vec}
              </span>
            ))}
          </div>

          <p className="incubation-vector-desc">
            {forecast.vector_risk.larval_breeding_window}
          </p>

          <div className="incubation-vector-directive">
            <strong style={{ color: 'var(--threat-watch)' }}>Directive for BMC Insecticide Squads:</strong> {forecast.vector_risk.chemical_spray_recommendation}
          </div>
        </div>
      )}
    </div>
  );
};

// Fallback generator if API is offline
function generateFallbackForecast(wardId: string, wardName: string, exp: number, rain: number): WardEpidemiologyForecast {
  const points: IncubationTimelinePoint[] = [];
  const mode = 9.0;
  const alpha = 4.0;
  
  for (let d = 1; d <= 14; d++) {
    const r = d / mode;
    const k = Math.max(0, Math.min(1, Math.pow(r, alpha) * Math.exp(-alpha * (r - 1.0))));
    const val = Number((exp * k).toFixed(1));
    const isPeak = (d === 9);

    let phase = 'OUTPATIENT_FEVER_SURGE';
    let phaseLabel = 'Anticipated Outpatient Fever Surge';
    let headline = `Day ${d}: Fever Surge Window`;
    let expl = 'High fever, severe calf pain, and bloodshot eyes.';
    let action = 'Outpatient fever diagnosis and oral Doxycycline.';
    let col = '#ef4444';

    if (d <= 3) {
      phase = 'PROPHYLAXIS_GOLDEN_WINDOW';
      phaseLabel = 'Golden Prophylaxis Window (NOW)';
      headline = `Day ${d}: Take Free Medicine Now`;
      expl = 'Single dose of Doxycycline stops the infection completely.';
      action = 'Oral Doxycycline 200mg single dose at Aapla Dawakhana.';
      col = '#10b981';
    } else if (d <= 6) {
      phase = 'LATENT_INCUBATION';
      phaseLabel = 'Latent Asymptomatic Incubation';
      headline = `Day ${d}: Silent Stage (Feeling Fine)`;
      expl = 'Bacteria multiplying quietly in the bloodstream.';
      action = 'Syndromic surveillance active.';
      col = '#f59e0b';
    } else if (d >= 13) {
      phase = 'SEVERE_COMPLICATIONS';
      phaseLabel = 'Severe Complications Window';
      headline = `Day ${d}: Danger Zone for Untreated Patients`;
      expl = 'High risk of liver/kidney damage (Weil’s syndrome).';
      action = 'ICU and dialysis readiness.';
      col = '#8b5cf6';
    }

    points.push({
      day: d,
      phase,
      phase_label: phaseLabel,
      civilian_headline: headline,
      civilian_explanation: expl,
      surge_intensity_index: val,
      medical_action: action,
      zone_color: col,
      is_peak: isPeak
    });
  }

  return {
    ward_id: wardId,
    ward_name: wardName,
    exposure_score: exp,
    rainfall_mm: rain,
    surge_curve: {
      ward_id: wardId,
      ward_name: wardName,
      exposure_score: exp,
      rainfall_mm: rain,
      peak_day: 9,
      peak_intensity: exp,
      golden_window_days: 3,
      timeline: points,
      evidence_citation: 'Supe et al., NMJI 2018'
    },
    vector_risk: {
      ward_id: wardId,
      stagnation_risk_score: Math.min(100, Math.round(0.3 * 80 + rain / 2)),
      risk_tier: 'HIGH',
      target_vectors: ['Aedes aegypti', 'Anopheles stephensi'],
      larval_breeding_window: 'Breeding peaks 14-21 days post-flood.',
      chemical_spray_recommendation: 'Deploy Abate / Temephos 50% EC chemical spraying in chronic bowls within 5 days.',
      target_hotspot_count: 5,
      priority_action: 'Anti-larval chemical spraying'
    },
    generated_at: new Date().toISOString()
  };
}
