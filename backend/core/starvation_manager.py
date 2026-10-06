import threading
import time
from typing import Dict, List, Optional, Tuple
from backend.models.simulation import StarvationAlert

class StarvationManager:
    """
    Monitors process wait times against threshold. Detects starvation risks
    and applies Priority Aging to elevate long-waiting processes so they can access resources.
    """
    def __init__(self, starvation_threshold: float = 8.0, aging_interval: float = 3.0, aging_enabled: bool = True):
        self.lock = threading.Lock()
        self.starvation_threshold = starvation_threshold
        self.aging_interval = aging_interval
        self.aging_enabled = aging_enabled
        
        # robot_id -> last_aging_timestamp
        self.last_aged_time: Dict[str, float] = {}
        self.total_starvation_events = 0
        self.active_alerts: Dict[str, StarvationAlert] = {}

    def configure(self, threshold: float, aging_interval: float, enabled: bool):
        with self.lock:
            self.starvation_threshold = threshold
            self.aging_interval = aging_interval
            self.aging_enabled = enabled

    def check_starvation_and_age(
        self,
        robot_id: str,
        current_wait_time: float,
        current_priority: int,
        resource_id: str
    ) -> Tuple[bool, Optional[int], Optional[str]]:
        """
        Evaluates a waiting robot.
        Returns:
            (is_starving: bool, new_priority: Optional[int], alert_message: Optional[str])
        """
        with self.lock:
            now = time.time()
            if current_wait_time >= self.starvation_threshold:
                # Starvation detected!
                if robot_id not in self.active_alerts:
                    self.total_starvation_events += 1
                
                # Check priority aging
                new_priority = None
                log_msg = None
                
                last_age = self.last_aged_time.get(robot_id, 0.0)
                if self.aging_enabled and (now - last_age >= self.aging_interval):
                    if current_priority < 5:  # 5 is EMERGENCY max priority
                        new_priority = current_priority + 1
                        self.last_aged_time[robot_id] = now
                        log_msg = (
                            f"PRIORITY AGING APPLIED! Robot {robot_id} waited {current_wait_time:.1f}s. "
                            f"Priority elevated from {current_priority} -> {new_priority} to prevent starvation."
                        )

                aging_level = max(0, current_priority - 1)
                self.active_alerts[robot_id] = StarvationAlert(
                    robot_id=robot_id,
                    waiting_time=current_wait_time,
                    current_priority=new_priority or current_priority,
                    aging_level=aging_level,
                    resource_id=resource_id
                )

                return True, new_priority, log_msg
            else:
                if robot_id in self.active_alerts:
                    del self.active_alerts[robot_id]
                return False, None, None

    def clear_robot(self, robot_id: str):
        with self.lock:
            if robot_id in self.active_alerts:
                del self.active_alerts[robot_id]
            if robot_id in self.last_aged_time:
                del self.last_aged_time[robot_id]

    def get_active_alerts(self) -> List[StarvationAlert]:
        with self.lock:
            return list(self.active_alerts.values())

    def reset(self):
        with self.lock:
            self.last_aged_time.clear()
            self.active_alerts.clear()
            self.total_starvation_events = 0
