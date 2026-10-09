import React, { useState, useEffect, useMemo } from 'react';
import './App.css';
import { Header } from './components/Header';
import { UnifiedInspector } from './components/UnifiedInspector';
import { WardMap } from './components/WardMap';
import { TimeMachine } from './components/TimeMachine';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { WardListTable } from './components/WardListTable';
import type { DailyExposureSummary, WardExposureScore, ChronicHotspot } from './types';

export const App: React.FC = () => {
  const [backendHealthy, setBackendHealthy] = useState<boolean>(false);
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [timelineDays, setTimelineDays] = useState<DailyExposureSummary[]>([]);
  const [currentDateIndex, setCurrentDateIndex] = useState<number>(5); // Default to July 5 early-warning trigger
  const [selectedWardId, setSelectedWardId] = useState<string | null>(null); // Default to City Overview
  const [useImdWindow, setUseImdWindow] = useState<boolean>(false);
  
  // Unified 3-View Mode: 'map' | 'table' | 'simulator'
  const [activeView, setActiveView] = useState<'map' | 'table' | 'simulator'>('map');

  // Hotspots Layer
  const [showHotspots, setShowHotspots] = useState<boolean>(true);
  const [allHotspots, setAllHotspots] = useState<ChronicHotspot[]>([]);

  // Collapsible Single Inspector State
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(false);

  // Scenario Simulator State
  const [simulationRainfall, setSimulationRainfall] = useState<number>(85.0);
  const [applyUniformly, setApplyUniformly] = useState<boolean>(true);
  const [simulatedSummary, setSimulatedSummary] = useState<DailyExposureSummary | null>(null);

  // 1. Initial Load: Health, GeoJSON, Timeline, and Hotspots
  useEffect(() => {
    // Health Check
    fetch('/api/v1/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'healthy') setBackendHealthy(true);
      })
      .catch(() => setBackendHealthy(false));

    // Fetch 24-Ward GeoJSON
    fetch('/api/v1/wards')
      .then((res) => res.json())
      .then((data) => setGeojsonData(data))
      .catch((err) => console.error('Failed to load GeoJSON:', err));

    // Fetch Timeline
    loadTimeline(false);

    // Fetch Hotspots across all wards
    fetch('/api/v1/wards/list')
      .then((res) => res.json())
      .then(async (wardsList) => {
        const spots: ChronicHotspot[] = [];
        for (const w of wardsList) {
          try {
            const hResp = await fetch(`/api/v1/wards/${w.ward_id}/hotspots`);
            const hData = await hResp.json();
            if (Array.isArray(hData)) {
              spots.push(...hData);
            }
          } catch {
            // ignore individual fail
          }
        }
        setAllHotspots(spots);
      })
      .catch((err) => console.error('Failed to load hotspots:', err));
  }, []);

  const loadTimeline = (useImd: boolean) => {
    fetch(`/api/v1/exposure/timeline?use_imd_window=${useImd}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.days && Array.isArray(data.days) && data.days.length > 0) {
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

  // 2. Dynamic Simulation Calculation when Simulator view is active
  useEffect(() => {
    if (activeView !== 'simulator') {
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
      .catch((err) => console.error('Simulation calculation error:', err));
  }, [activeView, simulationRainfall, applyUniformly, selectedWardId, currentDateIndex, useImdWindow, timelineDays]);

  // Determine Active Summary (either Simulator or Timeline Day)
  const activeSummary: DailyExposureSummary | null = useMemo(() => {
    if (activeView === 'simulator' && simulatedSummary) {
      return simulatedSummary;
    }
    return timelineDays[currentDateIndex] || null;
  }, [activeView, simulatedSummary, timelineDays, currentDateIndex]);

  const dates = useMemo(() => timelineDays.map((d) => d.date), [timelineDays]);
  const currentDate = dates[currentDateIndex] || '2026-07-05';

  const exposureScores = useMemo(() => {
    return activeSummary?.wards || {};
  }, [activeSummary]);

  // Selected Ward Score & Properties
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

  const handleSelectWard = (wid: string | null) => {
    setSelectedWardId(wid);
    if (wid) {
      setIsInspectorCollapsed(false);
    }
  };

  return (
    <div className="app-container">
      {/* 1. Calm Editorial Header */}
      <Header
        backendHealthy={backendHealthy}
        activeView={activeView}
        onSelectView={setActiveView}
        showHotspots={showHotspots}
        onToggleHotspots={() => setShowHotspots(!showHotspots)}
        currentDate={currentDate}
        hotspotsCount={allHotspots.length || 70}
      />

      {/* 2. Main Workspace: Full-Bleed Map Canvas with Unified Contextual Inspector */}
      <div className="main-workspace">
        {activeView === 'table' ? (
          <main className="workspace-center full-width">
            <WardListTable
              exposureScores={exposureScores}
              wardsProperties={wardsPropertiesMap}
              selectedWardId={selectedWardId}
              onSelectWard={(wid) => {
                handleSelectWard(wid);
                setActiveView('map');
              }}
              onClose={() => setActiveView('map')}
            />
          </main>
        ) : activeView === 'simulator' ? (
          <main className="workspace-center full-width">
            <ScenarioSimulator
              simulationRainfall={simulationRainfall}
              onSimulationRainfallChange={setSimulationRainfall}
              selectedWardId={selectedWardId}
              applyUniformly={applyUniformly}
              onToggleApplyUniformly={() => setApplyUniformly(!applyUniformly)}
              onReset={() => {
                setSimulationRainfall(85.0);
                setActiveView('map');
              }}
              simulatedSummary={simulatedSummary}
            />
          </main>
        ) : (
          <>
            {/* Center Slot: Full-Bleed Cartographic Map */}
            <main className="workspace-center">
              <WardMap
                geojsonData={geojsonData}
                exposureScores={exposureScores}
                selectedWardId={selectedWardId}
                onSelectWard={handleSelectWard}
                showHotspots={showHotspots}
                hotspotsList={allHotspots}
              />

              {/* Floating Quick Telemetry Pill on Map */}
              {activeSummary && (
                <button
                  className="map-floating-quickstat"
                  onClick={() => setSelectedWardId(null)}
                  title="Click to view Citywide Threat Radar"
                >
                  <span className="quickstat-dot" />
                  <span className="font-mono">
                    City Avg: <strong>{activeSummary.city_average_exposure.toFixed(1)}</strong>
                  </span>
                  <span className="quickstat-sep">·</span>
                  <span className="quickstat-emergency">
                    {activeSummary.emergency_ward_count || 4} Emergency Wards
                  </span>
                </button>
              )}
            </main>

            {/* Right Slot: Unified Contextual Intelligence Inspector */}
            <UnifiedInspector
              activeSummary={activeSummary}
              exposureScores={exposureScores}
              selectedWardId={selectedWardId}
              onSelectWard={handleSelectWard}
              wardScore={selectedWardScore}
              wardProperties={selectedWardProperties}
              hotspots={selectedWardHotspots}
              isCollapsed={isInspectorCollapsed}
              onToggleCollapse={() => setIsInspectorCollapsed(!isInspectorCollapsed)}
            />
          </>
        )}
      </div>

      {/* 3. Bottom Slot: Sleek Minimalist Timeline Scrubber (Docked in Map Mode) */}
      {activeView === 'map' && (
        <footer className="workspace-deck-compact">
          <TimeMachine
            dates={dates}
            currentDateIndex={currentDateIndex}
            onSelectDateIndex={setCurrentDateIndex}
            useImdWindow={useImdWindow}
            onToggleImdWindow={handleToggleImdWindow}
            milestones={activeSummary?.milestones || []}
            timelineDays={timelineDays}
          />
        </footer>
      )}
    </div>
  );
};

export default App;
