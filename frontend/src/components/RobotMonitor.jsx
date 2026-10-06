import React, { useState } from 'react';
import { Battery, Clock, Activity, ShieldAlert, Zap } from 'lucide-react';

export const RobotMonitor = ({ robots = [] }) => {
  const [viewMode, setViewMode] = useState('table');

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 5:
        return { label: 'EMERGENCY', color: 'text-red-400 bg-red-950/60 border-red-800' };
      case 4:
        return { label: 'HIGH', color: 'text-amber-400 bg-amber-950/60 border-amber-800' };
      case 3:
        return { label: 'NORMAL', color: 'text-blue-400 bg-blue-950/60 border-blue-800' };
      case 1:
      default:
        return { label: 'LOW', color: 'text-slate-400 bg-slate-900 border-slate-700' };
    }
  };

  const getStateStyle = (state) => {
    switch (state) {
      case 'RUNNING':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      case 'WAITING':
        return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'BLOCKED':
        return 'text-red-400 bg-red-950/60 border-red-800 animate-pulse';
      case 'COMPLETED':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
      default:
        return 'text-blue-400 bg-blue-950/60 border-blue-800';
    }
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-navy-700">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Process / Robot Execution Monitor</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
              {robots.length} Threads Active
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time status of concurrent virtual worker execution threads
          </p>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center bg-navy-900 border border-navy-700 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setViewMode('table')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'table' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Table View
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
              viewMode === 'cards' ? 'bg-blue-600 text-white font-medium' : 'text-slate-400 hover:text-white'
            }`}
          >
            Cards View
          </button>
        </div>
      </div>

      {/* Table Mode */}
      {viewMode === 'table' ? (
        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400 text-[11px] uppercase tracking-wider bg-navy-900/60">
                <th className="py-2.5 px-3">Robot / Thread</th>
                <th className="py-2.5 px-3">Current Task</th>
                <th className="py-2.5 px-3">OS State</th>
                <th className="py-2.5 px-3">Priority</th>
                <th className="py-2.5 px-3">Resource Slot</th>
                <th className="py-2.5 px-3">Progress</th>
                <th className="py-2.5 px-3">Battery</th>
                <th className="py-2.5 px-3">Wait Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/60">
              {robots.map((robot) => {
                const prio = getPriorityLabel(robot.priority);
                const stateStyle = getStateStyle(robot.state);

                return (
                  <tr
                    key={robot.id}
                    className="hover:bg-navy-700/40 transition-colors"
                  >
                    <td className="py-2 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: robot.color }}
                      ></span>
                      {robot.id}
                      {robot.conflict_detected && (
                        <span className="text-[10px] px-1 rounded bg-red-600 text-white font-sans animate-pulse">
                          RACE!
                        </span>
                      )}
                    </td>

                    <td className="py-2 px-3 text-slate-200">
                      {robot.task_type || 'Idle / Waiting Task'}
                    </td>

                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateStyle}`}>
                        {robot.state}
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${prio.color}`}>
                          {prio.label} ({robot.priority})
                        </span>
                        {robot.aging_level > 0 && (
                          <span className="text-[10px] px-1 py-0.5 rounded bg-purple-900/70 text-purple-300 border border-purple-700">
                            +{robot.aging_level} Aged
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-300">
                      {robot.resource_id ? (
                        <span className="text-emerald-400 font-bold">
                          {robot.resource_id} (Holding)
                        </span>
                      ) : robot.waiting_for_resource ? (
                        <span className="text-amber-400">
                          {robot.waiting_for_resource} (Queued)
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>

                    <td className="py-2 px-3">
                      <div className="w-24 bg-navy-900 rounded-full h-1.5 border border-navy-700 overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full transition-all duration-300"
                          style={{ width: `${robot.task_progress || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {Math.round(robot.task_progress || 0)}%
                      </span>
                    </td>

                    <td className="py-2 px-3">
                      <div className="flex items-center gap-1.5">
                        <Battery className={`w-3.5 h-3.5 ${
                          (robot.battery || 0) < 20 ? 'text-red-400' : 'text-slate-400'
                        }`} />
                        <span className="font-mono text-slate-300">
                          {Math.round(robot.battery || 0)}%
                        </span>
                      </div>
                    </td>

                    <td className="py-2 px-3 font-mono text-slate-300">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{(robot.total_wait_time || 0).toFixed(1)}s</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Cards Mode */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
          {robots.map((robot) => {
            const prio = getPriorityLabel(robot.priority);
            const stateStyle = getStateStyle(robot.state);

            return (
              <div
                key={robot.id}
                className="p-3 bg-navy-900/80 rounded-lg border border-navy-700 hover:border-navy-500 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: robot.color }}
                    ></span>
                    <span className="font-mono font-bold text-white text-sm">
                      {robot.id}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${stateStyle}`}>
                    {robot.state}
                  </span>
                </div>

                <div className="mt-2 text-xs space-y-1 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Task:</span>
                    <span className="font-medium text-white">{robot.task_type || 'Idle'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Priority:</span>
                    <span className={`px-1.5 py-0.2 rounded text-[10px] border ${prio.color}`}>
                      {prio.label}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Resource:</span>
                    <span className="font-mono text-cyan-400">
                      {robot.resource_id || robot.waiting_for_resource || 'None'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Battery:</span>
                    <span className="font-mono">{Math.round(robot.battery || 0)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Wait Time:</span>
                    <span className="font-mono">{(robot.total_wait_time || 0).toFixed(1)}s</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-2 w-full bg-navy-950 rounded-full h-1.5 border border-navy-700 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full transition-all"
                    style={{ width: `${robot.task_progress || 0}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
