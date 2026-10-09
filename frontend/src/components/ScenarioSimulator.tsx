import React, { useMemo } from 'react';
import { Sliders, RefreshCw, AlertTriangle } from 'lucide-react';
import type { DailyExposureSummary, RiskTier } from '../types';

interface ScenarioSimulatorProps {
  simulationRainfall: number;
  onSimulationRainfallChange: (val: number) => void;
  selectedWardId: string | null;
  applyUniformly: boolean;
  onToggleApplyUniformly: () => void;
  onReset: () => void;
  simulatedSummary: DailyExposureSummary | null;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  simulationRainfall,
  onSimulationRainfallChange,
  selectedWardId,
  applyUniformly,
  onToggleApplyUniformly,
  onReset,
  simulatedSummary
}) => {
  const PRESETS: Array<{ label: string; value: number; tier: RiskTier }> = [
    { label: 'Dry (0 mm)', value: 0.0, tier: 'NORMAL' },
    { label: 'Moderate (45 mm)', value: 45.0, tier: 'NORMAL' },
    { label: 'Heavy (85 mm)', value: 85.0, tier: 'WARNING' },
    { label: 'Very Heavy (135 mm)', value: 135.0, tier: 'EMERGENCY' },
    { label: 'Deluge (300 mm)', value: 300.0, tier: 'EMERGENCY' }
  ];

  // Dynamic Impact Derivation strictly from simulatedSummary.wards
  const impactMetrics = useMemo(() => {
    if (!simulatedSummary?.wards) {
      return { emergencyCount: 0, warningCount: 0, maxScore: 0, avgScore: 0 };
    }
    const wards = Object.values(simulatedSummary.wards);
    return {
      emergencyCount: wards.filter((w) => w.risk_tier === 'EMERGENCY').length,
      warningCount: wards.filter((w) => w.risk_tier === 'WARNING').length,
      maxScore: simulatedSummary.city_max_exposure,
      avgScore: simulatedSummary.city_average_exposure
    };
  }, [simulatedSummary]);

  return (
    <div className="scenario-deck">
      <div className="deck-header">
        <div className="deck-title-group">
          <Sliders size={15} color="var(--threat-warning)" />
          <span className="deck-title">Real-Time Scenario Simulator</span>
          <span className="deck-subtitle">Hypothetical Rainfall Sandbox</span>
        </div>

        <div className="deck-transport">
          {/* Scope Toggle */}
          <button
            className="btn-secondary"
            onClick={onToggleApplyUniformly}
            title="Toggle between All 24 Wards and Selected Ward"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            Scope: {applyUniformly ? 'All 24 Wards' : `Ward ${selectedWardId || 'L'} Only`}
          </button>

          {/* Reset Button */}
          <button
            className="btn-secondary"
            onClick={onReset}
            title="Reset Simulation to Historical Observation"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            <RefreshCw size={12} />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="scenario-deck-body">
        {/* Slider & Presets Row */}
        <div className="scenario-controls-col">
          <div className="scenario-slider-header">
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              Simulated Continuous 24h Downpour:
            </span>
            <strong className="font-mono" style={{ color: 'var(--accent-live)', fontSize: '14px' }}>
              {simulationRainfall.toFixed(1)} mm
            </strong>
          </div>

          {/* Custom Tier-Gradient Slider Track */}
          <div className="custom-slider-wrapper">
            <input
              type="range"
              min={0}
              max={350}
              step={5}
              value={simulationRainfall}
              onChange={(e) => onSimulationRainfallChange(parseFloat(e.target.value))}
              className="tier-gradient-slider"
              aria-label="Simulated Rainfall Slider"
            />
          </div>

          {/* Preset Buttons with Risk Tier Color Tint */}
          <div className="preset-chips-row">
            {PRESETS.map((p) => {
              const isActive = simulationRainfall === p.value;
              const tierClass = `badge-${p.tier.toLowerCase()}`;
              return (
                <button
                  key={p.value}
                  className={`btn-preset-chip ${tierClass} ${isActive ? 'active' : ''}`}
                  onClick={() => onSimulationRainfallChange(p.value)}
                  title={`Test ${p.label}`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Live Computed Impact Summary Box (Strict Ground Truth) */}
        <div className="scenario-impact-box">
          <div className="impact-box-header">
            <AlertTriangle
              size={14}
              color={impactMetrics.emergencyCount > 0 ? 'var(--threat-emergency)' : 'var(--threat-warning)'}
            />
            <span>Calculated Municipal Impact</span>
          </div>
          <div className="impact-box-metrics font-mono">
            <div>
              <span className="impact-label">Emergency Wards:</span>
              <strong style={{ color: impactMetrics.emergencyCount > 0 ? 'var(--threat-emergency)' : 'var(--text-main)' }}>
                {impactMetrics.emergencyCount} / 24
              </strong>
            </div>
            <div>
              <span className="impact-label">Warning Wards:</span>
              <strong style={{ color: impactMetrics.warningCount > 0 ? 'var(--threat-warning)' : 'var(--text-main)' }}>
                {impactMetrics.warningCount} / 24
              </strong>
            </div>
            <div>
              <span className="impact-label">City Max Score:</span>
              <strong style={{ color: 'var(--accent-live)' }}>
                {impactMetrics.maxScore.toFixed(1)}
              </strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
