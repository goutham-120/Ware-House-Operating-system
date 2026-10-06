from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ResourceType(str, Enum):
    CHARGING_STATION = "Charging Station"
    LOADING_BAY = "Loading Bay"
    NARROW_CORRIDOR = "Narrow Corridor"
    STORAGE_ZONE = "Storage Zone"

class ResourceStatus(str, Enum):
    FREE = "FREE"
    OCCUPIED = "OCCUPIED"
    FULL = "FULL"
    CONFLICT = "CONFLICT"

class ResourcePosition(BaseModel):
    x: float
    y: float
    width: float
    height: float

class ResourceModel(BaseModel):
    id: str
    name: str
    type: ResourceType
    capacity: int = 1
    active_users: List[str] = Field(default_factory=list)
    available_slots: int = 1
    waiting_queue: List[str] = Field(default_factory=list)  # Robot IDs in queue (ordered by priority & time)
    status: ResourceStatus = ResourceStatus.FREE
    position: ResourcePosition = Field(default_factory=lambda: ResourcePosition(x=0, y=0, width=80, height=80))
    total_allocations: int = 0
    total_conflicts: int = 0
    total_usage_time: float = 0.0
