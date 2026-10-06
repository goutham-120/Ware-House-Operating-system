from enum import Enum
from typing import List, Dict, Optional, Any
from pydantic import BaseModel, Field

class SyncTechnique(str, Enum):
    NO_SYNCHRONIZATION = "No Synchronization"
    MUTEX = "Mutex / Lock"
    SEMAPHORE = "Semaphore"
    MUTEX_AND_SEMAPHORE = "Mutex + Semaphore"

class SimulationStatus(str, Enum):
    IDLE = "IDLE"
    RUNNING = "RUNNING"
    PAUSED = "PAUSED"
    STOPPED = "STOPPED"

class SimulationSpeed(str, Enum):
    SLOW = "Slow"
    NORMAL = "Normal"
    FAST = "Fast"

class ResourceCapacityConfig(BaseModel):
    charging_stations: int = 2
    loading_bays: int = 1
    narrow_corridors: int = 2
    storage_zones: int = 2

class TaskConfigItem(BaseModel):
    task_type: str
    selected: bool = True
    priority: int = 3
    duration: float = 3.0

class SimulationConfig(BaseModel):
    robot_count: int = 5
    technique: SyncTechnique = SyncTechnique.MUTEX
    speed: SimulationSpeed = SimulationSpeed.NORMAL
    resource_capacities: ResourceCapacityConfig = Field(default_factory=ResourceCapacityConfig)
    selected_tasks: List[str] = Field(default_factory=lambda: [
        "Pick Item", "Transport Item", "Move to Storage", "Load Item", "Unload Item", "Charge Robot"
    ])
    starvation_threshold: float = 8.0  # seconds waiting before starvation alert & aging kicks in
    aging_interval: float = 3.0  # seconds between priority bumps
    aging_enabled: bool = True

class EventType(str, Enum):
    RESOURCE_REQUEST = "RESOURCE_REQUEST"
    RESOURCE_ACQUIRED = "RESOURCE_ACQUIRED"
    RESOURCE_RELEASED = "RESOURCE_RELEASED"
    PROCESS_WAITING = "PROCESS_WAITING"
    PROCESS_BLOCKED = "PROCESS_BLOCKED"
    RACE_CONDITION = "RACE_CONDITION"
    DEADLOCK_DETECTED = "DEADLOCK_DETECTED"
    DEADLOCK_RECOVERED = "DEADLOCK_RECOVERED"
    STARVATION_WARNING = "STARVATION_WARNING"
    PRIORITY_AGING = "PRIORITY_AGING"
    TASK_COMPLETED = "TASK_COMPLETED"
    TASK_STARTED = "TASK_STARTED"
    SYSTEM_INFO = "SYSTEM_INFO"

class EventLogItem(BaseModel):
    id: str
    timestamp: str
    sim_time: float
    event_type: EventType
    robot_id: Optional[str] = None
    resource_id: Optional[str] = None
    technique: str
    message: str
    details: Optional[Dict[str, Any]] = None

class DeadlockCycle(BaseModel):
    robots: List[str]
    resources: List[str]
    cycle_description: str
    detected_at: float

class StarvationAlert(BaseModel):
    robot_id: str
    waiting_time: float
    current_priority: int
    aging_level: int
    resource_id: str

class SimulationMetrics(BaseModel):
    total_tasks: int = 0
    completed_tasks: int = 0
    failed_tasks: int = 0
    average_waiting_time: float = 0.0
    average_completion_time: float = 0.0
    resource_utilization: float = 0.0  # percentage 0-100
    resource_conflicts: int = 0
    race_conditions: int = 0
    deadlocks_detected: int = 0
    deadlocks_resolved: int = 0
    starvation_events: int = 0
    blocked_processes: int = 0
    throughput: float = 0.0  # tasks per minute
    synchronization_overhead_ms: float = 0.0

class TechniqueComparisonResult(BaseModel):
    technique: str
    conflicts: int
    race_conditions: int
    deadlocks: int
    average_waiting_time: float
    average_completion_time: float
    resource_utilization: float
    completed_tasks: int
    throughput: float
    sample_time: float
