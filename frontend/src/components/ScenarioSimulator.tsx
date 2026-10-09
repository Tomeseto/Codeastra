import React from 'react';
import { Sliders, RefreshCw } from 'lucide-react';
import { BenchmarkSelector } from './BenchmarkSelector';

interface ScenarioSimulatorProps {
  simulationRainfall: number;
  onSimulationRainfallChange: (val: number) => void;
  selectedWardId: string | null;
  applyUniformly: boolean;
  onToggleApplyUniformly: () => void;
  onReset: () => void;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  simulationRainfall,
  onSimulationRainfallChange,
  selectedWardId,
  applyUniformly,
  onToggleApplyUniformly,
  onReset
}) => {
  const PRESETS = [
    { label: 'Dry / 0 mm', value: 0.0, tier: 'NORMAL' },
    { label: 'Moderate / 45 mm', value: 45.0, tier: 'NORMAL' },
    { label: 'Heavy / 85 mm', value: 85.0, tier: 'WARNING' },
    { label: 'Very Heavy / 135 mm', value: 135.0, tier: 'EMERGENCY' },
    { label: 'Extreme / 300 mm', value: 300.0, tier: 'EMERGENCY' }
  ];

  return (
    <div
      className="glass-panel custom-scrollbar"
      style={{
        position: 'absolute',
        top: '80px',
        left: '20px',
        width: '400px',
        maxHeight: 'calc(100vh - 100px)',
        overflowY: 'auto',
        zIndex: 550,
        padding: '16px',
        boxShadow: 'var(--shadow-xl)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Sliders size={16} color="#38bdf8" />
          <h3 style={{ fontSize: '14px', color: '#ffffff' }}>Scenario Simulation Sandbox</h3>
        </div>
        <button className="btn-secondary" onClick={onReset} style={{ padding: '4px 8px', fontSize: '11px' }} title="Reset to Historical Deluge">
          <RefreshCw size={12} />
          <span>Reset</span>
        </button>
      </div>

      {/* Historical Stress-Test Crisis Benchmarks */}
      <BenchmarkSelector
        activeRainfall={simulationRainfall}
        onSelectRainfall={onSimulationRainfallChange}
      />

      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '6px' }}>
          <span style={{ color: '#94a3b8' }}>Simulated 24h Rainfall:</span>
          <strong className="font-mono" style={{ color: '#38bdf8', fontSize: '14px' }}>
            {simulationRainfall.toFixed(1)} mm
          </strong>
        </div>

        <input
          type="range"
          min={0}
          max={350}
          step={5}
          value={simulationRainfall}
          onChange={(e) => onSimulationRainfallChange(parseFloat(e.target.value))}
          style={{ width: '100%', accentColor: '#0284c7', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', color: '#64748b', marginTop: '4px' }}>
          <span>0 mm (Dry)</span>
          <span>64.5 mm (Heavy)</span>
          <span>115.6 mm (V. Heavy)</span>
          <span>204.5+ mm (Deluge)</span>
        </div>
      </div>

      {/* Benchmark Presets */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
          Verification Benchmark Presets
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {PRESETS.map((p) => (
            <button
              key={p.value}
              className="btn-secondary"
              style={{
                fontSize: '11px',
                padding: '4px 8px',
                borderColor: simulationRainfall === p.value ? '#38bdf8' : 'var(--border-subtle)',
                color: simulationRainfall === p.value ? '#ffffff' : 'var(--text-main)'
              }}
              onClick={() => onSimulationRainfallChange(p.value)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Target Scope Toggle */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>
          Scope: {applyUniformly ? 'All 24 Wards' : `Selected Ward (${selectedWardId || 'None'})`}
        </span>
        <button
          className="btn-secondary"
          style={{ fontSize: '11px', padding: '4px 8px' }}
          onClick={onToggleApplyUniformly}
        >
          {applyUniformly ? 'Apply to Selected Only' : 'Apply to All 24 Wards'}
        </button>
      </div>
    </div>
  );
};
