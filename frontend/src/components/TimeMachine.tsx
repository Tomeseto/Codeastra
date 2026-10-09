import React, { useState, useEffect } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import type { TimelineMilestone } from '../types';

interface TimeMachineProps {
  dates: string[];
  currentDateIndex: number;
  onSelectDateIndex: (index: number) => void;
  useImdWindow: boolean;
  onToggleImdWindow: () => void;
  milestones: TimelineMilestone[];
}

export const TimeMachine: React.FC<TimeMachineProps> = ({
  dates,
  currentDateIndex,
  onSelectDateIndex,
  useImdWindow,
  onToggleImdWindow,
  milestones
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        onSelectDateIndex((currentDateIndex + 1) % dates.length);
      }, 2000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentDateIndex, dates.length, onSelectDateIndex]);

  const currentDate = dates[currentDateIndex] || '';

  const formatDisplayDate = (dStr: string) => {
    if (!dStr) return '';
    const parts = dStr.split('-');
    const day = parts[2];
    const month = parts[1] === '06' ? 'Jun' : 'Jul';
    return `${parseInt(day)} ${month} 2026`;
  };

  return (
    <div className="time-machine-container">
      <div className="time-machine-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={16} color="#38bdf8" />
          <span style={{ fontWeight: 600, fontSize: '13px', color: '#f1f5f9' }}>
            Historical Time Machine · July 2026 Deluge Replay
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            className={`btn-secondary ${useImdWindow ? 'active-layer' : ''}`}
            onClick={onToggleImdWindow}
            title="Toggle between Calendar Day sum (00:00 to 23:59) and official IMD 24h window (08:30 IST to 08:30 IST)"
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {useImdWindow ? 'IMD Window (08:30 IST)' : 'Calendar Day (IST)'}
          </button>

          <span className="font-mono" style={{ fontSize: '13px', fontWeight: 700, color: '#38bdf8' }}>
            {formatDisplayDate(currentDate)}
          </span>
        </div>
      </div>

      <div className="timeline-slider-track">
        <button
          className="btn-secondary"
          style={{ padding: '6px 10px' }}
          onClick={() => onSelectDateIndex(Math.max(0, currentDateIndex - 1))}
          disabled={currentDateIndex === 0}
          title="Previous Day"
        >
          <ChevronLeft size={16} />
        </button>

        <button
          className="btn-primary"
          style={{ padding: '6px 12px' }}
          onClick={() => setIsPlaying(!isPlaying)}
          title={isPlaying ? 'Pause Replay' : 'Play Replay Animation'}
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'Pause' : 'Play'}</span>
        </button>

        <button
          className="btn-secondary"
          style={{ padding: '6px 10px' }}
          onClick={() => onSelectDateIndex(Math.min(dates.length - 1, currentDateIndex + 1))}
          disabled={currentDateIndex === dates.length - 1}
          title="Next Day"
        >
          <ChevronRight size={16} />
        </button>

        <input
          type="range"
          min={0}
          max={dates.length - 1}
          value={currentDateIndex}
          onChange={(e) => onSelectDateIndex(parseInt(e.target.value))}
          className="timeline-range-input"
        />
      </div>

      {milestones && milestones.length > 0 && (
        <div className="milestone-callout">
          <AlertCircle size={15} color="#38bdf8" />
          <div>
            <strong>{milestones[0].title}:</strong> {milestones[0].description}{' '}
            <span style={{ opacity: 0.75 }}>({milestones[0].source_citation})</span>
            {milestones[0].lead_time_hours_vs_alert && (
              <span style={{ color: '#10b981', marginLeft: '6px', fontWeight: 700 }}>
                · +{milestones[0].lead_time_hours_vs_alert.toFixed(1)}h Early Warning Lead Time!
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
