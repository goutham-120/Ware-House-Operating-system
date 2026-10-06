from enum import Enum
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class RobotState(str, Enum):
    READY = "READY"
    RUNNING = "RUNNING"
    WAITING = "WAITING"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class RobotPriority(int, Enum):
    LOW = 1
    NORMAL = 3
    HIGH = 4
    EMERGENCY = 5

class Position(BaseModel):
    x: float
    y: float

class RobotModel(BaseModel):
    id: str
    state: RobotState = RobotState.READY
    task_id: Optional[str] = None
    task_type: Optional[str] = None
    priority: int = 3
    base_priority: int = 3
    aging_level: int = 0
    battery: float = 100.0
    position: Position = Field(default_factory=lambda: Position(x=50, y=50))
    target_position: Position = Field(default_factory=lambda: Position(x=50, y=50))
    resource_id: Optional[str] = None
    waiting_for_resource: Optional[str] = None
    waiting_since: Optional[float] = None
    total_wait_time: float = 0.0
    total_execution_time: float = 0.0
    task_progress: float = 0.0
    conflict_detected: bool = False
    in_critical_section: bool = False
    color: str = "#3B82F6"
