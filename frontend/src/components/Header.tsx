import React, { useState, useEffect } from 'react';
import { CloudRain, Activity, Layers, Clock, Database } from 'lucide-react';

interface HeaderProps {
  backendHealthy: boolean;
  activeView: 'map' | 'table';
  onSelectView: (view: 'map' | 'table') => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  activeDeckTab: 'timemachine' | 'simulator';
  onSelectDeckTab: (tab: 'timemachine' | 'simulator') => void;
  currentDate: string;
  hotspotsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealthy,
  activeView,
  onSelectView,
  showHotspots,
  onToggleHotspots,
  activeDeckTab,
  onSelectDeckTab,
  currentDate,
  hotspotsCount
}) => {
  // Live IST Clock
  const [istTime, setIstTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setIstTime(now.toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="app-header">
      {/* Brand Identity with Neutral Structural Accent */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <CloudRain size={18} color="var(--text-main)" />
        </div>
        <div className="brand-text">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1>VARSHA EOC</h1>
            <span className="brand-badge">MCGM SURVEILLANCE</span>
          </div>
          <span className="brand-subtitle">
            Municipal Environmental Flood Exposure & Early-Warning Cockpit · Mumbai
          </span>
        </div>
      </div>

      {/* Center Telemetry Strip */}
      <div className="header-telemetry-strip">
        {/* Backend Heartbeat Pill */}
        <div className={`status-pill ${backendHealthy ? 'healthy' : 'connecting'}`}>
          <div className="status-dot-pulse" />
          <span>{backendHealthy ? 'Engine Live' : 'Connecting Engine...'}</span>
        </div>

        {/* Live IST Clock */}
        <div className="telemetry-item font-mono">
          <Clock size={13} color="var(--text-muted)" />
          <span>{istTime}</span>
        </div>

        {/* Point-in-Time Date Stamp */}
        <div className="telemetry-item font-mono" style={{ color: 'var(--accent-live)' }}>
          <Activity size={13} />
          <span>Date: {currentDate}</span>
        </div>

        {/* Verified Provenance Badge */}
        <div className="provenance-badge" title="Cryptographically verified data lineage">
          <Database size={12} color="var(--text-dim)" />
          <span>Census 2011 · ERA5 Reanalysis</span>
        </div>
      </div>

      {/* Right Command Controls */}
      <div className="header-controls">
        {/* Segmented View Switcher: Map vs Table */}
        <div className="segmented-control" role="tablist" aria-label="View Mode">
          <button
            role="tab"
            aria-selected={activeView === 'map'}
            className={`segmented-option ${activeView === 'map' ? 'active' : ''}`}
            onClick={() => onSelectView('map')}
          >
            Tactical Map
          </button>
          <button
            role="tab"
            aria-selected={activeView === 'table'}
            className={`segmented-option ${activeView === 'table' ? 'active' : ''}`}
            onClick={() => onSelectView('table')}
          >
            24-Ward Table
          </button>
        </div>

        {/* Segmented Bottom Deck Mode: Time Machine vs Simulator */}
        <div className="segmented-control" role="tablist" aria-label="Deck Mode">
          <button
            role="tab"
            aria-selected={activeDeckTab === 'timemachine'}
            className={`segmented-option ${activeDeckTab === 'timemachine' ? 'active' : ''}`}
            onClick={() => onSelectDeckTab('timemachine')}
          >
            Time Machine
          </button>
          <button
            role="tab"
            aria-selected={activeDeckTab === 'simulator'}
            className={`segmented-option ${activeDeckTab === 'simulator' ? 'active' : ''}`}
            onClick={() => onSelectDeckTab('simulator')}
          >
            Sandbox Simulator
          </button>
        </div>

        {/* Hotspots Layer Toggle */}
        <button
          className={`btn-secondary ${showHotspots ? 'active-layer' : ''}`}
          onClick={onToggleHotspots}
          title="Toggle verified BMC chronic flood waterlogging spots"
          aria-pressed={showHotspots}
          style={showHotspots ? { borderColor: 'var(--threat-warning)', color: 'var(--threat-warning)' } : {}}
        >
          <Layers size={13} />
          <span>Hotspots ({hotspotsCount})</span>
        </button>
      </div>
    </header>
  );
};
