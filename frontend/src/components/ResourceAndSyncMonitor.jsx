import React from 'react';
import { Lock, ShieldCheck, AlertTriangle, Zap, Truck, ArrowRightLeft, Archive } from 'lucide-react';

export const ResourceAndSyncMonitor = ({ resources = [], syncDetails = {}, technique = 'Mutex / Lock' }) => {
  const getResourceIcon = (type) => {
    switch (type) {
      case 'Charging Station':
        return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
      case 'Loading Bay':
        return <Truck className="w-3.5 h-3.5 text-blue-400" />;
      case 'Narrow Corridor':
        return <ArrowRightLeft className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Archive className="w-3.5 h-3.5 text-pink-400" />;
    }
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl space-y-4">
      {/* Synchronization Mode Banner */}
      <div className={`p-3 rounded-lg border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs ${
        technique === 'No Synchronization'
          ? 'bg-red-950/40 border-red-700 text-red-300'
          : 'bg-blue-950/40 border-blue-700 text-cyan-300'
      }`}>
        <div className="flex items-center gap-2">
          {technique === 'No Synchronization' ? (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <div>
            <span className="font-bold">Active Technique: {technique}</span>
            <span className="text-slate-400 ml-2 hidden sm:inline">
              {technique === 'No Synchronization'
                ? 'Unguarded Critical Sections (Races Allowed)'
                : technique === 'Mutex / Lock'
                ? 'Strict Mutual Exclusion (threading.Lock)'
                : technique === 'Semaphore'
                ? 'Counting Permits (threading.Semaphore)'
                : 'Hybrid Multi-Slot & State Locking'}
            </span>
          </div>
        </div>
      </div>

      {/* Resources Table with Live Primitive State */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-navy-700 text-slate-400 text-[11px] uppercase tracking-wider bg-navy-900/60">
              <th className="py-2 px-3">Resource</th>
              <th className="py-2 px-3">Capacity</th>
              <th className="py-2 px-3">Used / Free</th>
              <th className="py-2 px-3">Primitive State</th>
              <th className="py-2 px-3">Current Holder(s)</th>
              <th className="py-2 px-3">Waiting Queue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-navy-700/60">
            {resources.map((res) => {
              const detail = syncDetails[res.id] || {
                active_holders: res.active_users || [],
                waiters: res.waiting_queue || [],
                capacity: res.capacity,
              };
              const isConflict = res.status === 'CONFLICT' || detail.active_holders.length > res.capacity;

              return (
                <tr key={res.id} className={`hover:bg-navy-700/40 transition-colors ${isConflict ? 'bg-red-950/30' : ''}`}>
                  <td className="py-2.5 px-3 font-mono font-bold text-white flex items-center gap-1.5">
                    {getResourceIcon(res.type)}
                    <span>{res.id}</span>
                  </td>

                  <td className="py-2.5 px-3 font-mono text-slate-300">
                    {res.capacity} slots
                  </td>

                  <td className="py-2.5 px-3 font-mono font-bold">
                    <span className={detail.active_holders.length > 0 ? 'text-amber-400' : 'text-slate-400'}>
                      {detail.active_holders.length}
                    </span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-emerald-400">{Math.max(0, res.capacity - detail.active_holders.length)}</span>
                  </td>

                  <td className="py-2.5 px-3">
                    {technique === 'No Synchronization' ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        isConflict ? 'bg-red-950 border-red-700 text-red-400 animate-pulse' : 'bg-navy-900 border-navy-700 text-slate-400'
                      }`}>
                        {isConflict ? 'RACE CONFLICT' : 'UNGUARDED'}
                      </span>
                    ) : technique === 'Mutex / Lock' ? (
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                        detail.active_holders.length > 0
                          ? 'bg-amber-950/60 border-amber-700 text-amber-300'
                          : 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                      }`}>
                        {detail.active_holders.length > 0 ? 'LOCKED' : 'UNLOCKED'}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {Array.from({ length: res.capacity }).map((_, i) => (
                          <span
                            key={i}
                            className={`w-3.5 h-3.5 rounded text-[8px] font-mono flex items-center justify-center font-bold ${
                              i < detail.active_holders.length
                                ? 'bg-amber-500 text-black'
                                : 'bg-emerald-600 text-white'
                            }`}
                          >
                            {i < detail.active_holders.length ? 'H' : 'F'}
                          </span>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    {detail.active_holders.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {detail.active_holders.map((uid) => (
                          <span key={uid} className="px-1.5 py-0.2 rounded bg-blue-900/60 border border-blue-600 text-blue-200 text-[10px]">
                            {uid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">—</span>
                    )}
                  </td>

                  <td className="py-2.5 px-3 font-mono">
                    {detail.waiters.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {detail.waiters.map((wid, idx) => (
                          <span key={wid} className="px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-600 text-amber-300 text-[10px]">
                            #{idx + 1} {wid}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Empty</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
