import React from 'react';
import { Users, Play, Clock, AlertTriangle, CheckCircle, Boxes, Flame, Lock } from 'lucide-react';

export const SummaryCards = ({ state }) => {
  const robots = state.robots || [];
  const resources = state.resources || [];
  const metrics = state.metrics || {};

  const totalRobots = robots.length;
  const runningRobots = robots.filter((r) => r.state === 'RUNNING').length;
  const waitingRobots = robots.filter((r) => r.state === 'WAITING').length;
  const blockedRobots = robots.filter((r) => r.state === 'BLOCKED').length;
  const completedTasks = metrics.completed_tasks || 0;
  const activeResourcesCount = resources.filter((r) => r.active_users?.length > 0).length;
  const conflictsCount = metrics.resource_conflicts || 0;
  const deadlocksCount = state.deadlocks?.length || metrics.deadlocks_detected || 0;

  const cards = [
    {
      label: 'TOTAL ROBOTS',
      value: totalRobots,
      sub: `${state.config.technique}`,
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/40',
      borderColor: 'border-blue-800/40',
    },
    {
      label: 'RUNNING',
      value: runningRobots,
      sub: 'In Critical Section',
      icon: Play,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-950/40',
      borderColor: 'border-emerald-800/40',
    },
    {
      label: 'WAITING',
      value: waitingRobots,
      sub: 'Queued for Resource',
      icon: Clock,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/40',
      borderColor: 'border-amber-800/40',
    },
    {
      label: 'BLOCKED',
      value: blockedRobots,
      sub: 'Deadlocked/Halted',
      icon: AlertTriangle,
      color: blockedRobots > 0 ? 'text-red-400' : 'text-slate-400',
      bgColor: blockedRobots > 0 ? 'bg-red-950/50' : 'bg-navy-900',
      borderColor: blockedRobots > 0 ? 'border-red-600' : 'border-navy-700',
    },
    {
      label: 'COMPLETED',
      value: completedTasks,
      sub: `${metrics.throughput || 0} tasks/min`,
      icon: CheckCircle,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/40',
      borderColor: 'border-cyan-800/40',
    },
    {
      label: 'ACTIVE RES.',
      value: `${activeResourcesCount}/${resources.length}`,
      sub: `${metrics.resource_utilization || 0}% Utilized`,
      icon: Boxes,
      color: 'text-indigo-400',
      bgColor: 'bg-indigo-950/40',
      borderColor: 'border-indigo-800/40',
    },
    {
      label: 'CONFLICTS / RACES',
      value: conflictsCount,
      sub: state.config.technique === 'No Synchronization' ? 'UNSAFE ACCESS' : 'MUTEX PROTECTED',
      icon: Flame,
      color: conflictsCount > 0 ? 'text-rose-400 font-bold' : 'text-slate-400',
      bgColor: conflictsCount > 0 ? 'bg-rose-950/50' : 'bg-navy-900',
      borderColor: conflictsCount > 0 ? 'border-rose-600 animate-pulse' : 'border-navy-700',
    },
    {
      label: 'DEADLOCKS',
      value: deadlocksCount,
      sub: deadlocksCount > 0 ? 'CYCLE DETECTED' : 'NO CYCLES',
      icon: Lock,
      color: deadlocksCount > 0 ? 'text-red-400 font-bold' : 'text-slate-400',
      bgColor: deadlocksCount > 0 ? 'bg-red-950/60' : 'bg-navy-900',
      borderColor: deadlocksCount > 0 ? 'border-red-500 animate-pulse' : 'border-navy-700',
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3 rounded-lg border transition-all ${card.bgColor} ${card.borderColor}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold tracking-wider text-slate-400">
                {card.label}
              </span>
              <Icon className={`w-3.5 h-3.5 ${card.color}`} />
            </div>
            <div className={`text-xl font-bold mt-1 tracking-tight ${card.color}`}>
              {card.value}
            </div>
            <div className="text-[10px] text-slate-400 truncate mt-0.5">
              {card.sub}
            </div>
          </div>
        );
      })}
    </div>
  );
};
