import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Header } from './components/Header';
import { WardMap } from './components/WardMap';
import { TimeMachine } from './components/TimeMachine';
import { EvidenceDrawer } from './components/EvidenceDrawer';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { WardListTable } from './components/WardListTable';
import { JudgeTourGuide } from './components/JudgeTourGuide';
import type { DailyExposureSummary, WardExposureScore, ChronicHotspot } from './types';

export const App: React.FC = () => {
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [timelineDays, setTimelineDays] = useState<DailyExposureSummary[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(5); // Default to July 5 peak (index 5)
  const [selectedWardId, setSelectedWardId] = useState<string | null>('L'); // Default to high-risk Ward L (Kurla)
  const [useImdWindow, setUseImdWindow] = useState<boolean>(false);
  
  // Guided Judge Storyboard Tour
  const [isTourOpen, setIsTourOpen] = useState<boolean>(false);

  // Hotspots layer state
  const [showHotspots, setShowHotspots] = useState<boolean>(false);
  const [allHotspots, setAllHotspots] = useState<ChronicHotspot[]>([]);

  // Rankings table state
  const [showTable, setShowTable] = useState<boolean>(false);
  
  // Scenario simulation state
  const [showSimulation, setShowSimulation] = useState<boolean>(false);
  const [simulationRainfall, setSimulationRainfall] = useState<number>(85.0);
  const [applyUniformly, setApplyUniformly] = useState<boolean>(true);
  const [simulatedSummary, setSimulatedSummary] = useState<DailyExposureSummary | null>(null);

  // 1. Initial Load: Check Health, Fetch GeoJSON and Timeline
  useEffect(() => {
    // Health Check
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'healthy') setBackendHealthy(true);
      })
      .catch(() => setBackendHealthy(false));

    // Fetch GeoJSON
    fetch('/api/v1/wards')
      .then((res) => res.json())
      .then((data) => {
        setGeojsonData(data);
      })
      .catch((err) => console.error('Failed to load GeoJSON:', err));

    // Fetch Timeline
    loadTimeline(false);
  }, []);

  const loadTimeline = (useImd: boolean) => {
    fetch(`/api/v1/exposure/timeline?use_imd_window=${useImd}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.days && data.days.length > 0) {
          setTimelineDays(data.days);
        }
      })
      .catch((err) => console.error('Failed to load timeline:', err));
  };

  const handleToggleImdWindow = () => {
    const nextVal = !useImdWindow;
    setUseImdWindow(nextVal);
    loadTimeline(nextVal);
  };

  // 2. Load all hotspots when hotspots layer is toggled
  useEffect(() => {
    if (showHotspots && allHotspots.length === 0) {
      // Extract from GeoJSON properties or ward endpoints
      fetch('/api/v1/wards/list')
        .then((res) => res.json())
        .then(async (wardsList) => {
          const spots: ChronicHotspot[] = [];
          for (const w of wardsList) {
            try {
              const hResp = await fetch(`/api/v1/wards/${w.ward_id}/hotspots`);
              const hData = await hResp.json();
              spots.push(...hData);
            } catch (e) {
              // Ignore single failure
            }
          }
          setAllHotspots(spots);
        })
        .catch((err) => console.error('Failed to load hotspots:', err));
    }
  }, [showHotspots, allHotspots.length]);

  // 3. Dynamic Simulation Calculation when simulation is active
  useEffect(() => {
    if (!showSimulation) {
      setSimulatedSummary(null);
      return;
    }

    const payload: any = {
      date: timelineDays[currentDateIndex]?.date || '2026-07-05',
      use_imd_window: useImdWindow
    };

    if (applyUniformly) {
      payload.uniform_rainfall_mm = simulationRainfall;
    } else if (selectedWardId) {
      payload.rainfall_overrides = {
        [selectedWardId]: simulationRainfall
      };
    }

    fetch('/api/v1/exposure/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then((res) => res.json())
      .then((data) => setSimulatedSummary(data))
      .catch((err) => console.error('Simulation error:', err));
  }, [showSimulation, simulationRainfall, applyUniformly, selectedWardId, currentDateIndex, useImdWindow, timelineDays]);

  // Determine active summary (either from Simulation or Historical Timeline Day)
  const activeSummary: DailyExposureSummary | null = useMemo(() => {
    if (showSimulation && simulatedSummary) {
      return simulatedSummary;
    }
    return timelineDays[currentDateIndex] || null;
  }, [showSimulation, simulatedSummary, timelineDays, currentDateIndex]);

  const dates = useMemo(() => timelineDays.map((d) => d.date), [timelineDays]);
  const currentDate = dates[currentDateIndex] || '2026-07-05';

  const exposureScores = useMemo(() => {
    return activeSummary?.wards || {};
  }, [activeSummary]);

  // Selected ward details
  const selectedWardScore: WardExposureScore | null = useMemo(() => {
    if (!selectedWardId || !activeSummary) return null;
    return activeSummary.wards[selectedWardId] || null;
  }, [selectedWardId, activeSummary]);

  const selectedWardProperties = useMemo(() => {
    if (!selectedWardId || !geojsonData) return null;
    const feat = geojsonData.features?.find((f: any) => f.properties?.ward_id === selectedWardId);
    return feat ? feat.properties : null;
  }, [selectedWardId, geojsonData]);

  const selectedWardHotspots: ChronicHotspot[] = useMemo(() => {
    if (!selectedWardId) return [];
    return allHotspots.filter((h) => h.ward_id === selectedWardId);
  }, [selectedWardId, allHotspots]);

  const wardsPropertiesMap = useMemo(() => {
    if (!geojsonData?.features) return {};
    const map: Record<string, any> = {};
    geojsonData.features.forEach((f: any) => {
      const wid = f.properties?.ward_id;
      if (wid) map[wid] = f.properties;
    });
    return map;
  }, [geojsonData]);

  const handleNavigateTourStep = (stepNumber: number) => {
    setShowSimulation(false);
    setShowTable(false);

    if (stepNumber === 1) {
      // Step 1: Baseline (Dry City Pre-Monsoon - 30 June 2026)
      const idx = dates.indexOf('2026-06-30');
      setCurrentDateIndex(idx >= 0 ? idx : 0);
      setSelectedWardId(null);
    } else if (stepNumber === 2) {
      // Step 2: Flood Inundation & Hotspot Saturation (04 July 2026)
      const idx = dates.indexOf('2026-07-04');
      setCurrentDateIndex(idx >= 0 ? idx : 4);
      setSelectedWardId('L');
    } else if (stepNumber === 3) {
      // Step 3: Peak Deluge & Advance Emergency Warning (+38.15h) (05 July 2026)
      const idx = dates.indexOf('2026-07-05');
      setCurrentDateIndex(idx >= 0 ? idx : 5);
      setSelectedWardId('L');
    } else if (stepNumber === 4) {
      // Step 4: 14-Day Clinical Incubation Window & Vector Directives
      const idx = dates.indexOf('2026-07-05');
      setCurrentDateIndex(idx >= 0 ? idx : 5);
      setSelectedWardId('L');
    }
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Header
        backendHealthy={backendHealthy}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots(!showHotspots)}
        showSimulation={showSimulation}
        onToggleSimulation={() => setShowSimulation(!showSimulation)}
        showTable={showTable}
        onToggleTable={() => setShowTable(!showTable)}
        onStartTour={() => {
          setIsTourOpen(true);
          handleNavigateTourStep(1);
        }}
        currentDate={currentDate}
      />

      <div className="main-workspace">
        {/* Floating Top-Left Citywide Metric Strip */}
        {activeSummary && (
          <div className="stats-overlay">
            <div className="stat-chip">
              <span className="stat-label">City Average</span>
              <span className="stat-value" style={{ color: activeSummary.city_average_exposure >= 55 ? '#f97316' : '#38bdf8' }}>
                {activeSummary.city_average_exposure.toFixed(1)}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Max Ward Exposure</span>
              <span className="stat-value" style={{ color: activeSummary.city_max_exposure >= 75 ? '#ef4444' : '#f59e0b' }}>
                {activeSummary.city_max_exposure.toFixed(1)}
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Emergency Wards</span>
              <span className="stat-value" style={{ color: activeSummary.emergency_ward_count > 0 ? '#ef4444' : '#10b981' }}>
                {activeSummary.emergency_ward_count} / 24
              </span>
            </div>
            <div className="stat-chip">
              <span className="stat-label">Warning Wards</span>
              <span className="stat-value" style={{ color: activeSummary.warning_ward_count > 0 ? '#f97316' : '#10b981' }}>
                {activeSummary.warning_ward_count}
              </span>
            </div>
          </div>
        )}

        {/* Mode Separation Indicator Banner */}
        {showSimulation && (
          <div style={{
            position: 'absolute',
            top: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 500,
            background: 'rgba(245, 158, 11, 0.95)',
            color: '#0f172a',
            padding: '6px 18px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.5)',
            letterSpacing: '0.02em',
            pointerEvents: 'none'
          }}>
            <span>⚠️ SCENARIO SIMULATION ACTIVE</span>
            <span style={{ fontWeight: 500, opacity: 0.9 }}>— Hypothetical sandbox test (Historical records untouched)</span>
          </div>
        )}

        {/* 24-Ward Rankings Table View (when toggled) */}
        {showTable && (
          <WardListTable
            exposureScores={exposureScores}
            wardsProperties={wardsPropertiesMap}
            selectedWardId={selectedWardId}
            onSelectWard={(wid) => {
              setSelectedWardId(wid);
              setShowTable(false);
            }}
            onClose={() => setShowTable(false)}
          />
        )}

        {/* Scenario Simulator Overlay (when toggled) */}
        {showSimulation && (
          <ScenarioSimulator
            simulationRainfall={simulationRainfall}
            onSimulationRainfallChange={setSimulationRainfall}
            selectedWardId={selectedWardId}
            applyUniformly={applyUniformly}
            onToggleApplyUniformly={() => setApplyUniformly(!applyUniformly)}
            onReset={() => {
              setSimulationRainfall(85.0);
              setShowSimulation(false);
            }}
          />
        )}

        {/* Center Interactive Leaflet Map */}
        <WardMap
          geojsonData={geojsonData}
          exposureScores={exposureScores}
          selectedWardId={selectedWardId}
          onSelectWard={(wid) => setSelectedWardId(wid)}
          showHotspots={showHotspots}
          hotspotsList={allHotspots}
        />

        {/* Bottom Historical Time Machine Replay Controller */}
        {dates.length > 0 && !showSimulation && (
          <TimeMachine
            dates={dates}
            currentDateIndex={currentDateIndex}
            onSelectDateIndex={setCurrentDateIndex}
            useImdWindow={useImdWindow}
            onToggleImdWindow={handleToggleImdWindow}
            milestones={activeSummary?.milestones || []}
          />
        )}

        {/* Right Side Explainability & Evidence Drawer */}
        <EvidenceDrawer
          wardScore={selectedWardScore}
          wardProperties={selectedWardProperties}
          hotspots={selectedWardHotspots}
          onClose={() => setSelectedWardId(null)}
        />

        {/* 4-Step Judge Demonstration Storyboard Walkthrough Guide */}
        <JudgeTourGuide
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          onNavigateStep={handleNavigateTourStep}
        />
      </div>
    </div>
  );
};

export default App;
