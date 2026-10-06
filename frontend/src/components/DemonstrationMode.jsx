import React, { useState } from 'react';
import { AlertTriangle, Lock, ShieldCheck, Flame, Hourglass, RefreshCw, Layers } from 'lucide-react';

export const DemonstrationMode = ({
  state,
  onTriggerRace,
  onTriggerDeadlock,
  onRecoverDeadlock,
  onTriggerStarvation,
  onLoadPreset,
  onStart,
}) => {
  const [recovering, setRecovering] = useState(false);
  const [recoveryMsg, setRecoveryMsg] = useState(null);

  const activeDeadlock = state.deadlocks && state.deadlocks.length > 0 ? state.deadlocks[0] : null;
  const activeStarvations = state.starvations || [];

  const handleRecover = async () => {
    setRecovering(true);
    setRecoveryMsg(null);
    try {
      const res = await onRecoverDeadlock();
      if (res) {
        setRecoveryMsg(res.message || 'Deadlock recovery executed successfully.');
      }
    } finally {
      setRecovering(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quick Launch Scenario Cards */}
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
        <h2 className="text-sm font-bold text-white mb-2">
          One-Click Academic OS Concept Demonstrations
        </h2>
        <p className="text-xs text-slate-300 mb-4 leading-relaxed">
          Pre-configured scenarios to easily showcase critical sections, race conditions, mutual exclusion, counting semaphores, deadlock detection/recovery, and starvation prevention during your viva presentation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* 1. Race Condition */}
          <div className="p-3 bg-navy-900/90 rounded-lg border border-red-900/60 hover:border-red-600 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-red-400 font-bold text-xs">
                <Flame className="w-4 h-4" />
                <span>1. Race Condition</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Disables synchronization. Robots enter a single-capacity corridor simultaneously, demonstrating race hazards and conflicts.
              </p>
            </div>
            <button
              onClick={() => {
                onLoadPreset('race_condition');
                setTimeout(onStart, 300);
              }}
              className="mt-3 w-full py-1.5 rounded bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-xs cursor-pointer transition-colors"
            >
              DEMO: RACE CONDITION
            </button>
          </div>

          {/* 2. Mutex */}
          <div className="p-3 bg-navy-900/90 rounded-lg border border-blue-900/60 hover:border-blue-600 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-blue-400 font-bold text-xs">
                <Lock className="w-4 h-4" />
                <span>2. Mutex / Lock</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Applies threading.Lock to the same workload. Enforces strict mutual exclusion: one robot enters, others serialize safely in line.
              </p>
            </div>
            <button
              onClick={() => {
                onLoadPreset('mutex_demo');
                setTimeout(onStart, 300);
              }}
              className="mt-3 w-full py-1.5 rounded bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold text-xs cursor-pointer transition-colors"
            >
              DEMO: MUTEX
            </button>
          </div>

          {/* 3. Semaphore */}
          <div className="p-3 bg-navy-900/90 rounded-lg border border-emerald-900/60 hover:border-emerald-600 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>3. Semaphore</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Counting Semaphore (capacity = 2). Exactly 2 robots enter concurrently; the 3rd robot waits until a permit is released.
              </p>
            </div>
            <button
              onClick={() => {
                onLoadPreset('semaphore_demo');
                setTimeout(onStart, 300);
              }}
              className="mt-3 w-full py-1.5 rounded bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 font-bold text-xs cursor-pointer transition-colors"
            >
              DEMO: SEMAPHORE
            </button>
          </div>

          {/* 4. Deadlock */}
          <div className="p-3 bg-navy-900/90 rounded-lg border border-rose-900/60 hover:border-rose-600 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-rose-400 font-bold text-xs">
                <AlertTriangle className="w-4 h-4" />
                <span>4. Deadlock</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                Creates classic Circular Wait: R01 holds Corridor & waits for Bay; R02 holds Bay & waits for Corridor. Detects cycle in WFG.
              </p>
            </div>
            <button
              onClick={() => {
                onTriggerDeadlock();
              }}
              className="mt-3 w-full py-1.5 rounded bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-300 font-bold text-xs cursor-pointer transition-colors"
            >
              TRIGGER DEADLOCK
            </button>
          </div>

          {/* 5. Starvation */}
          <div className="p-3 bg-navy-900/90 rounded-lg border border-amber-900/60 hover:border-amber-600 transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <Hourglass className="w-4 h-4" />
                <span>5. Starvation & Aging</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                A low-priority robot is held in queue while high priorities monopolize. Demonstrates Priority Aging elevating it to Emergency.
              </p>
            </div>
            <button
              onClick={() => {
                onTriggerStarvation();
              }}
              className="mt-3 w-full py-1.5 rounded bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 font-bold text-xs cursor-pointer transition-colors"
            >
              TRIGGER STARVATION
            </button>
          </div>
        </div>
      </div>

      {/* Deadlock Detection & Recovery Center */}
      <div className={`p-4 rounded-xl border transition-all ${
        activeDeadlock ? 'bg-red-950/40 border-red-600 shadow-2xl' : 'bg-navy-800 border-navy-600'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-700 gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className={`w-5 h-5 ${activeDeadlock ? 'text-red-400 animate-bounce' : 'text-slate-400'}`} />
            <div>
              <h3 className="text-sm font-bold text-white">
                Resource Allocation Graph (RAG) & Deadlock Center
              </h3>
              <p className="text-xs text-slate-400">
                Cycle detection over process-resource wait-for graphs and preemption recovery
              </p>
            </div>
          </div>

          {activeDeadlock && (
            <button
              onClick={handleRecover}
              disabled={recovering}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg cursor-pointer transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${recovering ? 'animate-spin' : ''}`} />
              <span>RECOVER DEADLOCK (PREEMPT VICTIM)</span>
            </button>
          )}
        </div>

        {activeDeadlock ? (
          <div className="mt-4 p-4 rounded-lg bg-red-950/60 border border-red-700 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-300 tracking-wider">
                CIRCULAR WAIT DETECTED!
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Detected at t={activeDeadlock.detected_at ? activeDeadlock.detected_at.toFixed(1) : '0.0'}s
              </span>
            </div>

            {/* Cycle Diagram */}
            <div className="p-3 bg-navy-950 rounded border border-navy-800 font-mono text-xs text-center text-red-400">
              <span className="text-white font-bold">{activeDeadlock.cycle_description}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-300">
              <div className="p-2.5 rounded bg-navy-900 border border-navy-700">
                <span className="text-slate-400 text-[10px] block font-bold">DEADLOCKED PROCESSES:</span>
                <span className="font-mono text-red-400 font-bold">{activeDeadlock.robots.join(', ')}</span>
              </div>
              <div className="p-2.5 rounded bg-navy-900 border border-navy-700">
                <span className="text-slate-400 text-[10px] block font-bold">CONTESTED RESOURCES:</span>
                <span className="font-mono text-cyan-400 font-bold">{activeDeadlock.resources.join(', ')}</span>
              </div>
            </div>

            {recoveryMsg && (
              <div className="p-2.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300 text-xs">
                {recoveryMsg}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-4 p-4 rounded-lg bg-navy-900/60 border border-navy-700 text-center text-xs text-slate-400">
            No circular wait detected. System state is currently deadlock-free.
            <div className="mt-2 text-slate-500 text-[11px]">
              Click <strong className="text-rose-400">"TRIGGER DEADLOCK"</strong> above to simulate a 2-process circular wait.
            </div>
          </div>
        )}
      </div>

      {/* Starvation Alerts Section */}
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <div className="flex items-center gap-2">
            <Hourglass className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="text-sm font-bold text-white">
                Starvation Monitor & Priority Aging Tracker
              </h3>
              <p className="text-xs text-slate-400">
                Detects prolonged wait times and dynamically elevates process priority to guarantee resource access
              </p>
            </div>
          </div>
        </div>

        {activeStarvations.length > 0 ? (
          <div className="mt-3 space-y-2">
            {activeStarvations.map((alert) => (
              <div
                key={alert.robot_id}
                className="p-3 bg-amber-950/40 rounded-lg border border-amber-700 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-mono font-bold text-amber-300">{alert.robot_id}</span>
                  <span className="text-slate-300 ml-2">
                    Waiting on <span className="font-mono text-cyan-300">{alert.resource_id}</span> for{' '}
                    <span className="font-mono font-bold text-amber-400">{alert.waiting_time.toFixed(1)}s</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-purple-900/80 border border-purple-600 text-purple-300 font-bold text-[10px]">
                    Aging Level +{alert.aging_level}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-amber-900/80 border border-amber-600 text-amber-300 font-bold text-[10px]">
                    Priority {alert.current_priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-3 p-3 rounded-lg bg-navy-900/60 border border-navy-700 text-center text-xs text-slate-400">
            No processes currently experiencing starvation risk.
          </div>
        )}
      </div>
    </div>
  );
};
