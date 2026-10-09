import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Zap } from 'lucide-react';
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
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);

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
      const interval = Math.max(300, 1800 / speedMultiplier);
      timer = setInterval(() => {
        onSelectDateIndex((currentDateIndex + 1) % dates.length);
      }, interval);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentDateIndex, dates.length, speedMultiplier, onSelectDateIndex]);

  // Process timeline data
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
      const dateParts = (day.date || '').split('-');
      const dayNum = dateParts[2] || '';
      const monthStr = dateParts[1] === '06' ? 'Jun' : 'Jul';

      let tierColor = 'var(--threat-normal)';
      if (avgRain >= 115.6) {
        tierColor = 'var(--threat-emergency)';
      } else if (avgRain >= 64.5) {
        tierColor = 'var(--threat-warning)';
      } else if (avgRain >= 35.5) {
        tierColor = 'var(--threat-watch)';
      }

      return {
        date: day.date,
        dayNum,
        monthStr,
        avgRain,
        emergencyCount,
        tierColor,
        isTrigger: day.date === '2026-07-05'
      };
    });
  }, [timelineDays]);

  const maxRain = useMemo(() => {
    const rains = processedDays.map((d) => d.avgRain);
    return Math.max(140, ...rains);
  }, [processedDays]);

  const activeDay = processedDays[currentDateIndex] || null;

  return (
    <div className="calm-timeline-scrubber">
      {/* 1. Playback Transport Cluster */}
      <div className="scrubber-transport">
        <button
          className="btn-transport-step"
          onClick={stepPrev}
          title="Previous Day (←)"
          aria-label="Previous Day"
        >
          <ChevronLeft size={14} />
        </button>

        <button
          className={`btn-transport-play ${isPlaying ? 'playing' : ''}`}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Replay (Spacebar)' : 'Play Replay (Spacebar)'}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause size={12} /> : <Play size={12} />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY'}</span>
        </button>

        <button
          className="btn-transport-step"
          onClick={stepNext}
          title="Next Day (→)"
          aria-label="Next Day"
        >
          <ChevronRight size={14} />
        </button>

        <button
          className="btn-speed-pill font-mono"
          onClick={() => setSpeedMultiplier((prev) => (prev === 1 ? 2 : 1))}
          title="Toggle Playback Speed"
        >
          {speedMultiplier}x
        </button>
      </div>

      {/* 2. Sleek Interactive Day Scrub Track */}
      <div className="scrubber-track">
        {processedDays.map((day, idx) => {
          const isSelected = idx === currentDateIndex;
          const barHeight = Math.max(4, Math.round((day.avgRain / maxRain) * 26));

          return (
            <button
              key={day.date}
              className={`scrubber-day-col ${isSelected ? 'active' : ''} ${day.isTrigger ? 'trigger-day' : ''}`}
              onClick={() => onSelectDateIndex(idx)}
              title={`${day.dayNum} ${day.monthStr}: ${day.avgRain.toFixed(1)} mm`}
            >
              <div className="scrubber-bar-slot">
                <div
                  className="scrubber-bar"
                  style={{
                    height: `${barHeight}px`,
                    backgroundColor: day.tierColor
                  }}
                />
                {day.isTrigger && <span className="trigger-dot" />}
              </div>
              <span className="scrubber-label font-mono">
                {day.dayNum} {idx === 0 || day.dayNum === '01' ? day.monthStr : ''}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. Active Day Summary Callout */}
      <div className="scrubber-summary">
        {activeDay && (
          <div className="active-day-callout font-mono">
            <span className="callout-date">
              {activeDay.dayNum} {activeDay.monthStr} 2026
            </span>
            <span className="callout-rain">
              {activeDay.avgRain.toFixed(1)} mm
            </span>
            {activeDay.isTrigger && (
              <span className="callout-trigger-pill">
                <Zap size={10} />
                +38.1h Trigger
              </span>
            )}
          </div>
        )}

        <button
          className={`btn-window-pill ${useImdWindow ? 'active' : ''}`}
          onClick={onToggleImdWindow}
          title="Toggle between Calendar Day sum and official IMD 24h accumulation window"
        >
          {useImdWindow ? 'IMD 08:30' : 'Calendar Day'}
        </button>
      </div>
    </div>
  );
};
