from enum import Enum
from typing import Optional, List
from pydantic import BaseModel, Field

class TaskType(str, Enum):
    PICK_ITEM = "Pick Item"
    TRANSPORT_ITEM = "Transport Item"
    MOVE_TO_STORAGE = "Move to Storage"
    LOAD_ITEM = "Load Item"
    UNLOAD_ITEM = "Unload Item"
    CHARGE_ROBOT = "Charge Robot"

class TaskStatus(str, Enum):
    QUEUED = "QUEUED"
    RUNNING = "RUNNING"
    WAITING = "WAITING"
    BLOCKED = "BLOCKED"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class TaskModel(BaseModel):
    id: str
    robot_id: Optional[str] = None
    type: TaskType
    priority: int = 3
    required_resource_type: str  # e.g., 'Charging Station', 'Loading Bay', 'Corridor', 'Storage Zone'
    required_resource_id: Optional[str] = None
    duration: float = 3.0  # nominal seconds
    status: TaskStatus = TaskStatus.QUEUED
    created_time: float = 0.0
    start_time: Optional[float] = None
    completion_time: Optional[float] = None
    progress: float = 0.0
