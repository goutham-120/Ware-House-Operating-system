import threading
import time
from typing import Dict, List, Optional
from backend.models.resource import ResourceModel, ResourceType, ResourceStatus, ResourcePosition
from backend.models.simulation import ResourceCapacityConfig, SyncTechnique

class ResourceManager:
    """
    Manages all warehouse resources, their capacities, current occupants, and queue states.
    """
    def __init__(self):
        self.lock = threading.Lock()
        self.resources: Dict[str, ResourceModel] = {}
        self.initialize_resources(ResourceCapacityConfig())

    def initialize_resources(self, config: ResourceCapacityConfig):
        with self.lock:
            self.resources.clear()
            
            # 1. Charging Stations (Bottom zone)
            cs_count = max(1, config.charging_stations)
            for i in range(cs_count):
                res_id = f"CS-{i+1:02d}"
                self.resources[res_id] = ResourceModel(
                    id=res_id,
                    name=f"Charging Station {i+1}",
                    type=ResourceType.CHARGING_STATION,
                    capacity=1,  # Each physical charging bay has 1 socket
                    available_slots=1,
                    position=ResourcePosition(x=140 + i * 190, y=410, width=150, height=110)
                )

            # 2. Loading Bays (Left zone)
            lb_count = max(1, config.loading_bays)
            for i in range(lb_count):
                res_id = f"LB-{i+1:02d}"
                self.resources[res_id] = ResourceModel(
                    id=res_id,
                    name=f"Loading Bay {i+1}",
                    type=ResourceType.LOADING_BAY,
                    capacity=1,  # Exclusive bay per docking robot
                    available_slots=1,
                    position=ResourcePosition(x=40, y=140 + i * 150, width=140, height=130)
                )

            # 3. Narrow Corridors (Central bottleneck)
            nc_count = max(1, config.narrow_corridors)
            for i in range(nc_count):
                res_id = f"NC-{i+1:02d}"
                # If capacity configured > 1, the corridor can hold multiple robots concurrently (Semaphore showcase!)
                corridor_capacity = 2 if nc_count == 1 else 1
                self.resources[res_id] = ResourceModel(
                    id=res_id,
                    name=f"Narrow Corridor {i+1}",
                    type=ResourceType.NARROW_CORRIDOR,
                    capacity=corridor_capacity,
                    available_slots=corridor_capacity,
                    position=ResourcePosition(x=270 + i * 200, y=200, width=190, height=150)
                )

            # 4. Storage Zones (Right zone)
            sz_count = max(1, config.storage_zones)
            for i in range(sz_count):
                res_id = f"SZ-{i+1:02d}"
                self.resources[res_id] = ResourceModel(
                    id=res_id,
                    name=f"Storage Zone {i+1}",
                    type=ResourceType.STORAGE_ZONE,
                    capacity=2,  # Multi-capacity zone
                    available_slots=2,
                    position=ResourcePosition(x=660, y=140 + i * 150, width=180, height=140)
                )

    def get_resource(self, resource_id: str) -> Optional[ResourceModel]:
        with self.lock:
            return self.resources.get(resource_id)

    def get_all_resources(self) -> List[ResourceModel]:
        with self.lock:
            return [res.model_copy() for res in self.resources.values()]

    def get_resources_by_type(self, res_type: ResourceType) -> List[ResourceModel]:
        with self.lock:
            return [res.model_copy() for res in self.resources.values() if res.type == res_type]

    def record_enter(self, resource_id: str, robot_id: str, is_conflict: bool = False):
        with self.lock:
            res = self.resources.get(resource_id)
            if not res:
                return
            if robot_id not in res.active_users:
                res.active_users.append(robot_id)
            if robot_id in res.waiting_queue:
                res.waiting_queue.remove(robot_id)
            
            res.available_slots = max(0, res.capacity - len(res.active_users))
            res.total_allocations += 1

            if is_conflict or len(res.active_users) > res.capacity:
                res.status = ResourceStatus.CONFLICT
                res.total_conflicts += 1
            elif len(res.active_users) >= res.capacity:
                res.status = ResourceStatus.FULL
            else:
                res.status = ResourceStatus.OCCUPIED

    def record_leave(self, resource_id: str, robot_id: str, usage_duration: float = 0.0):
        with self.lock:
            res = self.resources.get(resource_id)
            if not res:
                return
            if robot_id in res.active_users:
                res.active_users.remove(robot_id)
            res.total_usage_time += usage_duration
            res.available_slots = max(0, res.capacity - len(res.active_users))

            if len(res.active_users) == 0:
                res.status = ResourceStatus.FREE
            elif len(res.active_users) > res.capacity:
                res.status = ResourceStatus.CONFLICT
            elif len(res.active_users) == res.capacity:
                res.status = ResourceStatus.FULL
            else:
                res.status = ResourceStatus.OCCUPIED

    def record_waiting(self, resource_id: str, robot_id: str):
        with self.lock:
            res = self.resources.get(resource_id)
            if res and robot_id not in res.waiting_queue:
                res.waiting_queue.append(robot_id)

    def remove_from_waiting(self, resource_id: str, robot_id: str):
        with self.lock:
            res = self.resources.get(resource_id)
            if res and robot_id in res.waiting_queue:
                res.waiting_queue.remove(robot_id)

    def get_resource_capacities_dict(self) -> Dict[str, int]:
        with self.lock:
            return {res_id: res.capacity for res_id, res in self.resources.items()}

    def reset(self):
        with self.lock:
            for res in self.resources.values():
                res.active_users.clear()
                res.waiting_queue.clear()
                res.available_slots = res.capacity
                res.status = ResourceStatus.FREE
                res.total_allocations = 0
                res.total_conflicts = 0
                res.total_usage_time = 0.0
