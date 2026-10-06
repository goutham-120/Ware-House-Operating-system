import threading
import time
from typing import Dict, List, Any
from backend.models.simulation import SimulationMetrics

class MetricsManager:
    """
    Collects performance statistics and time-series data for analytics charts.
    """
    def __init__(self):
        self.lock = threading.Lock()
        self.metrics = SimulationMetrics()
        
        # Historical arrays for Recharts
        self.history: List[Dict[str, Any]] = []
        self.completed_wait_times: List[float] = []
        self.completed_durations: List[float] = []
        self.sim_start_time = time.time()
        self.last_history_sample_time = 0.0

    def start(self):
        with self.lock:
            self.sim_start_time = time.time()
            self.last_history_sample_time = 0.0

    def record_task_completed(self, wait_time: float, execution_time: float):
        with self.lock:
            self.metrics.completed_tasks += 1
            self.completed_wait_times.append(wait_time)
            self.completed_durations.append(execution_time)
            
            self.metrics.average_waiting_time = (
                sum(self.completed_wait_times) / len(self.completed_wait_times)
            )
            self.metrics.average_completion_time = (
                sum(self.completed_durations) / len(self.completed_durations)
            )
            
            elapsed_min = max(0.1, (time.time() - self.sim_start_time) / 60.0)
            self.metrics.throughput = round(self.metrics.completed_tasks / elapsed_min, 2)

    def record_conflict(self):
        with self.lock:
            self.metrics.resource_conflicts += 1
            self.metrics.race_conditions += 1

    def record_deadlock(self):
        with self.lock:
            self.metrics.deadlocks_detected += 1

    def record_deadlock_resolved(self):
        with self.lock:
            self.metrics.deadlocks_resolved += 1

    def record_starvation(self):
        with self.lock:
            self.metrics.starvation_events += 1

    def update_snapshot(self, running_count: int, waiting_count: int, blocked_count: int, resources: list):
        with self.lock:
            now = time.time()
            self.metrics.blocked_processes = blocked_count

            # Calculate instantaneous resource utilization
            total_slots = sum(r.capacity for r in resources) if resources else 1
            used_slots = sum(len(r.active_users) for r in resources) if resources else 0
            inst_util = min(100.0, round((used_slots / total_slots) * 100.0, 1))
            self.metrics.resource_utilization = inst_util

            # Sample time-series every 1.0 second
            if now - self.last_history_sample_time >= 1.0:
                self.last_history_sample_time = now
                elapsed_s = round(now - self.sim_start_time, 1)
                
                self.history.append({
                    "time": f"{int(elapsed_s)}s",
                    "timestamp": elapsed_s,
                    "utilization": inst_util,
                    "running": running_count,
                    "waiting": waiting_count,
                    "blocked": blocked_count,
                    "completed": self.metrics.completed_tasks,
                    "conflicts": self.metrics.resource_conflicts,
                    "avg_wait": round(self.metrics.average_waiting_time, 2),
                    "throughput": self.metrics.throughput
                })

                # Keep last 50 points to ensure smooth chart performance
                if len(self.history) > 60:
                    self.history = self.history[-60:]

    def get_metrics(self) -> SimulationMetrics:
        with self.lock:
            return self.metrics.model_copy()

    def get_history(self) -> List[Dict[str, Any]]:
        with self.lock:
            return list(self.history)

    def reset(self):
        with self.lock:
            self.metrics = SimulationMetrics()
            self.history.clear()
            self.completed_wait_times.clear()
            self.completed_durations.clear()
            self.sim_start_time = time.time()
            self.last_history_sample_time = 0.0
