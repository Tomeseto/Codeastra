import React from 'react';
import { CloudRain, Activity, Layers, Sliders, Table2, Compass } from 'lucide-react';

interface HeaderProps {
  backendHealthy: boolean;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  showSimulation: boolean;
  onToggleSimulation: () => void;
  showTable: boolean;
  onToggleTable: () => void;
  onStartTour: () => void;
  currentDate: string;
}

export const Header: React.FC<HeaderProps> = ({
  backendHealthy,
  showHotspots,
  onToggleHotspots,
  showSimulation,
  onToggleSimulation,
  showTable,
  onToggleTable,
  onStartTour,
  currentDate
}) => {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-logo-icon">
          <CloudRain size={20} />
        </div>
        <div className="brand-text">
          <h1>VARSHA</h1>
          <span className="brand-subtitle">
            Vector-And-Rain-driven Surveillance for Health Alerts · Mumbai 24 Wards
          </span>
        </div>
      </div>

      <div className="header-status-strip">
        <div className="status-badge">
          <div className={`status-dot ${backendHealthy ? '' : 'status-dot-offline'}`} />
          <span>{backendHealthy ? 'API Engine Active' : 'Connecting Engine...'}</span>
        </div>

        <div className="status-badge font-mono" style={{ color: '#38bdf8' }}>
          <Activity size={14} />
          <span>Point-in-Time: {currentDate}</span>
        </div>

        <button
          className={`btn-secondary ${showTable ? 'active-layer' : ''}`}
          onClick={onToggleTable}
          title="Toggle sortable 24-ward exposure rankings table"
          style={showTable ? { borderColor: '#38bdf8', color: '#38bdf8' } : {}}
        >
          <Table2 size={14} />
          <span>{showTable ? 'Show Map' : 'Rankings Table'}</span>
        </button>

        <button
          className={`btn-secondary ${showHotspots ? 'active-layer' : ''}`}
          onClick={onToggleHotspots}
          title="Toggle verified BMC chronic flood waterlogging spots"
          style={showHotspots ? { borderColor: '#f97316', color: '#f97316' } : {}}
        >
          <Layers size={14} />
          <span>{showHotspots ? 'Hotspots Active' : 'Show Flood Spots'}</span>
        </button>

        <button
          className="btn-secondary"
          onClick={onStartTour}
          title="Start 4-Step Judge Demonstration Storyboard Walkthrough"
          style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.15) 0%, rgba(2, 132, 199, 0.25) 100%)',
            borderColor: '#38bdf8',
            color: '#38bdf8',
            fontWeight: 600,
            boxShadow: '0 0 10px rgba(56, 189, 248, 0.2)'
          }}
        >
          <Compass size={14} />
          <span>Judge Demo Tour</span>
        </button>

        <button
          className="btn-primary"
          onClick={onToggleSimulation}
          title="Open Scenario Simulation Slider"
        >
          <Sliders size={14} />
          <span>{showSimulation ? 'Close Simulator' : 'Scenario Sandbox'}</span>
        </button>
      </div>
    </header>
  );
};
