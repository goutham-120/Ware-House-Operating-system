import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Play, Scale, Cpu } from 'lucide-react';

export const TechniqueComparison = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [robotCount, setRobotCount] = useState(5);
  const [iterations, setIterations] = useState(4);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      const data = await api.fetchComparisonResults();
      if (data) setResults(data);
    } catch (e) {
      console.error('Error loading comparison results:', e);
    }
  };

  const handleRunSuite = async () => {
    setLoading(true);
    try {
      const res = await api.runComparisonSuite(robotCount, iterations);
      if (res && res.results) {
        setResults(res.results);
      }
    } catch (e) {
      console.error('Error running comparison suite:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* Header and Benchmark Trigger */}
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Scale className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-white">
                Process Synchronization Technique Comparison Suite
              </h2>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Academic evaluation: Runs an <span className="text-white font-semibold">IDENTICAL WORKLOAD</span> across all 4 synchronization paradigms under identical thread counts and shared bottleneck resources. Demonstrates empirically why OS synchronization is essential.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-xs bg-navy-900 border border-navy-700 rounded-lg px-3 py-1.5">
              <span className="text-slate-400">Robots:</span>
              <select
                value={robotCount}
                onChange={(e) => setRobotCount(Number(e.target.value))}
                className="bg-transparent text-white font-bold focus:outline-none"
              >
                <option value={3} className="bg-navy-900">3 Robots</option>
                <option value={5} className="bg-navy-900">5 Robots</option>
                <option value={8} className="bg-navy-900">8 Robots</option>
                <option value={10} className="bg-navy-900">10 Robots</option>
              </select>
            </div>

            <button
              onClick={handleRunSuite}
              disabled={loading}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-bold text-xs text-white shadow-lg transition-all cursor-pointer ${
                loading
                  ? 'bg-blue-800 cursor-not-allowed opacity-75'
                  : 'bg-blue-600 hover:bg-blue-500 hover:shadow-blue-500/25'
              }`}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Running Benchmark Workload...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>RUN EXPERIMENT SUITE</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Results Table */}
      <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-navy-700">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <span>Empirical Performance Matrix</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300 border border-blue-700/50 font-mono">
              Identical Workload Benchmark
            </span>
          </h3>
        </div>

        <div className="overflow-x-auto mt-3">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-navy-700 text-slate-400 text-[11px] uppercase tracking-wider bg-navy-900/60">
                <th className="py-2.5 px-3">Synchronization Paradigm</th>
                <th className="py-2.5 px-3">Resource Conflicts</th>
                <th className="py-2.5 px-3">Race Conditions</th>
                <th className="py-2.5 px-3">Deadlocks</th>
                <th className="py-2.5 px-3">Avg Wait Time</th>
                <th className="py-2.5 px-3">Avg Exec Time</th>
                <th className="py-2.5 px-3">Throughput</th>
                <th className="py-2.5 px-3">Utilization</th>
                <th className="py-2.5 px-3">OS Assessment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-700/60">
              {results.map((res, idx) => {
                const isNoSync = res.technique === 'No Synchronization';

                return (
                  <tr
                    key={idx}
                    className={`hover:bg-navy-700/40 transition-colors ${
                      isNoSync ? 'bg-red-950/20' : ''
                    }`}
                  >
                    <td className="py-3 px-3 font-bold text-white font-mono flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        isNoSync ? 'bg-red-500' : 'bg-emerald-500'
                      }`}></span>
                      {res.technique}
                    </td>

                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={res.conflicts > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {res.conflicts}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono font-bold">
                      <span className={res.race_conditions > 0 ? 'text-red-400' : 'text-emerald-400'}>
                        {res.race_conditions}
                      </span>
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300">
                      {res.deadlocks || 0}
                    </td>

                    <td className="py-3 px-3 font-mono text-amber-400 font-bold">
                      {(res.average_waiting_time || 0).toFixed(3)}s
                    </td>

                    <td className="py-3 px-3 font-mono text-slate-300">
                      {(res.average_completion_time || 0).toFixed(3)}s
                    </td>

                    <td className="py-3 px-3 font-mono text-cyan-400 font-bold">
                      {res.throughput} /min
                    </td>

                    <td className="py-3 px-3 font-mono text-emerald-400 font-bold">
                      {res.resource_utilization}%
                    </td>

                    <td className="py-3 px-3 text-[11px]">
                      {isNoSync ? (
                        <span className="px-2 py-0.5 rounded bg-red-950 border border-red-700 text-red-300 font-bold">
                          Hazardous (High Conflicts)
                        </span>
                      ) : res.technique === 'Mutex / Lock' ? (
                        <span className="px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300">
                          Strict Exclusion (Zero Conflicts)
                        </span>
                      ) : res.technique === 'Semaphore' ? (
                        <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700 text-emerald-300">
                          Optimal for Multi-Slots
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-purple-950 border border-purple-700 text-purple-300">
                          Robust Hybrid Protection
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Conflicts Chart */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
          <h3 className="text-xs font-bold text-white pb-2 border-b border-navy-700">
            Conflicts & Race Conditions by Technique (Lower is Better)
          </h3>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="technique" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', fontSize: '11px' }}
                />
                <Bar dataKey="conflicts" name="Resource Conflicts" fill="#EF4444" />
                <Bar dataKey="race_conditions" name="Race Conditions" fill="#F87171" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Throughput & Utilization Chart */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
          <h3 className="text-xs font-bold text-white pb-2 border-b border-navy-700">
            Resource Utilization (%) & Throughput (Tasks/Min)
          </h3>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={results}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="technique" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="resource_utilization" name="Utilization (%)" fill="#3B82F6" />
                <Bar dataKey="throughput" name="Throughput (tasks/min)" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Academic Explanation Card */}
      <div className="bg-navy-900 border border-blue-900/50 rounded-xl p-4 text-xs text-slate-300 space-y-2">
        <div className="font-bold text-white flex items-center gap-2">
          <Cpu className="w-4 h-4 text-blue-400" />
          <span>Why Synchronization is Necessary: Academic Analysis</span>
        </div>
        <p className="leading-relaxed">
          <strong className="text-red-400">Without Synchronization:</strong> Concurrent threads enter critical sections without mutual exclusion. While throughput may appear artificially high, shared states are corrupted, simultaneous writes cause invalid allocations, and physical collisions in real-world mappings would occur.
        </p>
        <p className="leading-relaxed">
          <strong className="text-emerald-400">With Synchronization (Mutex & Semaphores):</strong> Mutexes ensure that mutually exclusive shared resources are only ever occupied by one process at a time. Counting Semaphores permit bounded concurrency up to exact hardware capacity limits. Concurrency is safe, predictable, and free of race conditions.
        </p>
      </div>
    </div>
  );
};
