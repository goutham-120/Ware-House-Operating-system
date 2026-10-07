import React from 'react';
import { Play, Pause, RotateCcw, Zap, Activity, Cpu, ShieldAlert, Sliders } from 'lucide-react';

export const Header = ({
  state,
  isConnected,
  onStart,
  onPause,
  onResume,
  onReset,
  onSpeed,
  onOpenConfig,
  activeTab,
  setActiveTab,
}) => {
  const isRunning = state.status === 'RUNNING';
  const isPaused = state.status === 'PAUSED';

  return (
    <header className="bg-navy-800 border-b border-navy-600 px-6 py-3 sticky top-0 z-40">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Title and Academic OS Mapping */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/20 p-2.5 rounded-lg border border-blue-500/30 text-blue-400">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white">
                Warehouse Operating System
              </h1>
              <span className="text-xs px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
                OS Process Synchronization
              </span>
              <span className={`text-xs px-2 py-0.5 rounded flex items-center gap-1 font-mono ${
                isConnected ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-red-950 text-red-400 border border-red-800'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                {isConnected ? 'LIVE WS' : 'DISCONNECTED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Concurrent Robot Coordination • <span className="text-slate-300">Robots = Processes/Threads</span> • <span className="text-slate-300">Warehouse = Shared Resources</span>
            </p>
          </div>
        </div>

        {/* Global Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Active Technique Badge */}
          <div className="bg-navy-700 border border-navy-500 rounded-lg px-3 py-1.5 flex items-center space-x-2 text-xs">
            <span className="text-slate-400">Technique:</span>
            <span className={`font-semibold ${
              state.config.technique === 'No Synchronization' ? 'text-red-400' : 'text-cyan-400'
            }`}>
              {state.config.technique}
            </span>
          </div>

          {/* Speed Selector */}
          <div className="flex items-center bg-navy-900 border border-navy-700 rounded-lg p-0.5 text-xs">
            {['Slow', 'Normal', 'Fast'].map((spd) => (
              <button
                key={spd}
                onClick={() => onSpeed(spd)}
                className={`px-2.5 py-1 rounded transition-colors ${
                  state.config.speed === spd
                    ? 'bg-blue-600 text-white font-medium shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}
              </button>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {!isRunning && !isPaused && (
              <button
                onClick={onStart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                START
              </button>
            )}

            {isRunning && (
              <button
                onClick={onPause}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
              >
                <Pause className="w-3.5 h-3.5 fill-current" />
                PAUSE
              </button>
            )}

            {isPaused && (
              <button
                onClick={onResume}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                RESUME
              </button>
            )}

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-slate-200 border border-navy-500 font-medium text-xs transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              RESET
            </button>

            <button
              onClick={onOpenConfig}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-600 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5" />
              CONFIGURE
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 mt-3 border-t border-navy-700 pt-2 overflow-x-auto text-xs">
        {[
          { id: 'warehouse', label: 'Warehouse & Monitor' },
          { id: 'demos', label: 'OS Concept Demonstrations' },
          { id: 'comparison', label: 'Technique Comparison' },
          { id: 'analytics', label: 'Performance Analytics' },
          { id: 'events', label: 'Real-Time Event Log' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-md transition-all whitespace-nowrap font-medium cursor-pointer ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-navy-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
