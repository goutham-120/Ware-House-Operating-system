import React, { useState } from 'react';
import { Sliders, X, Check, Play } from 'lucide-react';

const ALL_TASKS = [
  'Pick Item',
  'Transport Item',
  'Move to Storage',
  'Load Item',
  'Unload Item',
  'Charge Robot',
];

export const SimulationConfigModal = ({
  isOpen,
  onClose,
  currentConfig,
  onApplyConfig,
  onStartSimulation,
  onLoadPreset,
  presets = [],
}) => {
  if (!isOpen) return null;

  const [robotCount, setRobotCount] = useState(currentConfig.robot_count || 5);
  const [customRobotCount, setCustomRobotCount] = useState('');
  const [isCustomRobots, setIsCustomRobots] = useState(
    ![2, 3, 5, 10, 15].includes(currentConfig.robot_count)
  );

  const [technique, setTechnique] = useState(currentConfig.technique || 'Mutex / Lock');
  const [speed, setSpeed] = useState(currentConfig.speed || 'Normal');

  const [selectedTasks, setSelectedTasks] = useState(
    currentConfig.selected_tasks || ALL_TASKS
  );

  const [chargingStations, setChargingStations] = useState(
    currentConfig.resource_capacities?.charging_stations || 2
  );
  const [loadingBays, setLoadingBays] = useState(
    currentConfig.resource_capacities?.loading_bays || 1
  );
  const [narrowCorridors, setNarrowCorridors] = useState(
    currentConfig.resource_capacities?.narrow_corridors || 2
  );
  const [storageZones, setStorageZones] = useState(
    currentConfig.resource_capacities?.storage_zones || 2
  );

  const [agingEnabled, setAgingEnabled] = useState(
    currentConfig.aging_enabled ?? true
  );
  const [starvationThreshold, setStarvationThreshold] = useState(
    currentConfig.starvation_threshold || 8.0
  );

  const handleSelectAllTasks = () => setSelectedTasks([...ALL_TASKS]);
  const handleClearAllTasks = () => setSelectedTasks([]);

  const toggleTask = (task) => {
    if (selectedTasks.includes(task)) {
      setSelectedTasks(selectedTasks.filter((t) => t !== task));
    } else {
      setSelectedTasks([...selectedTasks, task]);
    }
  };

  const handleSaveAndApply = (startImmediately = false) => {
    const finalRobotCount = isCustomRobots
      ? Math.max(1, Math.min(25, parseInt(customRobotCount) || 5))
      : robotCount;

    const newConfig = {
      robot_count: finalRobotCount,
      technique,
      speed,
      resource_capacities: {
        charging_stations: chargingStations,
        loading_bays: loadingBays,
        narrow_corridors: narrowCorridors,
        storage_zones: storageZones,
      },
      selected_tasks: selectedTasks.length > 0 ? selectedTasks : ['Transport Item'],
      starvation_threshold: starvationThreshold,
      aging_interval: 3.0,
      aging_enabled: agingEnabled,
    };

    onApplyConfig(newConfig);
    onClose();

    if (startImmediately) {
      setTimeout(onStartSimulation, 300);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-navy-800 border border-navy-600 rounded-xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold text-white">
              Simulation Configuration & Workload Setup
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-navy-700 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto text-xs">
          {/* Quick Preset Selector */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-2">
              Preset Scenarios (Quick OS Concept Demos)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => {
                    onLoadPreset(preset.id);
                    onClose();
                  }}
                  className="p-2.5 rounded-lg bg-navy-900 border border-navy-700 hover:border-blue-500 hover:bg-navy-700/80 text-left transition-all group cursor-pointer"
                >
                  <div className="font-bold text-white text-[11px] group-hover:text-cyan-400">
                    {preset.name}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1 line-clamp-2">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <hr className="border-navy-700" />

          {/* 1. Robot Count */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-2">
              Number of Robots (Concurrent Process Threads)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {[2, 3, 5, 10, 15].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => {
                    setRobotCount(count);
                    setIsCustomRobots(false);
                  }}
                  className={`px-4 py-2 rounded-lg font-bold border transition-all cursor-pointer ${
                    !isCustomRobots && robotCount === count
                      ? 'bg-blue-600 text-white border-blue-400 shadow-md'
                      : 'bg-navy-900 border-navy-700 text-slate-300 hover:bg-navy-700'
                  }`}
                >
                  {count} Robots
                </button>
              ))}

              <div className="flex items-center gap-1.5 ml-2">
                <button
                  type="button"
                  onClick={() => setIsCustomRobots(true)}
                  className={`px-3 py-2 rounded-lg font-bold border cursor-pointer ${
                    isCustomRobots
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-navy-900 border-navy-700 text-slate-300'
                  }`}
                >
                  Custom:
                </button>
                {isCustomRobots && (
                  <input
                    type="number"
                    min="1"
                    max="25"
                    value={customRobotCount || robotCount}
                    onChange={(e) => setCustomRobotCount(e.target.value)}
                    className="w-16 px-2 py-2 rounded-lg bg-navy-900 border border-blue-500 text-white text-center font-bold"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 2. Synchronization Technique */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-2">
              Synchronization Technique (Backend Primitives)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                {
                  id: 'No Synchronization',
                  title: 'No Synchronization',
                  desc: 'Deliberately unguarded critical sections. Exposes race conditions and state corruption.',
                  badge: 'Unsafe Concurrency',
                  color: 'border-red-600/70',
                },
                {
                  id: 'Mutex / Lock',
                  title: 'Mutex / Lock',
                  desc: 'Strict mutual exclusion using threading.Lock. Single process in critical section.',
                  badge: 'Mutual Exclusion',
                  color: 'border-blue-500/70',
                },
                {
                  id: 'Semaphore',
                  title: 'Semaphore',
                  desc: 'Bounded access via counting semaphore threading.Semaphore(capacity).',
                  badge: 'Controlled Multi-Access',
                  color: 'border-emerald-500/70',
                },
                {
                  id: 'Mutex + Semaphore',
                  title: 'Mutex + Semaphore',
                  desc: 'Hybrid: Semaphores control multi-capacity resource slots, Mutex locks guard state.',
                  badge: 'Combined Primitives',
                  color: 'border-purple-500/70',
                },
              ].map((tech) => (
                <div
                  key={tech.id}
                  onClick={() => setTechnique(tech.id)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    technique === tech.id
                      ? `bg-blue-950/60 ${tech.color} shadow-lg ring-1 ring-blue-400`
                      : 'bg-navy-900/60 border-navy-700 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">{tech.title}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-800 text-slate-300 border border-navy-600 font-mono">
                      {tech.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {tech.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Task Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                Workload Task Pool
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllTasks}
                  className="px-2 py-0.5 rounded bg-navy-700 hover:bg-navy-600 text-cyan-400 text-[10px] font-medium cursor-pointer"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={handleClearAllTasks}
                  className="px-2 py-0.5 rounded bg-navy-700 hover:bg-navy-600 text-slate-400 text-[10px] font-medium cursor-pointer"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {ALL_TASKS.map((task) => {
                const isSelected = selectedTasks.includes(task);
                return (
                  <button
                    key={task}
                    type="button"
                    onClick={() => toggleTask(task)}
                    className={`flex items-center justify-between p-2 rounded-lg border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-900/40 border-blue-500 text-white font-medium'
                        : 'bg-navy-900 border-navy-700 text-slate-400 hover:border-navy-500'
                    }`}
                  >
                    <span>{task}</span>
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-blue-500 text-white' : 'border border-slate-600'
                      }`}
                    >
                      {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. Resource Capacity Configuration */}
          <div>
            <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-2">
              Resource Capacities (Shared OS Resources)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Charging Stations', val: chargingStations, set: setChargingStations },
                { label: 'Loading Bays', val: loadingBays, set: setLoadingBays },
                { label: 'Narrow Corridors', val: narrowCorridors, set: setNarrowCorridors },
                { label: 'Storage Zones', val: storageZones, set: setStorageZones },
              ].map((resItem, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-navy-900 border border-navy-700">
                  <span className="text-slate-400 text-[10px] block">{resItem.label}</span>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => resItem.set(Math.max(1, resItem.val - 1))}
                      className="w-6 h-6 rounded bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white font-bold text-center cursor-pointer"
                    >
                      -
                    </button>
                    <span className="font-mono font-bold text-white text-sm w-6 text-center">
                      {resItem.val}
                    </span>
                    <button
                      type="button"
                      onClick={() => resItem.set(Math.min(5, resItem.val + 1))}
                      className="w-6 h-6 rounded bg-navy-800 hover:bg-navy-700 border border-navy-600 text-white font-bold text-center cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 5. Starvation & Priority Aging Setting */}
          <div className="p-3 rounded-lg bg-navy-900 border border-navy-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <span className="font-bold text-white text-xs block">
                Starvation Prevention & Priority Aging
              </span>
              <span className="text-[11px] text-slate-400">
                Elevates process priority when wait time exceeds threshold (Low → Normal → High → Emergency)
              </span>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agingEnabled}
                  onChange={(e) => setAgingEnabled(e.target.checked)}
                  className="rounded bg-navy-800 border-navy-600 text-blue-500"
                />
                <span className="text-slate-300 font-medium text-xs">Enable Aging</span>
              </label>
              <div className="flex items-center gap-1">
                <span className="text-slate-400 text-[11px]">Threshold:</span>
                <input
                  type="number"
                  min="3"
                  max="30"
                  value={starvationThreshold}
                  onChange={(e) => setStarvationThreshold(parseFloat(e.target.value) || 8)}
                  className="w-14 px-1.5 py-1 rounded bg-navy-800 border border-navy-600 text-white font-mono text-center"
                />
                <span className="text-slate-400 text-[11px]">s</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-navy-700 bg-navy-900/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-navy-800 hover:bg-navy-700 text-slate-300 border border-navy-600 font-medium text-xs transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => handleSaveAndApply(false)}
            className="px-4 py-2 rounded-lg bg-navy-700 hover:bg-navy-600 text-white font-medium text-xs transition-all border border-navy-500 cursor-pointer"
          >
            Apply Configuration
          </button>
          <button
            type="button"
            onClick={() => handleSaveAndApply(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Apply & Start Simulation
          </button>
        </div>
      </div>
    </div>
  );
};
