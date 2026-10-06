import React from 'react';
import { Zap, Truck, Archive, ArrowRightLeft, Battery } from 'lucide-react';

export const WarehouseView = ({ resources, robots, onRobotClick }) => {
  const width = 800;
  const height = 520;

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFLICT':
        return 'stroke-red-500 fill-red-950/40 animate-pulse';
      case 'FULL':
        return 'stroke-amber-500 fill-amber-950/30';
      case 'OCCUPIED':
        return 'stroke-blue-500 fill-blue-950/30';
      case 'FREE':
      default:
        return 'stroke-emerald-600/60 fill-emerald-950/20';
    }
  };

  const getRobotStateBadge = (state) => {
    switch (state) {
      case 'RUNNING':
        return { text: 'RUNNING', bg: 'bg-emerald-600', border: 'border-emerald-400' };
      case 'WAITING':
        return { text: 'WAITING', bg: 'bg-amber-600', border: 'border-amber-400' };
      case 'BLOCKED':
        return { text: 'BLOCKED', bg: 'bg-red-600', border: 'border-red-400' };
      case 'COMPLETED':
        return { text: 'DONE', bg: 'bg-cyan-600', border: 'border-cyan-400' };
      default:
        return { text: 'READY', bg: 'bg-blue-600', border: 'border-blue-400' };
    }
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl flex flex-col h-full">
      <div className="flex items-center justify-between pb-3 border-b border-navy-700">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>2D Warehouse Floor Layout</span>
            <span className="text-[11px] px-2 py-0.5 rounded bg-navy-900 border border-navy-700 text-slate-300 font-mono">
              Live Coordinate Mapping
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Physical layout representing shared OS resources and concurrent process execution paths
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/30 border border-emerald-500"></span>
            <span>Free Slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/30 border border-blue-500"></span>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/30 border border-amber-500"></span>
            <span>Capacity Full</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/50 border border-red-500 animate-pulse"></span>
            <span>Race / Conflict</span>
          </div>
        </div>
      </div>

      <div className="relative flex-1 w-full mt-3 overflow-hidden rounded-lg bg-navy-900 border border-navy-700">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          style={{ minHeight: '440px' }}
        >
          {/* Subtle Grid Lines */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162544" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Central Lane / Walkway Markings */}
          <line x1="160" y1="250" x2="620" y2="250" stroke="#1E293B" strokeWidth="3" strokeDasharray="6 6" />
          <line x1="340" y1="50" x2="340" y2="420" stroke="#1E293B" strokeWidth="3" strokeDasharray="6 6" />

          {/* Staging & Idle Staging Bay (Top Area) */}
          <rect
            x="200"
            y="25"
            width="400"
            height="110"
            rx="6"
            fill="#0F172A"
            stroke="#1E293B"
            strokeDasharray="4 4"
            strokeWidth="1.5"
          />
          <text x="210" y="42" fill="#64748B" fontSize="10" fontWeight="bold">
            IDLE / READY STAGING BAY (Process Pool)
          </text>

          {/* Render Warehouse Resources */}
          {resources.map((res) => {
            const { x, y, width: resW, height: resH } = res.position;
            const statusClass = getStatusColor(res.status);
            const isConflict = res.status === 'CONFLICT';

            return (
              <g key={res.id} className="transition-all duration-300">
                {/* Resource Boundary Box */}
                <rect
                  x={x}
                  y={y}
                  width={resW}
                  height={resH}
                  rx="6"
                  className={`${statusClass} stroke-[1.5] transition-all`}
                />

                {/* Resource Header */}
                <rect
                  x={x}
                  y={y}
                  width={resW}
                  height="22"
                  rx="6"
                  fill="#0B132B"
                  fillOpacity="0.8"
                />
                <text
                  x={x + 8}
                  y={y + 15}
                  fill="#E2E8F0"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {res.id} • {res.name}
                </text>

                {/* Capacity & Usage Info */}
                <text x={x + 8} y={y + 36} fill="#94A3B8" fontSize="9">
                  Cap: {res.capacity} | Slots: {res.available_slots} | Active: {res.active_users?.length || 0}
                </text>

                {/* Conflict Badge */}
                {isConflict && (
                  <g>
                    <rect
                      x={x + resW - 65}
                      y={y + 4}
                      width="60"
                      height="14"
                      rx="3"
                      fill="#DC2626"
                    />
                    <text
                      x={x + resW - 35}
                      y={y + 14}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8"
                      fontWeight="bold"
                    >
                      CONFLICT!
                    </text>
                  </g>
                )}

                {/* Active Holders Pills */}
                {res.active_users?.length > 0 && (
                  <g>
                    <text x={x + 8} y={y + 50} fill="#60A5FA" fontSize="8" fontWeight="bold">
                      Holders: {res.active_users.join(', ')}
                    </text>
                  </g>
                )}

                {/* Waiting Queue Pills */}
                {res.waiting_queue?.length > 0 && (
                  <g>
                    <text x={x + 8} y={y + 62} fill="#F59E0B" fontSize="8">
                      Wait Q: {res.waiting_queue.join(', ')}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Render Mobile Robots (Concurrent Process Execution Units) */}
          {robots.map((robot) => {
            const badge = getRobotStateBadge(robot.state);
            const isConflict = robot.conflict_detected || robot.state === 'BLOCKED';

            return (
              <g
                key={robot.id}
                transform={`translate(${robot.position?.x || 50}, ${robot.position?.y || 50})`}
                className="cursor-pointer transition-transform duration-100 ease-out"
                onClick={() => onRobotClick && onRobotClick(robot)}
              >
                {/* Robot Halo / Shadow */}
                <circle
                  cx="0"
                  cy="0"
                  r={isConflict ? '20' : '17'}
                  fill={isConflict ? '#EF4444' : robot.color}
                  fillOpacity={isConflict ? '0.35' : '0.15'}
                  className={isConflict ? 'animate-ping' : ''}
                />

                {/* Robot Main Body */}
                <rect
                  x="-15"
                  y="-15"
                  width="30"
                  height="30"
                  rx="6"
                  fill="#0B132B"
                  stroke={isConflict ? '#EF4444' : robot.color}
                  strokeWidth="2"
                  className="shadow-lg"
                />

                {/* Robot ID */}
                <text
                  x="0"
                  y="-1"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {robot.id}
                </text>

                {/* Priority Label */}
                <text
                  x="0"
                  y="9"
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="7"
                  fontWeight="bold"
                >
                  P{robot.priority}
                </text>

                {/* State Tag Above */}
                <rect
                  x="-18"
                  y="-26"
                  width="36"
                  height="9"
                  rx="2"
                  className={badge.bg}
                />
                <text
                  x="0"
                  y="-19"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="6.5"
                  fontWeight="bold"
                >
                  {badge.text}
                </text>

                {/* Task Label Below */}
                {robot.task_type && (
                  <text
                    x="0"
                    y="22"
                    textAnchor="middle"
                    fill="#CBD5E1"
                    fontSize="7"
                    fontWeight="500"
                  >
                    {robot.task_type.length > 12 ? robot.task_type.slice(0, 10) + '..' : robot.task_type}
                  </text>
                )}

                {/* Progress Ring if in Critical Section */}
                {robot.in_critical_section && (
                  <circle
                    cx="0"
                    cy="0"
                    r="16"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2"
                    strokeDasharray="100"
                    strokeDashoffset={100 - (robot.task_progress || 0)}
                    transform="rotate(-90)"
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
