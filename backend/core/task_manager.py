import threading
import time
import random
from typing import Dict, List, Optional
from backend.models.task import TaskModel, TaskType, TaskStatus
from backend.models.resource import ResourceType

class TaskManager:
    """
    Manages task queues, task assignments, and workload generation.
    """
    def __init__(self):
        self.lock = threading.Lock()
        self.tasks: Dict[str, TaskModel] = {}
        self.task_counter = 0

    def generate_task_for_robot(
        self,
        robot_id: str,
        allowed_tasks: List[str],
        forced_task_type: Optional[TaskType] = None,
        forced_priority: Optional[int] = None,
        forced_resource_id: Optional[str] = None,
        duration: float = 3.0
    ) -> TaskModel:
        with self.lock:
            self.task_counter += 1
            task_id = f"TSK-{self.task_counter:04d}"

            if forced_task_type:
                t_type = forced_task_type
            else:
                valid_types = [t for t in TaskType if t.value in allowed_tasks]
                t_type = random.choice(valid_types) if valid_types else TaskType.TRANSPORT_ITEM

            # Map task to required resource category
            resource_type_map = {
                TaskType.PICK_ITEM: ResourceType.STORAGE_ZONE.value,
                TaskType.MOVE_TO_STORAGE: ResourceType.STORAGE_ZONE.value,
                TaskType.TRANSPORT_ITEM: ResourceType.NARROW_CORRIDOR.value,
                TaskType.LOAD_ITEM: ResourceType.LOADING_BAY.value,
                TaskType.UNLOAD_ITEM: ResourceType.LOADING_BAY.value,
                TaskType.CHARGE_ROBOT: ResourceType.CHARGING_STATION.value,
            }
            res_category = resource_type_map.get(t_type, ResourceType.NARROW_CORRIDOR.value)

            priority = forced_priority if forced_priority is not None else random.choice([1, 3, 3, 4, 5])

            task = TaskModel(
                id=task_id,
                robot_id=robot_id,
                type=t_type,
                priority=priority,
                required_resource_type=res_category,
                required_resource_id=forced_resource_id,
                duration=duration,
                status=TaskStatus.QUEUED,
                created_time=time.time(),
                progress=0.0
            )
            self.tasks[task_id] = task
            return task

    def update_task_status(self, task_id: str, status: TaskStatus, progress: float = 0.0):
        with self.lock:
            task = self.tasks.get(task_id)
            if not task:
                return
            task.status = status
            task.progress = progress
            if status == TaskStatus.RUNNING and task.start_time is None:
                task.start_time = time.time()
            elif status in [TaskStatus.COMPLETED, TaskStatus.FAILED] and task.completion_time is None:
                task.completion_time = time.time()

    def get_task(self, task_id: str) -> Optional[TaskModel]:
        with self.lock:
            return self.tasks.get(task_id)

    def get_all_tasks(self) -> List[TaskModel]:
        with self.lock:
            return [t.model_copy() for t in self.tasks.values()]

    def reset(self):
        with self.lock:
            self.tasks.clear()
            self.task_counter = 0
