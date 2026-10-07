import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from '../services/api';

const DEFAULT_STATE = {
  status: 'IDLE',
  config: {
    robot_count: 5,
    technique: 'Mutex / Lock',
    speed: 'Normal',
    resource_capacities: {
      charging_stations: 2,
      loading_bays: 1,
      narrow_corridors: 2,
      storage_zones: 2,
    },
    selected_tasks: [
      'Pick Item',
      'Transport Item',
      'Move to Storage',
      'Load Item',
      'Unload Item',
      'Charge Robot',
    ],
    starvation_threshold: 8.0,
    aging_interval: 3.0,
    aging_enabled: true,
  },
  robots: [],
  resources: [],
  tasks: [],
  metrics: {
    total_tasks: 0,
    completed_tasks: 0,
    failed_tasks: 0,
    average_waiting_time: 0,
    average_completion_time: 0,
    resource_utilization: 0,
    resource_conflicts: 0,
    race_conditions: 0,
    deadlocks_detected: 0,
    deadlocks_resolved: 0,
    starvation_events: 0,
    blocked_processes: 0,
    throughput: 0,
    synchronization_overhead_ms: 0,
  },
  history: [],
  events: [],
  deadlocks: [],
  starvations: [],
  sync_details: {},
  wfg_graph: { nodes: [], edges: [] },
};

export function useSimulation() {
  const [state, setState] = useState(DEFAULT_STATE);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  // Connect to WebSocket
  useEffect(() => {
    let isMounted = true;

    function connectWs() {
      try {
        const ws = new WebSocket('ws://localhost:8000/ws');
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const message = JSON.parse(event.data);
            if (message.type === 'state_update') {
              setState(message.data);
            }
          } catch (e) {
            console.error('Error parsing WS message:', e);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          reconnectTimeoutRef.current = setTimeout(connectWs, 2000);
        };

        ws.onerror = () => {
          if (!isMounted) return;
          setIsConnected(false);
        };
      } catch (err) {
        if (!isMounted) return;
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connectWs, 2000);
      }
    }

    connectWs();

    // Fallback polling if WS is disconnected
    const pollInterval = setInterval(async () => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        try {
          const fresh = await api.fetchState();
          if (isMounted) {
            setState(fresh);
            setError(null);
          }
        } catch (e) {
          if (isMounted) setError('Backend server offline (http://localhost:8000)');
        }
      }
    }, 1500);

    return () => {
      isMounted = false;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      clearInterval(pollInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []);

  const handleStart = useCallback(async () => {
    try {
      await api.startSimulation();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handlePause = useCallback(async () => {
    try {
      await api.pauseSimulation();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleResume = useCallback(async () => {
    try {
      await api.resumeSimulation();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleReset = useCallback(async () => {
    try {
      await api.resetSimulation();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleSpeed = useCallback(async (speed) => {
    try {
      setState((prev) => ({
        ...prev,
        config: { ...prev.config, speed },
      }));
      await api.setSpeed(speed);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleConfigure = useCallback(async (cfg) => {
    try {
      await api.configureSimulation(cfg);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleTriggerRaceCondition = useCallback(async () => {
    try {
      await api.triggerRaceCondition();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleTriggerDeadlock = useCallback(async () => {
    try {
      await api.triggerDeadlock();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleRecoverDeadlock = useCallback(async () => {
    try {
      const res = await api.recoverDeadlock();
      return res;
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleTriggerStarvation = useCallback(async () => {
    try {
      await api.triggerStarvation();
    } catch (e) {
      setError(e.message);
    }
  }, []);

  const handleLoadPreset = useCallback(async (presetId) => {
    try {
      await api.loadPreset(presetId);
    } catch (e) {
      setError(e.message);
    }
  }, []);

  return {
    state,
    isConnected,
    error,
    start: handleStart,
    pause: handlePause,
    resume: handleResume,
    reset: handleReset,
    setSpeed: handleSpeed,
    configure: handleConfigure,
    triggerRaceCondition: handleTriggerRaceCondition,
    triggerDeadlock: handleTriggerDeadlock,
    recoverDeadlock: handleRecoverDeadlock,
    triggerStarvation: handleTriggerStarvation,
    loadPreset: handleLoadPreset,
  };
}
