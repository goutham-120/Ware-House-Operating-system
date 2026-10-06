import React from 'react';
import { Zap, Truck, Archive, ArrowRightLeft, ShieldAlert, Cpu } from 'lucide-react';

export const WarehouseView = ({ resources = [], robots = [], onRobotClick }) => {
  const width = 900;
  const height = 560;

  // Map resources by ID for rapid lookup
  const resMap = {};
  resources.forEach((r) => {
    resMap[r.id] = r;
  });

  // Calculate clean, non-overlapping visual coordinates for each robot
  const getRobotRenderPosition = (robot) => {
    // 1. If robot is RUNNING inside a resource, snap neatly to that resource's docking pad
    if (robot.state === 'RUNNING' && robot.resource_id && resMap[robot.resource_id]) {
      const res = resMap[robot.resource_id];
      const holders = res.active_users || [];
      const holderIdx = Math.max(0, holders.indexOf(robot.id));
      
      // Calculate docking pad slot offset inside the resource
      if (res.type === 'Narrow Corridor') {
        const slotX = res.position.x + 45 + holderIdx * 75;
        const slotY = res.position.y + 65;
        return { x: slotX, y: slotY };
      } else if (res.type === 'Storage Zone') {
        const slotX = res.position.x + 45 + holderIdx * 65;
        const slotY = res.position.y + 65;
        return { x: slotX, y: slotY };
      } else {
        // Single capacity bay (Loading Bay / Charger)
        return { x: res.position.x + res.position.width / 2, y: res.position.y + 60 };
      }
    }

    // 2. If robot is WAITING for a resource, line up neatly outside the resource entrance
    if (robot.state === 'WAITING' && robot.waiting_for_resource && resMap[robot.waiting_for_resource]) {
      const res = resMap[robot.waiting_for_resource];
      const waiters = res.waiting_queue || [];
      const waitIdx = Math.max(0, waiters.indexOf(robot.id));

      if (res.type === 'Loading Bay') {
        return { x: res.position.x + res.position.width + 30 + waitIdx * 35, y: res.position.y + 60 };
      } else if (res.type === 'Narrow Corridor') {
        return { x: res.position.x - 30 - waitIdx * 35, y: res.position.y + 65 };
      } else if (res.type === 'Storage Zone') {
        return { x: res.position.x - 30 - waitIdx * 35, y: res.position.y + 65 };
      } else {
        return { x: res.position.x + res.position.width / 2, y: res.position.y - 30 - waitIdx * 35 };
      }
    }

    // 3. If robot is READY / IDLE, park in designated slot in the top Staging Bay
    if (robot.state === 'READY') {
      const rNum = parseInt(robot.id.replace(/\D/g, '')) || 1;
      const slot = (rNum - 1) % 7;
      const row = Math.floor((rNum - 1) / 7);
      return { x: 215 + slot * 68, y: 64 + row * 40 };
    }

    // 4. Default fallback to interpolated simulation position
    return {
      x: robot.position?.x || 100,
      y: robot.position?.y || 100,
    };
  };

  const getPriorityBadge = (prio) => {
    switch (prio) {
      case 5:
        return { text: 'P5', bg: 'bg-red-600', color: '#EF4444' };
      case 4:
        return { text: 'P4', bg: 'bg-amber-500', color: '#F59E0B' };
      case 3:
        return { text: 'P3', bg: 'bg-blue-500', color: '#3B82F6' };
      default:
        return { text: 'P1', bg: 'bg-slate-600', color: '#64748B' };
    }
  };

  return (
    <div className="bg-navy-800 rounded-xl border border-navy-600 p-4 shadow-xl flex flex-col h-full">
      {/* Visual Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-navy-700 gap-2">
        <div>
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <span>2D Warehouse Floor Layout</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800 font-mono">
              Process & Resource Spatial Model
            </span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time visual map of OS processes executing within synchronized resource zones
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500/20 border border-emerald-500"></span>
            <span>Free Slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-blue-500/20 border border-blue-500"></span>
            <span>Occupied</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500/20 border border-amber-500"></span>
            <span>Capacity Full</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-red-500/30 border border-red-500 animate-pulse"></span>
            <span>Race / Conflict</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas Area */}
      <div className="relative flex-1 w-full mt-3 overflow-hidden rounded-lg bg-navy-900 border border-navy-700 shadow-inner">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full select-none"
          style={{ minHeight: '460px' }}
        >
          {/* Subtle Grid Backdrop */}
          <defs>
            <pattern id="warehouseGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162238" strokeWidth="0.8" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#warehouseGrid)" />

          {/* Guide Pathways / Road Markings */}
          <line x1="160" y1="260" x2="660" y2="260" stroke="#1E293B" strokeWidth="2" strokeDasharray="6 6" />
          <line x1="365" y1="120" x2="365" y2="420" stroke="#1E293B" strokeWidth="2" strokeDasharray="6 6" />

          {/* ------------------------------------------------------------- */}
          {/* 1. TOP ZONE: PROCESS POOL / READY STAGING BAY */}
          {/* ------------------------------------------------------------- */}
          <g>
            <rect
              x="160"
              y="18"
              width="550"
              height="88"
              rx="8"
              fill="#0B132B"
              stroke="#273459"
              strokeWidth="1.5"
            />
            {/* Header strip */}
            <rect
              x="160"
              y="18"
              width="550"
              height="22"
              rx="8"
              fill="#162238"
            />
            <text x="175" y="33" fill="#94A3B8" fontSize="10" fontWeight="bold" fontFamily="monospace">
              PROCESS POOL • READY WORKER BAYS
            </text>
            <text x="690" y="33" textAnchor="end" fill="#64748B" fontSize="9" fontFamily="monospace">
              {robots.filter((r) => r.state === 'READY').length} Ready
            </text>

            {/* Dotted Parking Bay Slots */}
            {Array.from({ length: 7 }).map((_, i) => (
              <g key={i}>
                <rect
                  x={185 + i * 68}
                  y={46}
                  width="58"
                  height="50"
                  rx="6"
                  fill="#070D1E"
                  stroke="#1E293B"
                  strokeDasharray="3 3"
                  strokeWidth="1.2"
                />
                <text
                  x={214 + i * 68}
                  y={58}
                  textAnchor="middle"
                  fill="#334155"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  BAY-{i + 1}
                </text>
              </g>
            ))}
          </g>

          {/* ------------------------------------------------------------- */}
          {/* 2. RENDER WAREHOUSE RESOURCE ZONES */}
          {/* ------------------------------------------------------------- */}
          {resources.map((res) => {
            const { x, y, width: resW, height: resH } = res.position;
            const isConflict = res.status === 'CONFLICT';
            const isFull = res.status === 'FULL';
            const isOccupied = res.status === 'OCCUPIED';

            const borderStroke = isConflict
              ? '#EF4444'
              : isFull
              ? '#F59E0B'
              : isOccupied
              ? '#3B82F6'
              : '#10B981';

            const bgFill = isConflict
              ? '#450A0A'
              : isFull
              ? '#1E1B4B'
              : '#0B132B';

            return (
              <g key={res.id} className="transition-all duration-300">
                {/* Main Zone Container */}
                <rect
                  x={x}
                  y={y}
                  width={resW}
                  height={resH}
                  rx="8"
                  fill={bgFill}
                  fillOpacity="0.85"
                  stroke={borderStroke}
                  strokeWidth={isConflict ? '2.5' : '1.5'}
                  className={isConflict ? 'animate-pulse' : ''}
                />

                {/* Top Header Strip */}
                <rect
                  x={x}
                  y={y}
                  width={resW}
                  height="26"
                  rx="8"
                  fill="#1C2541"
                />
                <text
                  x={x + 10}
                  y={y + 17}
                  fill="#F1F5F9"
                  fontSize="10"
                  fontWeight="bold"
                >
                  {res.id} • {res.name}
                </text>

                {/* Capacity Pill Top-Right */}
                <rect
                  x={x + resW - 48}
                  y={y + 5}
                  width="42"
                  height="16"
                  rx="4"
                  fill="#0B132B"
                  stroke={borderStroke}
                  strokeWidth="1"
                />
                <text
                  x={x + resW - 27}
                  y={y + 16}
                  textAnchor="middle"
                  fill="#94A3B8"
                  fontSize="8"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  Cap: {res.capacity}
                </text>

                {/* Conflict Banner if overloaded */}
                {isConflict && (
                  <g>
                    <rect
                      x={x + 8}
                      y={y + 30}
                      width={resW - 16}
                      height="15"
                      rx="3"
                      fill="#DC2626"
                    />
                    <text
                      x={x + resW / 2}
                      y={y + 41}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="8.5"
                      fontWeight="bold"
                    >
                      RACE CONFLICT! ({res.active_users.length} &gt; {res.capacity})
                    </text>
                  </g>
                )}

                {/* DOCKING PADS INSIDE RESOURCE */}
                {res.capacity === 1 ? (
                  /* Single capacity slot */
                  <g>
                    <rect
                      x={x + resW / 2 - 24}
                      y={y + 40}
                      width="48"
                      height="44"
                      rx="6"
                      fill="#070D1E"
                      stroke="#273459"
                      strokeDasharray="3 3"
                      strokeWidth="1.2"
                    />
                    <text
                      x={x + resW / 2}
                      y={y + 50}
                      textAnchor="middle"
                      fill="#475569"
                      fontSize="7.5"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      DOCK PAD
                    </text>
                  </g>
                ) : (
                  /* Multi-capacity slots */
                  Array.from({ length: res.capacity }).map((_, cIdx) => (
                    <g key={cIdx}>
                      <rect
                        x={x + 20 + cIdx * 65}
                        y={y + 40}
                        width="48"
                        height="44"
                        rx="6"
                        fill="#070D1E"
                        stroke="#273459"
                        strokeDasharray="3 3"
                        strokeWidth="1.2"
                      />
                      <text
                        x={x + 44 + cIdx * 65}
                        y={y + 50}
                        textAnchor="middle"
                        fill="#475569"
                        fontSize="7.5"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        SLOT {cIdx + 1}
                      </text>
                    </g>
                  ))
                )}

                {/* Bottom Status & Queue Info Bar */}
                <rect
                  x={x}
                  y={y + resH - 20}
                  width={resW}
                  height="20"
                  rx="6"
                  fill="#070D1E"
                />
                <text
                  x={x + 10}
                  y={y + resH - 7}
                  fill="#64748B"
                  fontSize="8"
                  fontFamily="monospace"
                >
                  Used: <tspan fill="#38BDF8" fontWeight="bold">{res.active_users?.length || 0}</tspan> | Free: <tspan fill="#4ADE80" fontWeight="bold">{res.available_slots}</tspan>
                  {res.waiting_queue?.length > 0 && (
                    <tspan fill="#F59E0B"> | Wait: {res.waiting_queue.length}</tspan>
                  )}
                </text>
              </g>
            );
          })}

          {/* ------------------------------------------------------------- */}
          {/* 3. RENDER MOBILE ROBOTS (CONCURRENT EXECUTION UNITS) */}
          {/* ------------------------------------------------------------- */}
          {robots.map((robot) => {
            const pos = getRobotRenderPosition(robot);
            const prioBadge = getPriorityBadge(robot.priority);
            const isConflict = robot.conflict_detected || robot.state === 'BLOCKED';
            const isRunning = robot.state === 'RUNNING';
            const isWaiting = robot.state === 'WAITING';

            return (
              <g
                key={robot.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                className="cursor-pointer transition-transform duration-200 ease-out"
                onClick={() => onRobotClick && onRobotClick(robot)}
              >
                {/* Glow Halo */}
                <circle
                  cx="0"
                  cy="0"
                  r={isConflict ? 22 : 19}
                  fill={isConflict ? '#EF4444' : robot.color}
                  fillOpacity={isConflict ? 0.35 : 0.18}
                  className={isConflict ? 'animate-ping' : ''}
                />

                {/* Robot Main Circular Chassis */}
                <circle
                  cx="0"
                  cy="0"
                  r="15"
                  fill="#0B132B"
                  stroke={isConflict ? '#EF4444' : isRunning ? '#10B981' : isWaiting ? '#F59E0B' : robot.color}
                  strokeWidth="2.5"
                />

                {/* Centered Robot ID */}
                <text
                  x="0"
                  y="4"
                  textAnchor="middle"
                  fill="#FFFFFF"
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                >
                  {robot.id}
                </text>

                {/* Priority Badge on Top-Right */}
                <g transform="translate(10, -14)">
                  <rect
                    x="0"
                    y="0"
                    width="14"
                    height="10"
                    rx="3"
                    fill={prioBadge.color}
                  />
                  <text
                    x="7"
                    y="7.5"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="6.5"
                    fontWeight="bold"
                  >
                    {prioBadge.text}
                  </text>
                </g>

                {/* State Tag on Top */}
                <g transform="translate(-16, -21)">
                  <rect
                    x="0"
                    y="0"
                    width="32"
                    height="9"
                    rx="2"
                    fill={isConflict ? '#DC2626' : isRunning ? '#059669' : isWaiting ? '#D97706' : '#2563EB'}
                  />
                  <text
                    x="16"
                    y="7"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="6"
                    fontWeight="bold"
                  >
                    {isConflict ? 'BLOCKED' : robot.state}
                  </text>
                </g>

                {/* Execution Progress Ring */}
                {isRunning && (
                  <circle
                    cx="0"
                    cy="0"
                    r="15"
                    fill="none"
                    stroke="#10B981"
                    strokeWidth="2.5"
                    strokeDasharray="94"
                    strokeDashoffset={94 - (94 * (robot.task_progress || 0)) / 100}
                    transform="rotate(-90)"
                  />
                )}

                {/* Task Label Below */}
                {robot.task_type && (
                  <g transform="translate(-25, 17)">
                    <rect
                      x="0"
                      y="0"
                      width="50"
                      height="9"
                      rx="2"
                      fill="#070D1E"
                      stroke="#1E293B"
                      strokeWidth="0.8"
                    />
                    <text
                      x="25"
                      y="7"
                      textAnchor="middle"
                      fill="#94A3B8"
                      fontSize="6"
                      fontWeight="500"
                    >
                      {robot.task_type.length > 10 ? robot.task_type.slice(0, 9) + '..' : robot.task_type}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};
