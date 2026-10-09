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
      <div className="math-card" style={{ padding: '24px', textAlign: 'center', color: '#94a3b8' }}>
        <Activity size={20} color="#38bdf8" style={{ margin: '0 auto 8px', display: 'block' }} />
        <div style={{ fontSize: '11px' }}>Calculating 14-day clinical incubation curve...</div>
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
    <div className="glass-card" style={{ padding: '16px', marginTop: '16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Activity size={16} color="#38bdf8" />
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: '#38bdf8', fontWeight: 700, letterSpacing: '0.5px' }}>
              Pathogen Kinetics & Outpatient Surge Model
            </span>
          </div>
          <h4 style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginTop: '2px' }}>
            14-Day Clinical Progression Curve
          </h4>
        </div>
        <span
          style={{
            fontSize: '10px',
            fontFamily: 'var(--font-mono)',
            padding: '3px 8px',
            borderRadius: '4px',
            backgroundColor: 'rgba(56, 189, 248, 0.1)',
            color: '#7dd3fc',
            border: '1px solid rgba(56, 189, 248, 0.25)'
          }}
          title="Anchored on Supe et al. (National Medical Journal of India 2018)"
        >
          Supe et al. (NMJI 2018)
        </span>
      </div>

      {/* Plain Language Civilian Advice Banner */}
      <div
        style={{
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          border: '1px solid rgba(16, 185, 129, 0.35)',
          borderRadius: '8px',
          padding: '10px 12px',
          marginBottom: '14px',
          display: 'flex',
          gap: '10px',
          alignItems: 'flex-start'
        }}
      >
        <ShieldCheck size={20} color="#34d399" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#34d399' }}>
            Golden Prevention Rule (First 72 Hours)
          </div>
          <p style={{ fontSize: '11.5px', color: '#e2e8f0', margin: '2px 0 0', lineHeight: 1.4 }}>
            If you walked through floodwaters today, visit your nearest <strong>Aapla Dawakhana</strong> dispensary within <strong>72 hours</strong>. 
            One free preventive tablet stops the bacterial infection before fever can begin!
          </p>
        </div>
      </div>

      {/* 4 Phase Pills (Civilian Explainer) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px', marginBottom: '14px' }}>
        <div
          onClick={() => setSelectedDay(2)}
          style={{
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: selectedDay <= 3 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            border: selectedDay <= 3 ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#34d399' }}>DAYS 1–3</div>
          <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, marginTop: '1px' }}>Take Medicine</div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Golden Window</div>
        </div>

        <div
          onClick={() => setSelectedDay(5)}
          style={{
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: selectedDay >= 4 && selectedDay <= 6 ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            border: selectedDay >= 4 && selectedDay <= 6 ? '1px solid #f59e0b' : '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#fbbf24' }}>DAYS 4–6</div>
          <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, marginTop: '1px' }}>Silent Phase</div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>No Symptoms</div>
        </div>

        <div
          onClick={() => setSelectedDay(9)}
          style={{
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: selectedDay >= 7 && selectedDay <= 12 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            border: selectedDay >= 7 && selectedDay <= 12 ? '1px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#f87171' }}>DAYS 7–12</div>
          <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, marginTop: '1px' }}>Fever Rush</div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Peak Outpatient</div>
        </div>

        <div
          onClick={() => setSelectedDay(13)}
          style={{
            cursor: 'pointer',
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: selectedDay >= 13 ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 255, 255, 0.03)',
            border: selectedDay >= 13 ? '1px solid #8b5cf6' : '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center'
          }}
        >
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#c084fc' }}>DAYS 13–14</div>
          <div style={{ fontSize: '11px', color: '#ffffff', fontWeight: 600, marginTop: '1px' }}>Hospital Care</div>
          <div style={{ fontSize: '9.5px', color: '#94a3b8' }}>Complications</div>
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
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
              <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.5" />
              <stop offset="65%" stopColor="#ef4444" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="strokeGradient" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#10b981" />
              <stop offset="35%" stopColor="#f59e0b" />
              <stop offset="65%" stopColor="#ef4444" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
          </defs>

          {/* Background Shading for 4 Zones */}
          {/* Zone 1: Days 1-3 */}
          <rect
            x={paddingX}
            y={paddingTop}
            width={(2.5 / 13) * chartW}
            height={chartH}
            fill="rgba(16, 185, 129, 0.06)"
          />
          {/* Zone 2: Days 4-6 */}
          <rect
            x={paddingX + (2.5 / 13) * chartW}
            y={paddingTop}
            width={(3.0 / 13) * chartW}
            height={chartH}
            fill="rgba(245, 158, 11, 0.05)"
          />
          {/* Zone 3: Days 7-12 */}
          <rect
            x={paddingX + (5.5 / 13) * chartW}
            y={paddingTop}
            width={(6.0 / 13) * chartW}
            height={chartH}
            fill="rgba(239, 68, 68, 0.07)"
          />
          {/* Zone 4: Days 13-14 */}
          <rect
            x={paddingX + (11.5 / 13) * chartW}
            y={paddingTop}
            width={(1.5 / 13) * chartW}
            height={chartH}
            fill="rgba(139, 92, 246, 0.06)"
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
            stroke="rgba(255, 255, 255, 0.15)"
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
                  <circle cx={x} cy={y} r="8" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.6" />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={isSelected ? 6 : isPeak ? 5 : 3.5}
                  fill={isSelected ? '#ffffff' : point.zone_color}
                  stroke={point.zone_color}
                  strokeWidth="2"
                />
                <text
                  x={x}
                  y={paddingTop + chartH + 16}
                  textAnchor="middle"
                  fill={isSelected ? '#ffffff' : '#64748b'}
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
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: `1px solid ${selectedPoint.zone_color}40`,
            borderLeft: `4px solid ${selectedPoint.zone_color}`,
            borderRadius: '6px',
            padding: '10px 12px',
            marginTop: '12px'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', textTransform: 'uppercase', color: selectedPoint.zone_color, fontWeight: 700 }}>
              {selectedPoint.phase_label}
            </span>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: '#94a3b8' }}>
              Surge Index: <strong style={{ color: selectedPoint.zone_color }}>{selectedPoint.surge_intensity_index.toFixed(1)}</strong> / 100
            </span>
          </div>

          <div style={{ fontSize: '13px', fontWeight: 700, color: '#ffffff', marginTop: '2px' }}>
            {selectedPoint.civilian_headline}
          </div>

          <p style={{ fontSize: '11.5px', color: '#cbd5e1', marginTop: '4px', lineHeight: 1.4 }}>
            {selectedPoint.civilian_explanation}
          </p>

          <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Clock size={12} color="#38bdf8" />
            <span style={{ fontSize: '11px', color: '#7dd3fc', fontWeight: 600 }}>
              Doctor's Order: {selectedPoint.medical_action}
            </span>
          </div>
        </div>
      )}

      {/* Secondary Vector Stagnation Card (Dengue & Malaria) */}
      {forecast?.vector_risk && (
        <div
          style={{
            marginTop: '14px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(249, 115, 22, 0.08)',
            border: '1px solid rgba(249, 115, 22, 0.3)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Bug size={16} color="#f97316" />
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#f97316', textTransform: 'uppercase' }}>
                Post-Flood Mosquito Breeding Index
              </span>
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '4px',
                backgroundColor:
                  forecast.vector_risk.risk_tier === 'CRITICAL'
                    ? 'rgba(239, 68, 68, 0.2)'
                    : forecast.vector_risk.risk_tier === 'HIGH'
                    ? 'rgba(249, 115, 22, 0.2)'
                    : forecast.vector_risk.risk_tier === 'MODERATE'
                    ? 'rgba(245, 158, 11, 0.2)'
                    : 'rgba(16, 185, 129, 0.2)',
                color:
                  forecast.vector_risk.risk_tier === 'CRITICAL'
                    ? '#f87171'
                    : forecast.vector_risk.risk_tier === 'HIGH'
                    ? '#fb923c'
                    : forecast.vector_risk.risk_tier === 'MODERATE'
                    ? '#fbbf24'
                    : '#34d399',
                border: `1px solid ${
                  forecast.vector_risk.risk_tier === 'CRITICAL'
                    ? '#ef4444'
                    : forecast.vector_risk.risk_tier === 'HIGH'
                    ? '#f97316'
                    : forecast.vector_risk.risk_tier === 'MODERATE'
                    ? '#f59e0b'
                    : '#10b981'
                }`
              }}
            >
              {forecast.vector_risk.risk_tier} RISK ({forecast.vector_risk.stagnation_risk_score}/100)
            </span>
          </div>

          {/* Target Vectors Chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
            {forecast.vector_risk.target_vectors?.map((vec, idx) => (
              <span
                key={idx}
                style={{
                  fontSize: '10px',
                  background: 'rgba(30, 41, 59, 0.7)',
                  color: '#94a3b8',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                🦟 {vec}
              </span>
            ))}
          </div>

          <p style={{ fontSize: '11.5px', color: '#cbd5e1', lineHeight: 1.4, margin: '0 0 6px' }}>
            {forecast.vector_risk.larval_breeding_window}
          </p>

          <div style={{ fontSize: '11px', color: '#fed7aa', backgroundColor: 'rgba(0, 0, 0, 0.3)', padding: '6px 8px', borderRadius: '4px' }}>
            <strong>Directive for BMC Insecticide Squads:</strong> {forecast.vector_risk.chemical_spray_recommendation}
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
