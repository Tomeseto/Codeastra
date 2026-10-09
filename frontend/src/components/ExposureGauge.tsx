import React from 'react';
import type { RiskTier } from '../types';

interface ExposureGaugeProps {
  score: number;
  tier: RiskTier;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  showTier?: boolean;
}

export const ExposureGauge: React.FC<ExposureGaugeProps> = ({
  score,
  tier,
  size = 96,
  strokeWidth = 8,
  showValue = true,
  showTier = false
}) => {
  const clampedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  // 260-degree open arc sweep (leaves 100-degree notch at bottom)
  const arcLength = circumference * (260 / 360);
  const activeLength = arcLength * (clampedScore / 100);

  const getTierColor = (t: RiskTier): string => {
    switch (t) {
      case 'NORMAL': return 'var(--threat-normal)';
      case 'WATCH': return 'var(--threat-watch)';
      case 'WARNING': return 'var(--threat-warning)';
      case 'EMERGENCY': return 'var(--threat-emergency)';
      default: return 'var(--threat-normal)';
    }
  };

  const color = getTierColor(tier);

  return (
    <div style={{ position: 'relative', width: size, height: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(140deg)' }}
        aria-hidden="true"
      >
        {/* Background Inactive Arc Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--bg-surface-3)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Active Threat Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={`${activeLength} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray var(--transition-normal)' }}
        />
      </svg>

      {/* Center Numerical Value */}
      {showValue && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
          }}
        >
          <span
            className="font-mono"
            style={{
              fontSize: size >= 80 ? '22px' : '13px',
              fontWeight: 800,
              color: 'var(--text-main)',
              lineHeight: 1
            }}
          >
            {clampedScore.toFixed(1)}
          </span>
          {showTier && (
            <span
              style={{
                fontSize: '9px',
                fontWeight: 700,
                color,
                letterSpacing: '0.04em',
                marginTop: '3px'
              }}
            >
              {tier}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
