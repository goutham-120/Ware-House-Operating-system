import React, { useState, useEffect } from 'react';
import { useSimulation } from './hooks/useSimulation';
import { Header } from './components/Header';
import { SummaryCards } from './components/SummaryCards';
import { WarehouseView } from './components/WarehouseView';
import { RobotMonitor } from './components/RobotMonitor';
import { ResourceAndSyncMonitor } from './components/ResourceAndSyncMonitor';
import { DemonstrationMode } from './components/DemonstrationMode';
import { TechniqueComparison } from './components/TechniqueComparison';
import { PerformanceAnalytics } from './components/PerformanceAnalytics';
import { EventLog } from './components/EventLog';
import { VivaGuide } from './components/VivaGuide';
import { SimulationConfigModal } from './components/SimulationConfigModal';
import * as api from './services/api';

export function App() {
  const {
    state,
    isConnected,
    error,
    start,
    pause,
    resume,
    reset,
    setSpeed,
    configure,
    triggerRaceCondition,
    triggerDeadlock,
    recoverDeadlock,
    triggerStarvation,
    loadPreset,
  } = useSimulation();

  const [activeTab, setActiveTab] = useState('warehouse');
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [presets, setPresets] = useState([]);

  useEffect(() => {
    api.fetchPresets().then((data) => {
      if (data) setPresets(data);
    }).catch((e) => console.error('Failed to fetch presets:', e));
  }, []);

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        state={state}
        isConnected={isConnected}
        onStart={start}
        onPause={pause}
        onResume={resume}
        onReset={reset}
        onSpeed={setSpeed}
        onOpenConfig={() => setIsConfigOpen(true)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Workspace Area */}
      <main className="flex-1 p-4 lg:p-6 max-w-7xl mx-auto w-full space-y-4">
        {/* Error notification if backend is offline */}
        {error && (
          <div className="p-3 bg-red-950/80 border border-red-700 rounded-lg text-red-300 text-xs flex items-center justify-between">
            <span>{error}</span>
            <span className="text-[11px] text-slate-400">Ensure backend server is running on port 8000</span>
          </div>
        )}

        {/* Top Summary Cards (Always Visible) */}
        <SummaryCards state={state} />

        {/* Tab 1: Live Warehouse & Monitor */}
        {activeTab === 'warehouse' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* 2D Warehouse Floor */}
              <div className="lg:col-span-7">
                <WarehouseView
                  resources={state.resources}
                  robots={state.robots}
                />
              </div>

              {/* Resource & Sync Primitives Live State */}
              <div className="lg:col-span-5 flex flex-col gap-4">
                <ResourceAndSyncMonitor
                  resources={state.resources}
                  syncDetails={state.sync_details}
                  technique={state.config?.technique}
                />
              </div>
            </div>

            {/* Robot Process Thread Monitor */}
            <div>
              <RobotMonitor robots={state.robots} />
            </div>
          </div>
        )}

        {/* Tab 2: OS Concept Demonstrations */}
        {activeTab === 'demos' && (
          <DemonstrationMode
            state={state}
            onTriggerRace={triggerRaceCondition}
            onTriggerDeadlock={triggerDeadlock}
            onRecoverDeadlock={recoverDeadlock}
            onTriggerStarvation={triggerStarvation}
            onLoadPreset={loadPreset}
            onStart={start}
          />
        )}

        {/* Tab 3: Technique Comparison Benchmark Suite */}
        {activeTab === 'comparison' && (
          <TechniqueComparison />
        )}

        {/* Tab 4: Performance Analytics */}
        {activeTab === 'analytics' && (
          <PerformanceAnalytics state={state} />
        )}

        {/* Tab 5: Real-Time Event Log */}
        {activeTab === 'events' && (
          <EventLog events={state.events} />
        )}

        {/* Tab 6: OS Viva Guide */}
        {activeTab === 'viva' && (
          <VivaGuide />
        )}
      </main>

      {/* Configuration Modal */}
      <SimulationConfigModal
        isOpen={isConfigOpen}
        onClose={() => setIsConfigOpen(false)}
        currentConfig={state.config}
        onApplyConfig={configure}
        onStartSimulation={start}
        onLoadPreset={loadPreset}
        presets={presets}
      />
    </div>
  );
}

export default App;
