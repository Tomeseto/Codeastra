import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, AlertTriangle, Zap, Activity, Info } from 'lucide-react';
import type { DailyExposureSummary, TimelineMilestone } from '../types';

interface TimeMachineProps {
  dates: string[];
  currentDateIndex: number;
  onSelectDateIndex: (index: number) => void;
  useImdWindow: boolean;
  onToggleImdWindow: () => void;
  milestones: TimelineMilestone[];
  timelineDays: DailyExposureSummary[];
}

export const TimeMachine: React.FC<TimeMachineProps> = ({
  dates,
  currentDateIndex,
  onSelectDateIndex,
  useImdWindow,
  onToggleImdWindow,
  timelineDays
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1); // 1x, 2x, 4x

  const stepNext = useCallback(() => {
    onSelectDateIndex((currentDateIndex + 1) % dates.length);
  }, [currentDateIndex, dates.length, onSelectDateIndex]);

  const stepPrev = useCallback(() => {
    onSelectDateIndex((currentDateIndex - 1 + dates.length) % dates.length);
  }, [currentDateIndex, dates.length, onSelectDateIndex]);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [stepNext, stepPrev]);

  // Automated playback timer
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      const interval = Math.max(300, 2000 / speedMultiplier);
      timer = setInterval(() => {
        onSelectDateIndex((currentDateIndex + 1) % dates.length);
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentDateIndex, dates.length, speedMultiplier, onSelectDateIndex]);

  // Weekday dictionary helper
  const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Process timeline data strictly from real backend schemas
  const processedDays = useMemo(() => {
    if (!timelineDays || !Array.isArray(timelineDays) || timelineDays.length === 0) {
      return [];
    }

    return timelineDays.map((day) => {
      const wardList = Object.values(day?.wards || {});
      const avgRain = wardList.length
        ? wardList.reduce((sum, w) => sum + (w?.hazard?.rainfall_mm || 0), 0) / wardList.length
        : 0;

      const emergencyCount = day.emergency_ward_count ?? wardList.filter((w) => w?.risk_tier === 'EMERGENCY').length;
      const warningCount = day.warning_ward_count ?? wardList.filter((w) => w?.risk_tier === 'WARNING').length;

      const dateParts = (day.date || '').split('-');
      const dayNum = dateParts[2] || '';
      const monthStr = dateParts[1] === '06' ? 'Jun' : 'Jul';
      const dt = new Date(`${day.date}T00:00:00`);
      const weekday = !isNaN(dt.getDay()) ? WEEKDAYS[dt.getDay()] : '';

      const milestone = (day.milestones || [])[0] || null;

      // Milestone Micro-Tag classification
      let tagLabel = '';
      let tagTier: 'emergency' | 'warning' | 'watch' | 'info' = 'info';
      if (milestone) {
        if (day.date === '2026-07-05') {
          tagLabel = '+38.1h TRIGGER';
          tagTier = 'emergency';
        } else if (day.date === '2026-07-06') {
          tagLabel = 'BMC ALERT';
          tagTier = 'warning';
        } else if (day.date === '2026-07-01') {
          tagLabel = 'DELUGE';
          tagTier = 'info';
        } else if (day.date === '2026-07-04') {
          tagLabel = 'SATURATE';
          tagTier = 'watch';
        } else if (day.date === '2026-07-10') {
          tagLabel = 'CASE JUMP';
          tagTier = 'info';
        } else {
          tagLabel = 'EVENT';
          tagTier = 'info';
        }
      }

      // Tier styling based on rainfall volume thresholds
      let tierClass = 'tier-normal';
      let tierColor = 'var(--threat-normal)';
      if (avgRain >= 115.6) {
        tierClass = 'tier-emergency';
        tierColor = 'var(--threat-emergency)';
      } else if (avgRain >= 64.5) {
        tierClass = 'tier-warning';
        tierColor = 'var(--threat-warning)';
      } else if (avgRain >= 35.5) {
        tierClass = 'tier-watch';
        tierColor = 'var(--threat-watch)';
      }

      return {
        date: day.date,
        dayNum,
        monthStr,
        weekday,
        avgRain,
        cityAvgExposure: day.city_average_exposure || 0,
        emergencyCount,
        warningCount,
        milestone,
        tagLabel,
        tagTier,
        tierClass,
        tierColor
      };
    });
  }, [timelineDays]);

  const maxRain = useMemo(() => {
    const rains = processedDays.map((d) => d.avgRain);
    return Math.max(140, ...rains);
  }, [processedDays]);

  const activeDay = processedDays[currentDateIndex] || null;
  const activeMilestone = activeDay?.milestone || null;

  return (
    <div className="time-machine-deck">
      {/* 1. Deck Command Header */}
      <div className="deck-header">
        {/* Left: Title & Active Day Metric Badge */}
        <div className="deck-title-group">
          <div className="deck-playback-radar">
            <span className={`radar-pulse-dot ${isPlaying ? 'playing' : ''}`} />
          </div>
          <div className="deck-title-text">
            <span className="deck-title-main">HISTORICAL DELUGE REPLAY</span>
            <span className="deck-title-sub">JULY 2026 MONSOON</span>
          </div>

          {activeDay && (
            <div className={`deck-hero-pill ${activeDay.emergencyCount > 0 ? 'emergency' : ''}`}>
              <span className="hero-pill-date font-mono">
                {activeDay.dayNum} {activeDay.monthStr} 2026
              </span>
              <span className="hero-pill-separator">·</span>
              <span className="hero-pill-rain font-mono">
                {activeDay.avgRain.toFixed(1)} mm <span className="hero-pill-unit">City Avg</span>
              </span>
              <span className="hero-pill-separator">·</span>
              <span
                className="hero-pill-wards font-mono"
                style={{
                  color: activeDay.emergencyCount > 0 ? 'var(--threat-emergency)' : activeDay.warningCount > 0 ? 'var(--threat-warning)' : 'var(--threat-normal)'
                }}
              >
                {activeDay.emergencyCount} Emergency {activeDay.emergencyCount === 1 ? 'Ward' : 'Wards'}
              </span>
            </div>
          )}
        </div>

        {/* Center: Real-Time Tactical Status Ticker */}
        <div className="deck-ticker-center">
          {activeMilestone ? (
            <div className={`ticker-chip ${activeDay?.date === '2026-07-05' ? 'emergency' : activeDay?.date === '2026-07-06' ? 'warning' : 'info'}`}>
              {activeDay?.date === '2026-07-05' ? (
                <Zap size={13} className="ticker-icon pulse" />
              ) : (
                <AlertTriangle size={13} className="ticker-icon" />
              )}
              <span className="ticker-text">
                <strong>{activeMilestone.title}:</strong> {activeMilestone.lead_time_hours_vs_alert ? `+${activeMilestone.lead_time_hours_vs_alert.toFixed(1)}h Lead Time` : 'Surveillance Milestone'}
              </span>
            </div>
          ) : (
            <div className="ticker-chip neutral">
              <Activity size={12} className="ticker-icon" />
              <span className="ticker-text">Surveillance Baseline: Continuous Retrospective ERA5 Hourly Accumulation</span>
            </div>
          )}
        </div>

        {/* Right: Premium Unified Transport Cluster */}
        <div className="deck-transport-cluster">
          <button
            className="btn-transport"
            onClick={stepPrev}
            title="Step Previous Day (Left Arrow)"
            aria-label="Previous Day"
          >
            <ChevronLeft size={15} />
          </button>

          <button
            className={`btn-transport-play ${isPlaying ? 'playing' : ''}`}
            onClick={() => setIsPlaying(!isPlaying)}
            title={isPlaying ? 'Pause Timeline (Spacebar)' : 'Play Timeline Replay (Spacebar)'}
            aria-label={isPlaying ? 'Pause' : 'Replay'}
          >
            {isPlaying ? <Pause size={13} /> : <Play size={13} style={{ marginLeft: '1px' }} />}
            <span>{isPlaying ? 'PAUSE' : 'REPLAY'}</span>
          </button>

          <button
            className="btn-transport"
            onClick={stepNext}
            title="Step Next Day (Right Arrow)"
            aria-label="Next Day"
          >
            <ChevronRight size={15} />
          </button>

          {/* Speed Selector */}
          <button
            className="btn-speed-badge font-mono"
            onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : prev === 2 ? 4 : 1))}
            title="Playback Speed Multiplier"
          >
            {speedMultiplier}x
          </button>

          {/* IMD Window Toggle */}
          <button
            className={`btn-window-toggle ${useImdWindow ? 'active' : ''}`}
            onClick={onToggleImdWindow}
            title="Toggle between Calendar Day sum (00:00 to 23:59) and official IMD 24h window (08:30 IST to 08:30 IST)"
          >
            {useImdWindow ? 'IMD 08:30 Window' : 'Calendar Day (IST)'}
          </button>
        </div>
      </div>

      {/* 2. Tactical Hydrograph Canvas & Scrubber Strip */}
      <div className="hydrograph-canvas-container">
        {/* Subtle Horizontal Reference Threshold Gridline */}
        <div className="hydrograph-reference-line heavy-rain" title="IMD Heavy Rainfall Benchmark (64.5 mm)">
          <span className="reference-label font-mono">64.5 mm Heavy</span>
        </div>

        <div className="hydrograph-columns-grid">
          {processedDays.map((day, idx) => {
            const isSelected = idx === currentDateIndex;
            const barHeightPct = Math.max(14, Math.min(100, (day.avgRain / maxRain) * 100));

            return (
              <button
                key={day.date}
                className={`hydrograph-column-card ${isSelected ? 'selected' : ''} ${day.date === '2026-07-05' ? 'is-trigger-day' : ''}`}
                onClick={() => onSelectDateIndex(idx)}
                title={`${day.dayNum} ${day.monthStr}: ${day.avgRain.toFixed(1)} mm City Avg Rain`}
                aria-label={`Jump to ${day.dayNum} ${day.monthStr}`}
              >
                {/* Active Playhead Cursor Arrow */}
                {isSelected && <div className="playhead-indicator" />}

                {/* Top Slot: Event Micro-Tag or Minimal Tick */}
                <div className="hydrograph-tag-slot">
                  {day.tagLabel ? (
                    <span className={`milestone-micro-tag ${day.tagTier}`}>
                      {day.tagTier === 'emergency' && <Zap size={8} />}
                      {day.tagLabel}
                    </span>
                  ) : (
                    <span className="timeline-baseline-tick" />
                  )}
                </div>

                {/* Numerical Rainfall Metric (mm) */}
                <div className="hydrograph-val-label font-mono" style={{ color: day.tierColor }}>
                  {day.avgRain.toFixed(0)}<span className="hydrograph-unit">mm</span>
                </div>

                {/* Vertical Bar Rail with Channel Backdrop */}
                <div className="hydrograph-rail-channel">
                  <div
                    className={`hydrograph-fill-bar ${day.tierClass}`}
                    style={{ height: `${barHeightPct}%` }}
                  />
                </div>

                {/* Date & Weekday Axis Footer */}
                <div className="hydrograph-date-axis">
                  <span className="date-number font-mono">{day.dayNum} {day.monthStr}</span>
                  <span className="date-weekday">{day.weekday}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Bottom Milestone Forensic Callout / Guidance Strip */}
      <div className="deck-footer-strip">
        {activeMilestone ? (
          <div className={`milestone-dossier-callout animate-slide-up ${activeDay?.date === '2026-07-05' ? 'emergency' : ''}`}>
            <div className="dossier-header-row">
              <div className="dossier-title-group">
                {activeDay?.date === '2026-07-05' ? (
                  <Zap size={14} color="var(--threat-emergency)" className="pulse" />
                ) : (
                  <AlertTriangle size={14} color="var(--threat-warning)" />
                )}
                <strong className="dossier-title">{activeMilestone.title}</strong>

                {activeMilestone.lead_time_hours_vs_alert != null && activeMilestone.lead_time_hours_vs_alert > 0 && (
                  <span className="lead-time-hero-pill font-mono">
                    +{activeMilestone.lead_time_hours_vs_alert.toFixed(1)}h ADVANCE LEAD TIME
                  </span>
                )}
              </div>

              <div className="dossier-meta-group">
                <span className="dossier-citation font-mono">
                  Citation: {activeMilestone.source_citation}
                </span>
                <span className="dossier-kbd-hint font-mono">
                  <kbd>Space</kbd> Play · <kbd>←</kbd> <kbd>→</kbd> Scrub
                </span>
              </div>
            </div>

            <p className="dossier-body-text">{activeMilestone.description}</p>
          </div>
        ) : (
          <div className="surveillance-guidance-strip">
            <div className="guidance-left">
              <Info size={13} color="var(--accent-live)" />
              <span>
                Standard Surveillance Baseline · Continuous 24h accumulation monitored across all 24 administrative wards.
              </span>
            </div>
            <div className="guidance-right font-mono">
              <kbd>Space</kbd> Play / Pause · <kbd>←</kbd> <kbd>→</kbd> Scrub Timeline
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
