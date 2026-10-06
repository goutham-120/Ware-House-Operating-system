import threading
import time
from typing import Dict, List, Optional, Tuple, Any
from backend.models.simulation import SyncTechnique, EventType

class PriorityWaitingItem:
    def __init__(self, robot_id: str, priority: int, request_time: float, condition: threading.Condition):
        self.robot_id = robot_id
        self.priority = priority
        self.request_time = request_time
        self.condition = condition
        self.granted = False

class ResourceSyncPrimitive:
    """
    Manages genuine Python threading synchronization primitives for a specific resource,
    adapting dynamically to the configured SyncTechnique.
    """
    def __init__(self, resource_id: str, capacity: int, technique: SyncTechnique):
        self.resource_id = resource_id
        self.capacity = capacity
        self.technique = technique
        
        # Primitives
        self.mutex = threading.Lock()
        self.state_lock = threading.Lock()  # Protect internal tracking data safely
        self.condition = threading.Condition(self.state_lock)
        self.raw_semaphore = threading.Semaphore(capacity)
        
        # State tracking
        self.active_holders: List[str] = []
        # Priority waiting queue: list of PriorityWaitingItem
        self.waiters: List[PriorityWaitingItem] = []
        
        # No-Sync conflict flags
        self.conflict_count = 0
        self.race_condition_count = 0

    def update_technique(self, new_technique: SyncTechnique, new_capacity: int):
        with self.state_lock:
            self.technique = new_technique
            self.capacity = new_capacity
            self.raw_semaphore = threading.Semaphore(new_capacity)

    def acquire(self, robot_id: str, priority: int, timeout: Optional[float] = None) -> Tuple[bool, Optional[str]]:
        """
        Acquire the resource according to the active synchronization technique.
        Returns: (success: bool, conflict_message: Optional[str])
        """
        req_time = time.time()

        if self.technique == SyncTechnique.NO_SYNCHRONIZATION:
            # NO SYNCHRONIZATION:
            # Deliberately bypass mutual exclusion! Multiple threads proceed into critical section simultaneously.
            # Small jitter to expose interleaving race conditions if concurrent
            time.sleep(0.01)
            
            with self.state_lock:
                self.active_holders.append(robot_id)
                # Check for capacity breach (Race Condition / Conflict)
                if len(self.active_holders) > self.capacity:
                    self.conflict_count += 1
                    self.race_condition_count += 1
                    other_holders = [h for h in self.active_holders if h != robot_id]
                    conflict_msg = (
                        f"RACE CONDITION DETECTED! Robot {robot_id} entered {self.resource_id} "
                        f"simultaneously with {', '.join(other_holders)}. "
                        f"Capacity {self.capacity} exceeded (Current active: {len(self.active_holders)})!"
                    )
                    return True, conflict_msg
            return True, None

        elif self.technique == SyncTechnique.MUTEX:
            # MUTEX / LOCK:
            # Exclusive access (effective capacity = 1 for mutex, or serialized per slot)
            waiter_item = PriorityWaitingItem(robot_id, priority, req_time, self.condition)
            with self.state_lock:
                if len(self.active_holders) == 0:
                    # Immediate acquisition
                    self.active_holders.append(robot_id)
                    return True, None
                
                # Must wait - insert in priority order (higher priority first, earlier time for ties)
                self.waiters.append(waiter_item)
                self._sort_waiters()

            # Wait on condition variable until this robot is at the head and granted
            with self.state_lock:
                start_wait = time.time()
                while not waiter_item.granted:
                    if timeout is not None:
                        remaining = timeout - (time.time() - start_wait)
                        if remaining <= 0:
                            if waiter_item in self.waiters:
                                self.waiters.remove(waiter_item)
                            return False, None
                        self.condition.wait(timeout=remaining)
                    else:
                        self.condition.wait()
                return True, None

        elif self.technique == SyncTechnique.SEMAPHORE:
            # SEMAPHORE:
            # Counting semaphore allowing up to `capacity` concurrent holders.
            # Priority-aware semaphore queue:
            waiter_item = PriorityWaitingItem(robot_id, priority, req_time, self.condition)
            with self.state_lock:
                if len(self.active_holders) < self.capacity:
                    self.active_holders.append(robot_id)
                    return True, None
                
                self.waiters.append(waiter_item)
                self._sort_waiters()

            with self.state_lock:
                start_wait = time.time()
                while not waiter_item.granted:
                    if timeout is not None:
                        remaining = timeout - (time.time() - start_wait)
                        if remaining <= 0:
                            if waiter_item in self.waiters:
                                self.waiters.remove(waiter_item)
                            return False, None
                        self.condition.wait(timeout=remaining)
                    else:
                        self.condition.wait()
                return True, None

        elif self.technique == SyncTechnique.MUTEX_AND_SEMAPHORE:
            # MUTEX + SEMAPHORE:
            # Semaphore controls available slot counter; Mutex serializes entry into the critical state
            waiter_item = PriorityWaitingItem(robot_id, priority, req_time, self.condition)
            with self.state_lock:
                if len(self.active_holders) < self.capacity:
                    # Acquire internal mutex to serialize slot allocation
                    with self.mutex:
                        self.active_holders.append(robot_id)
                    return True, None
                
                self.waiters.append(waiter_item)
                self._sort_waiters()

            with self.state_lock:
                start_wait = time.time()
                while not waiter_item.granted:
                    if timeout is not None:
                        remaining = timeout - (time.time() - start_wait)
                        if remaining <= 0:
                            if waiter_item in self.waiters:
                                self.waiters.remove(waiter_item)
                            return False, None
                        self.condition.wait(timeout=remaining)
                    else:
                        self.condition.wait()
                return True, None

        return True, None

    def release(self, robot_id: str):
        """
        Release the resource and wake up the next highest-priority waiting process.
        """
        with self.state_lock:
            if robot_id in self.active_holders:
                self.active_holders.remove(robot_id)

            if self.technique == SyncTechnique.NO_SYNCHRONIZATION:
                return

            max_allowed = 1 if self.technique == SyncTechnique.MUTEX else self.capacity
            slots_available = max_allowed - len(self.active_holders)

            while slots_available > 0 and self.waiters:
                next_waiter = self.waiters.pop(0)
                next_waiter.granted = True
                self.active_holders.append(next_waiter.robot_id)
                slots_available -= 1

            self.condition.notify_all()

    def update_waiter_priority(self, robot_id: str, new_priority: int):
        """Used by Priority Aging to promote starving robots in the queue"""
        with self.state_lock:
            for w in self.waiters:
                if w.robot_id == robot_id:
                    w.priority = new_priority
            self._sort_waiters()

    def remove_waiter(self, robot_id: str):
        """Remove a robot from waiting queue (e.g. during deadlock recovery or cancellation)"""
        with self.state_lock:
            self.waiters = [w for w in self.waiters if w.robot_id != robot_id]
            self.condition.notify_all()

    def force_release(self, robot_id: str):
        """Preempt / force release a resource held by a robot (used in Deadlock Recovery)"""
        self.release(robot_id)

    def _sort_waiters(self):
        # Higher priority first; earlier request_time for ties (FIFO among equal priorities)
        self.waiters.sort(key=lambda item: (-item.priority, item.request_time))

    def get_waiting_robot_ids(self) -> List[str]:
        with self.state_lock:
            return [w.robot_id for w in self.waiters]

    def get_active_holders(self) -> List[str]:
        with self.state_lock:
            return list(self.active_holders)


