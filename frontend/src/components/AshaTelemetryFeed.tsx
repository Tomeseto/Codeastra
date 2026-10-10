import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, X, CheckCircle, ShieldAlert, Sparkles 
} from 'lucide-react';
import type { VernacularFieldReport } from '../types';

interface AshaTelemetryFeedProps {
  isOpen: boolean;
  onClose: () => void;
  defaultWardId?: string;
}

export const AshaTelemetryFeed: React.FC<AshaTelemetryFeedProps> = ({
  isOpen,
  onClose,
  defaultWardId
}) => {
  const [reports, setReports] = useState<VernacularFieldReport[]>([]);
  const [activeReportId, setActiveReportId] = useState<string>('ASHA-L-0407');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioProgress, setAudioProgress] = useState<number>(0);
  const audioTimerRef = useRef<any>(null);

  useEffect(() => {
    fetch('/api/v1/syndromic/vernacular-feed')
      .then((res) => res.json())
      .then((data: VernacularFieldReport[]) => {
        if (Array.isArray(data) && data.length > 0) {
          setReports(data);
          // If defaultWardId provided, match report with that ward if exists
          if (defaultWardId) {
            const match = data.find((r) => r.ward_id === defaultWardId);
            if (match) setActiveReportId(match.id);
          }
        }
      })
      .catch((err) => console.error('Failed to load vernacular feed:', err));
  }, [defaultWardId]);

  // Audio Playback Simulation with Web Audio API chime / beep
  const playTelemetrySound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880.0, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext unavailable or restricted
    }
  };

  const handleTogglePlay = () => {
    if (!isPlaying) {
      playTelemetrySound();
      setIsPlaying(true);
      setAudioProgress(0);
      audioTimerRef.current = setInterval(() => {
        setAudioProgress((prev) => {
          if (prev >= 100) {
            clearInterval(audioTimerRef.current);
            setIsPlaying(false);
            return 0;
          }
          return prev + 8;
        });
      }, 500);
    } else {
      clearInterval(audioTimerRef.current);
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    return () => {
      if (audioTimerRef.current) clearInterval(audioTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const activeReport = reports.find((r) => r.id === activeReportId) || reports[0];

  return (
    <div className="asha-modal-overlay animate-fade-in" onClick={onClose}>
      <div 
        className="asha-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="asha-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div className="brand-logo-icon" style={{ width: '36px', height: '36px' }}>
              <img src="/logo.png" alt="VARSHA Emblem" className="brand-logo-img" />
            </div>
            <div>
              <div className="asha-header-badge font-mono">
                BMC PUBLIC HEALTH SURVEILLANCE · GRASSROOTS ASHA TELEMETRY
              </div>
              <h2 className="asha-header-title">
                ASHA-Vaani · Grassroots Telemetry & Vernacular Triage
              </h2>
              <p className="asha-header-subtitle">
                Authenticated Marathi & Hindi Field Audio Reports from Mumbai Slum Catchments · CDC EARS C₂ Triggers
              </p>
            </div>
          </div>
          <button className="btn-modal-close" onClick={onClose} aria-label="Close Modal" title="Close Modal">
            <X size={18} />
          </button>
        </div>

        {/* Slum Pocket Selection Tabs */}
        <div className="asha-tabs-row">
          {reports.map((rep) => {
            const isSelected = rep.id === activeReportId;
            return (
              <button
                key={rep.id}
                className={`asha-tab-btn ${isSelected ? 'active' : ''}`}
                onClick={() => {
                  setActiveReportId(rep.id);
                  setIsPlaying(false);
                  setAudioProgress(0);
                }}
              >
                <div className="asha-tab-title">
                  {rep.settlement_name}
                </div>
                <div className="asha-tab-sub font-mono">
                  WARD {rep.ward_id} · {rep.language.toUpperCase()}
                </div>
              </button>
            );
          })}
        </div>

        {activeReport && (
          <div className="asha-modal-body">
            {/* Audio Player Card */}
            <div className="audio-player-card">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    className="btn-audio-play"
                    onClick={handleTogglePlay}
                    title={isPlaying ? 'Pause Audio' : 'Play Vernacular Voice Memo'}
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: '2px' }} />}
                  </button>
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)' }}>
                      {activeReport.reporter_designation}
                    </div>
                    <div style={{ fontSize: '10.5px', color: 'var(--text-muted)' }}>
                      Duration: {activeReport.audio_duration_seconds}s · Standardized EARS Z-Score: <strong>+{activeReport.ears_trigger_zscore.toFixed(2)}σ</strong>
                    </div>
                  </div>
                </div>

                <span className="audio-badge font-mono">
                  {isPlaying ? 'TRANSMITTING AUDIO...' : 'VERIFIED GROUND TELEMETRY'}
                </span>
              </div>

              {/* Waveform Equalizer Animation */}
              <div className="audio-waveform-bar">
                <div 
                  className="audio-waveform-progress" 
                  style={{ width: `${audioProgress}%` }} 
                />
                <div className="audio-waveform-visual">
                  {[40, 70, 30, 90, 60, 100, 45, 80, 55, 95, 35, 75, 50, 85, 65, 90, 40, 70].map((h, i) => (
                    <span 
                      key={i} 
                      className={`wave-bar ${isPlaying ? 'animating' : ''}`} 
                      style={{ 
                        height: isPlaying ? `${Math.max(20, (h * (audioProgress % 40)) / 25)}%` : `${h * 0.4}%`,
                        animationDelay: `${i * 0.05}s`
                      }} 
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Side-by-Side Transcripts */}
            <div className="transcripts-grid">
              {/* Vernacular Original */}
              <div className="transcript-box original">
                <div className="transcript-tag">
                  <Sparkles size={12} color="var(--threat-watch)" />
                  <span>Original {activeReport.language} Field Audio</span>
                </div>
                <blockquote className="transcript-text vernacular">
                  "{activeReport.transcript_original}"
                </blockquote>
              </div>

              {/* English Clinical Translation */}
              <div className="transcript-box translation">
                <div className="transcript-tag">
                  <CheckCircle size={12} color="var(--threat-normal)" />
                  <span>Clinical English Translation (Medical Officer)</span>
                </div>
                <blockquote className="transcript-text english">
                  "{activeReport.translation_english}"
                </blockquote>
              </div>
            </div>

            {/* Extracted Clinical Entity Badges */}
            <div className="clinical-entities-box">
              <div style={{ fontSize: '10.5px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.04em' }}>
                Extracted Clinical NER Entities & Pathogen Differential
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
                {activeReport.extracted_clinical_entities.symptom_flags.map((sym, idx) => (
                  <span key={idx} className="entity-chip symptom">
                    {sym}
                  </span>
                ))}
                <span className="entity-chip pathogen">
                  {activeReport.extracted_clinical_entities.suspected_pathogen}
                </span>
                <span className="entity-chip exposure">
                  {activeReport.extracted_clinical_entities.exposure_vector}
                </span>
              </div>

              {/* Immediate Municipal Response Directive */}
              <div className="triage-directive-strip">
                <ShieldAlert size={16} color="var(--threat-emergency)" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '11.5px', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  <strong>Immediate Directive:</strong> {activeReport.extracted_clinical_entities.recommended_immediate_triage}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
