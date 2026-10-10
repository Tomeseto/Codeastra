import React from 'react';
import { CloudRain, MapPin, Compass, FileText } from 'lucide-react';

interface HeaderProps {
  backendHealthy: boolean;
  activeView: 'map' | 'table' | 'simulator';
  onSelectView: (view: 'map' | 'table' | 'simulator') => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  currentDate: string;
  hotspotsCount: number;
  onStartTour?: () => void;
  onOpenBriefing?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealthy,
  activeView,
  onSelectView,
  showHotspots,
  onToggleHotspots,
  currentDate,
  hotspotsCount,
  onStartTour,
  onOpenBriefing
}) => {
  return (
    <header className="app-header">
      {/* Brand Identity */}
      <div className="brand-section">
        <div className="brand-logo-icon">
          <CloudRain size={17} color="var(--text-main)" />
        </div>
        <div className="brand-text">
          <div className="brand-title-row">
            <h1>VARSHA</h1>
            <span className="brand-badge font-mono">MUMBAI EOC</span>
          </div>
          <span className="brand-subtitle">
            Monsoon Flood Exposure & Outbreak Early Warning
          </span>
        </div>
      </div>

      {/* Center Operational State Pill */}
      <div className="header-status-pill">
        <span className={`status-indicator-dot ${backendHealthy ? 'live' : 'sync'}`} />
        <span className="status-text font-mono">
          Surveillance Active · {currentDate}
        </span>
      </div>

      {/* Right Command Controls */}
      <div className="header-controls">
        {/* Unified 3-View Segmented Control */}
        <div className="segmented-control" role="tablist">
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
          <button
            role="tab"
            aria-selected={activeView === 'simulator'}
            className={`segmented-option ${activeView === 'simulator' ? 'active' : ''}`}
            onClick={() => onSelectView('simulator')}
          >
            Deluge Simulator
          </button>
        </div>

        {/* Hotspots Toggle */}
        <button
          className={`btn-hotspots-toggle ${showHotspots ? 'active' : ''}`}
          onClick={onToggleHotspots}
          title={showHotspots ? 'Hide Chronic Flood Hotspots' : 'Show Chronic Flood Hotspots'}
          aria-label="Toggle Hotspots"
        >
          <MapPin size={13} />
          <span>Hotspots ({hotspotsCount})</span>
        </button>

        {/* 1-Click Executive Cabinet Briefing Sheet Modal */}
        {onOpenBriefing && (
          <button
            className="btn-header-briefing"
            onClick={onOpenBriefing}
            title="Export official 1-page BMC Disaster Cabinet Briefing Sheet"
          >
            <FileText size={13} />
            <span>Briefing Sheet</span>
          </button>
        )}

        {/* 4-Step Judge Storyboard Demonstration Walkthrough */}
        {onStartTour && (
          <button
            className="btn-header-tour"
            onClick={onStartTour}
            title="Start 4-Step Judge Demonstration Storyboard Walkthrough"
          >
            <Compass size={13} />
            <span>Judge Tour</span>
          </button>
        )}
      </div>
    </header>
  );
};