class SynchronizationManager:
    """
    Central repository for all resource synchronization primitives.
    """
    def __init__(self, technique: SyncTechnique = SyncTechnique.MUTEX):
        self.technique = technique
        self.primitives: Dict[str, ResourceSyncPrimitive] = {}
        self.lock = threading.Lock()

    def register_resource(self, resource_id: str, capacity: int):
        with self.lock:
            self.primitives[resource_id] = ResourceSyncPrimitive(
                resource_id=resource_id,
                capacity=capacity,
                technique=self.technique
            )

    def set_technique(self, new_technique: SyncTechnique, resource_capacities: Dict[str, int]):
        with self.lock:
            self.technique = new_technique
            for res_id, primitive in self.primitives.items():
                cap = resource_capacities.get(res_id, primitive.capacity)
                primitive.update_technique(new_technique, cap)

    def acquire_resource(self, resource_id: str, robot_id: str, priority: int, timeout: Optional[float] = None) -> Tuple[bool, Optional[str]]:
        primitive = self.primitives.get(resource_id)
        if not primitive:
            return True, None
        return primitive.acquire(robot_id, priority, timeout=timeout)

    def release_resource(self, resource_id: str, robot_id: str):
        primitive = self.primitives.get(resource_id)
        if primitive:
            primitive.release(robot_id)

    def update_waiter_priority(self, resource_id: str, robot_id: str, new_priority: int):
        primitive = self.primitives.get(resource_id)
        if primitive:
            primitive.update_waiter_priority(robot_id, new_priority)

    def remove_waiter(self, resource_id: str, robot_id: str):
        primitive = self.primitives.get(resource_id)
        if primitive:
            primitive.remove_waiter(robot_id)

    def force_preempt(self, resource_id: str, robot_id: str):
        primitive = self.primitives.get(resource_id)
        if primitive:
            primitive.force_release(robot_id)

    def get_primitive(self, resource_id: str) -> Optional[ResourceSyncPrimitive]:
        return self.primitives.get(resource_id)

    def reset(self):
        with self.lock:
            self.primitives.clear()
