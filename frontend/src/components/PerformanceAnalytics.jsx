import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { Activity, Clock, Zap, Flame, BarChart3, TrendingUp } from 'lucide-react';

export const PerformanceAnalytics = ({ state }) => {
  const metrics = state.metrics || {};
  const history = state.history || [];
  const robots = state.robots || [];

  const robotWaitData = robots.map((r) => ({
    id: r.id,
    wait_time: Number((r.total_wait_time || 0).toFixed(1)),
    exec_time: Number((r.total_execution_time || 0).toFixed(1)),
    priority: r.priority,
  }));

  return (
    <div className="space-y-4">
      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="p-3 bg-navy-800 rounded-xl border border-navy-600">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Throughput</span>
            <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-1">
            {metrics.throughput || 0} <span className="text-xs font-normal text-slate-400">tasks/min</span>
          </div>
        </div>

        <div className="p-3 bg-navy-800 rounded-xl border border-navy-600">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Avg Waiting Time</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-1">
            {(metrics.average_waiting_time || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">s</span>
          </div>
        </div>

        <div className="p-3 bg-navy-800 rounded-xl border border-navy-600">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Avg Exec Time</span>
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {(metrics.average_completion_time || 0).toFixed(2)} <span className="text-xs font-normal text-slate-400">s</span>
          </div>
        </div>

        <div className="p-3 bg-navy-800 rounded-xl border border-navy-600">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Resource Utilization</span>
            <Zap className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {metrics.resource_utilization || 0}%
          </div>
        </div>

        <div className="p-3 bg-navy-800 rounded-xl border border-navy-600">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Conflicts / Races</span>
            <Flame className="w-3.5 h-3.5 text-rose-400" />
          </div>
          <div className="text-xl font-bold text-rose-400 mt-1">
            {metrics.resource_conflicts || 0}
          </div>
        </div>

        <div className="p-3 bg-navy-800 rounded-xl border border-navy-600">
          <div className="flex items-center justify-between text-slate-400 text-[11px]">
            <span>Completed Tasks</span>
            <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-1">
            {metrics.completed_tasks || 0}
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* 1. Resource Utilization Over Time */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-navy-700">
            <h3 className="text-xs font-bold text-white">
              1. Resource Utilization Rate Over Time (%)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Live Timeseries
            </span>
          </div>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="utilGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="utilization"
                  name="Utilization %"
                  stroke="#3B82F6"
                  fill="url(#utilGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Process State Concurrency */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-navy-700">
            <h3 className="text-xs font-bold text-white">
              2. Concurrency Breakdown: Running vs Waiting vs Blocked
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Thread States
            </span>
          </div>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Line
                  type="monotone"
                  dataKey="running"
                  name="Running"
                  stroke="#10B981"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="waiting"
                  name="Waiting"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="blocked"
                  name="Blocked"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 3. Cumulative Conflicts Over Time */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-navy-700">
            <h3 className="text-xs font-bold text-white">
              3. Race Conditions & Resource Conflicts Over Time
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Hazard Frequency
            </span>
          </div>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="conflictGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="time" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', fontSize: '11px' }}
                />
                <Area
                  type="monotone"
                  dataKey="conflicts"
                  name="Cumulative Conflicts"
                  stroke="#EF4444"
                  fill="url(#conflictGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Robot Wait Time vs Execution Time by Process */}
        <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl">
          <div className="flex items-center justify-between pb-2 border-b border-navy-700">
            <h3 className="text-xs font-bold text-white">
              4. Per-Process Waiting Time vs Execution Time (s)
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Starvation Variance
            </span>
          </div>
          <div className="h-56 mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={robotWaitData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                <XAxis dataKey="id" stroke="#64748B" fontSize={10} />
                <YAxis stroke="#64748B" fontSize={10} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0B132B', borderColor: '#334155', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '10px' }} />
                <Bar dataKey="wait_time" name="Wait Time (s)" fill="#F59E0B" />
                <Bar dataKey="exec_time" name="Exec Time (s)" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
