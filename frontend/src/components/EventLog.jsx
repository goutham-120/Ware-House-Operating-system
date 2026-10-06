import React, { useState } from 'react';
import { Search, Terminal, AlertTriangle, ShieldAlert, CheckCircle, Clock } from 'lucide-react';

export const EventLog = ({ events = [] }) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterRobot, setFilterRobot] = useState('ALL');

  const eventTypes = [
    'ALL',
    'RESOURCE_REQUEST',
    'RESOURCE_ACQUIRED',
    'RESOURCE_RELEASED',
    'RACE_CONDITION',
    'DEADLOCK_DETECTED',
    'DEADLOCK_RECOVERED',
    'STARVATION_WARNING',
    'PRIORITY_AGING',
    'TASK_COMPLETED',
    'SYSTEM_INFO',
  ];

  const uniqueRobots = Array.from(
    new Set(events.map((e) => e.robot_id).filter(Boolean))
  );

  const filteredEvents = events.filter((e) => {
    if (filterType !== 'ALL' && e.event_type !== filterType) return false;
    if (filterRobot !== 'ALL' && e.robot_id !== filterRobot) return false;
    if (search.trim() !== '') {
      const q = search.toLowerCase();
      const matchMsg = e.message?.toLowerCase().includes(q);
      const matchRob = e.robot_id?.toLowerCase().includes(q);
      const matchRes = e.resource_id?.toLowerCase().includes(q);
      return matchMsg || matchRob || matchRes;
    }
    return true;
  });

  const getEventBadge = (type) => {
    switch (type) {
      case 'RACE_CONDITION':
        return 'bg-red-950/80 text-red-400 border-red-700 font-bold animate-pulse';
      case 'DEADLOCK_DETECTED':
        return 'bg-rose-950/80 text-rose-300 border-rose-600 font-bold';
      case 'DEADLOCK_RECOVERED':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-600 font-bold';
      case 'STARVATION_WARNING':
        return 'bg-amber-950/80 text-amber-400 border-amber-700';
      case 'PRIORITY_AGING':
        return 'bg-purple-950/80 text-purple-300 border-purple-700 font-bold';
      case 'RESOURCE_ACQUIRED':
        return 'bg-emerald-950/60 text-emerald-400 border-emerald-800';
      case 'RESOURCE_REQUEST':
        return 'bg-blue-950/60 text-blue-400 border-blue-800';
      case 'RESOURCE_RELEASED':
        return 'bg-slate-900 text-slate-400 border-slate-700';
      case 'TASK_COMPLETED':
        return 'bg-cyan-950/60 text-cyan-400 border-cyan-800';
      default:
        return 'bg-navy-900 text-slate-300 border-navy-700';
    }
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl flex flex-col h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-3 border-b border-navy-700 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="w-5 h-5 text-blue-400" />
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Real-Time OS Event Log</span>
              <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
                {events.length} Events Logged
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Synchronous trace of process requests, lock acquisitions, releases, and conflicts
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
            <input
              type="text"
              placeholder="Filter log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1 rounded-lg bg-navy-900 border border-navy-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-blue-500 w-36 sm:w-44"
            />
          </div>

          {/* Event Type Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-2 py-1 rounded-lg bg-navy-900 border border-navy-700 text-slate-200 text-xs focus:outline-none"
          >
            {eventTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'ALL' ? 'All Event Types' : t}
              </option>
            ))}
          </select>

          {/* Robot Filter */}
          <select
            value={filterRobot}
            onChange={(e) => setFilterRobot(e.target.value)}
            className="px-2 py-1 rounded-lg bg-navy-900 border border-navy-700 text-slate-200 text-xs focus:outline-none"
          >
            <option value="ALL">All Robots</option>
            {uniqueRobots.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Log Feed */}
      <div className="flex-1 mt-3 overflow-y-auto space-y-1.5 font-mono text-[11px] max-h-[500px] pr-1">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            No events match the selected filter.
          </div>
        ) : (
          [...filteredEvents].reverse().map((evt) => (
            <div
              key={evt.id}
              className={`p-2 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 transition-colors ${
                evt.event_type === 'RACE_CONDITION'
                  ? 'bg-red-950/40 border-red-800/80 hover:bg-red-950/60'
                  : evt.event_type === 'DEADLOCK_DETECTED'
                  ? 'bg-rose-950/50 border-rose-700 hover:bg-rose-950/70'
                  : evt.event_type === 'DEADLOCK_RECOVERED'
                  ? 'bg-emerald-950/40 border-emerald-700 hover:bg-emerald-950/60'
                  : evt.event_type === 'PRIORITY_AGING'
                  ? 'bg-purple-950/40 border-purple-800'
                  : 'bg-navy-900/60 border-navy-700 hover:bg-navy-900'
              }`}
            >
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-slate-500 text-[10px]">
                  [{evt.timestamp}]
                </span>

                <span
                  className={`px-1.5 py-0.2 rounded text-[9.5px] border ${getEventBadge(
                    evt.event_type
                  )}`}
                >
                  {evt.event_type}
                </span>

                {evt.robot_id && (
                  <span className="px-1.5 py-0.2 rounded bg-blue-900/40 border border-blue-700 text-blue-300 font-bold text-[10px]">
                    {evt.robot_id}
                  </span>
                )}

                {evt.resource_id && (
                  <span className="px-1.5 py-0.2 rounded bg-purple-900/40 border border-purple-700 text-purple-300 font-bold text-[10px]">
                    {evt.resource_id}
                  </span>
                )}

                <span className="text-slate-200 font-sans text-xs">
                  {evt.message}
                </span>
              </div>

              <div className="text-[10px] text-slate-500 whitespace-nowrap">
                t={evt.sim_time ? evt.sim_time.toFixed(1) : '0.0'}s
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
