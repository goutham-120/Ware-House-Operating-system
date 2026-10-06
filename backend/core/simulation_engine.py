import threading
import time
import random
import uuid
from typing import Dict, List, Optional, Any, Callable
from datetime import datetime

from backend.models.robot import RobotModel, RobotState, Position
from backend.models.task import TaskModel, TaskType, TaskStatus
from backend.models.resource import ResourceModel, ResourceType, ResourceStatus
from backend.models.simulation import (
    SimulationConfig, SimulationStatus, SimulationSpeed, SyncTechnique,
    EventLogItem, EventType, DeadlockCycle, StarvationAlert
)
from backend.core.synchronization_manager import SynchronizationManager
from backend.core.resource_manager import ResourceManager
from backend.core.task_manager import TaskManager
from backend.core.deadlock_manager import DeadlockManager
from backend.core.starvation_manager import StarvationManager
from backend.core.metrics_manager import MetricsManager

class SimulationEngine:
    """
    Core Operating System simulation coordinator.
    Manages concurrent robot worker threads, resource allocation,
    synchronization primitives, deadlock detection, and metrics.
    """
    def __init__(self):
        self.lock = threading.Lock()
        self.status = SimulationStatus.IDLE
        self.config = SimulationConfig()
        
        # Subsystem managers
        self.sync_manager = SynchronizationManager(self.config.technique)
        self.resource_manager = ResourceManager()
        self.task_manager = TaskManager()
        self.deadlock_manager = DeadlockManager()
        self.starvation_manager = StarvationManager(
            starvation_threshold=self.config.starvation_threshold,
            aging_interval=self.config.aging_interval,
            aging_enabled=self.config.aging_enabled
        )
        self.metrics_manager = MetricsManager()

        # Robot threads and states
        self.robots: Dict[str, RobotModel] = {}
        self.robot_threads: Dict[str, threading.Thread] = {}
        self.stop_events: Dict[str, threading.Event] = {}
        self.pause_event = threading.Event()
        self.pause_event.set()  # Not paused initially

        # Global event log
        self.event_log: List[EventLogItem] = []
        self.event_counter = 0

        # Background watchdog thread for Deadlock and Starvation checking
        self.watchdog_thread: Optional[threading.Thread] = None
        self.watchdog_stop = threading.Event()

        # Listeners / callbacks (e.g. WebSocket broadcaster)
        self.on_state_change: Optional[Callable[[], None]] = None

        # Speed scaling factors
        self.speed_multipliers = {
            SimulationSpeed.SLOW: 2.0,     # Slower duration
            SimulationSpeed.NORMAL: 1.0,   # Baseline
            SimulationSpeed.FAST: 0.35     # Fast execution
        }

        # Initialize default resources
        self._sync_primitives_with_resources()
        self._init_robots(self.config.robot_count)

    def _sync_primitives_with_resources(self):
        self.sync_manager.reset()
        capacities = self.resource_manager.get_resource_capacities_dict()
        for res_id, cap in capacities.items():
            self.sync_manager.register_resource(res_id, cap)
        self.sync_manager.set_technique(self.config.technique, capacities)

    def _init_robots(self, count: int):
        self.robots.clear()
        colors = [
            "#3B82F6", "#06B6D4", "#10B981", "#8B5CF6", "#F59E0B",
            "#EC4899", "#14B8A6", "#6366F1", "#84CC16", "#F97316",
            "#A855F7", "#0EA5E9", "#E11D48", "#22C55E", "#D97706"
        ]
        for i in range(count):
            rid = f"R{i+1:02d}"
            # Scatter robots initially in designated staging parking bays
            col = i % 7
            row = i // 7
            pos_x = 215 + col * 68
            pos_y = 64 + row * 40
            
            prio = 3
            if i == 0: prio = 5  # Emergency
            elif i == 1: prio = 4 # High
            elif i == count - 1: prio = 1 # Low

            self.robots[rid] = RobotModel(
                id=rid,
                state=RobotState.READY,
                priority=prio,
                base_priority=prio,
                battery=random.randint(75, 100),
                position=Position(x=pos_x, y=pos_y),
                target_position=Position(x=pos_x, y=pos_y),
                color=colors[i % len(colors)]
            )

    def configure(self, new_config: SimulationConfig):
        with self.lock:
            if self.status == SimulationStatus.RUNNING:
                self._stop_threads()

            self.config = new_config
            self.resource_manager.initialize_resources(new_config.resource_capacities)
            self._sync_primitives_with_resources()
            self._init_robots(new_config.robot_count)
            self.starvation_manager.configure(
                threshold=new_config.starvation_threshold,
                aging_interval=new_config.aging_interval,
                enabled=new_config.aging_enabled
            )
            self.status = SimulationStatus.IDLE
            self.log_event(
                EventType.SYSTEM_INFO,
                message=f"Simulation configured: {new_config.robot_count} robots, technique='{new_config.technique.value}'"
            )

    def start(self):
        with self.lock:
            if self.status == SimulationStatus.RUNNING:
                return

            self.status = SimulationStatus.RUNNING
            self.pause_event.set()
            self.watchdog_stop.clear()
            self.metrics_manager.start()

            self.log_event(
                EventType.SYSTEM_INFO,
                message=f"Simulation STARTED with {len(self.robots)} robots. Synchronization: {self.config.technique.value}"
            )

            # Spawn robot worker threads
            for rid, robot in self.robots.items():
                stop_ev = threading.Event()
                self.stop_events[rid] = stop_ev
                t = threading.Thread(target=self._robot_thread_worker, args=(rid, stop_ev), daemon=True)
                self.robot_threads[rid] = t
                t.start()

            # Spawn watchdog for deadlock and starvation monitoring
            self.watchdog_thread = threading.Thread(target=self._watchdog_worker, daemon=True)
            self.watchdog_thread.start()

    def pause(self):
        with self.lock:
            if self.status == SimulationStatus.RUNNING:
                self.pause_event.clear()
                self.status = SimulationStatus.PAUSED
                self.log_event(EventType.SYSTEM_INFO, message="Simulation PAUSED")

    def resume(self):
        with self.lock:
            if self.status == SimulationStatus.PAUSED:
                self.pause_event.set()
                self.status = SimulationStatus.RUNNING
                self.log_event(EventType.SYSTEM_INFO, message="Simulation RESUMED")

    def reset(self):
        with self.lock:
            self._stop_threads()
            self.resource_manager.reset()
            self.task_manager.reset()
            self.deadlock_manager.reset()
            self.starvation_manager.reset()
            self.metrics_manager.reset()
            self.event_log.clear()
            self._sync_primitives_with_resources()
            self._init_robots(self.config.robot_count)
            self.status = SimulationStatus.IDLE
            self.log_event(EventType.SYSTEM_INFO, message="Simulation RESET to initial state")

    def set_speed(self, speed: SimulationSpeed):
        with self.lock:
            self.config.speed = speed
            self.log_event(EventType.SYSTEM_INFO, message=f"Simulation speed set to {speed.value}")

    def _stop_threads(self):
        self.watchdog_stop.set()
        self.pause_event.set()  # Unblock any paused waits so threads can exit
        for stop_ev in self.stop_events.values():
            stop_ev.set()
        
        # Release all locks to prevent hanging worker threads
        for res_id in self.resource_manager.get_resource_capacities_dict().keys():
            primitive = self.sync_manager.get_primitive(res_id)
            if primitive:
                with primitive.state_lock:
                    primitive.condition.notify_all()

        self.robot_threads.clear()
        self.stop_events.clear()

    def log_event(
        self,
        event_type: EventType,
        message: str,
        robot_id: Optional[str] = None,
        resource_id: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.event_counter += 1
        now_dt = datetime.now().strftime("%H:%M:%S")
        sim_elapsed = round(time.time() - self.metrics_manager.sim_start_time, 2)
        item = EventLogItem(
            id=f"EVT-{self.event_counter:05d}",
            timestamp=now_dt,
            sim_time=sim_elapsed,
            event_type=event_type,
            robot_id=robot_id,
            resource_id=resource_id,
            technique=self.config.technique.value,
            message=message,
            details=details or {}
        )
        self.event_log.append(item)
        if len(self.event_log) > 200:
            self.event_log = self.event_log[-200:]

    # -------------------------------------------------------------
    # Robot Worker Thread (Models Process in OS)
    # -------------------------------------------------------------
    def _robot_thread_worker(self, robot_id: str, stop_event: threading.Event):
        """
        Thread function executing the robot process lifecycle.
        """
        while not stop_event.is_set():
            # Check pause state
            self.pause_event.wait()
            if stop_event.is_set():
                break

            speed_factor = self.speed_multipliers.get(self.config.speed, 1.0)

            # 1. GENERATE TASK (Process enters READY)
            task = self.task_manager.generate_task_for_robot(
                robot_id=robot_id,
                allowed_tasks=self.config.selected_tasks,
                duration=random.uniform(2.5, 4.5) * speed_factor
            )

            with self.lock:
                robot = self.robots.get(robot_id)
                if not robot:
                    break
                robot.state = RobotState.READY
                robot.task_id = task.id
                robot.task_type = task.type.value
                robot.task_progress = 0.0
                robot.conflict_detected = False

            # Choose candidate resource matching required type
            target_res = self._find_candidate_resource(task.required_resource_type, task.required_resource_id)
            if not target_res:
                time.sleep(0.5 * speed_factor)
                continue

            target_res_id = target_res.id

            # Move robot towards the resource entrance
            self._move_robot_towards(robot_id, target_res.position.x, target_res.position.y, stop_event)
            if stop_event.is_set():
                break

            # 2. REQUEST RESOURCE (Process enters WAITING)
            start_wait_time = time.time()
            with self.lock:
                robot = self.robots.get(robot_id)
                if robot:
                    robot.state = RobotState.WAITING
                    robot.waiting_for_resource = target_res_id
                    robot.waiting_since = start_wait_time
            
            self.resource_manager.record_waiting(target_res_id, robot_id)
            self.deadlock_manager.record_request(robot_id, target_res_id)
            self.task_manager.update_task_status(task.id, TaskStatus.WAITING)

            self.log_event(
                EventType.RESOURCE_REQUEST,
                message=f"Robot {robot_id} (Priority {robot.priority}) requested resource {target_res_id}",
                robot_id=robot_id,
                resource_id=target_res_id
            )

            # ACQUIRE VIA SYNCHRONIZATION PRIMITIVE
            # Genuine lock/semaphore wait or direct No-Sync access
            acquired, conflict_msg = self.sync_manager.acquire_resource(
                resource_id=target_res_id,
                robot_id=robot_id,
                priority=robot.priority
            )

            if stop_event.is_set():
                self.sync_manager.release_resource(target_res_id, robot_id)
                break

            wait_duration = time.time() - start_wait_time
            is_conflict = conflict_msg is not None

            # 3. CRITICAL SECTION (Process enters RUNNING)
            with self.lock:
                robot = self.robots.get(robot_id)
                if robot:
                    robot.state = RobotState.RUNNING
                    robot.waiting_for_resource = None
                    robot.waiting_since = None
                    robot.total_wait_time += wait_duration
                    robot.resource_id = target_res_id
                    robot.in_critical_section = True
                    robot.conflict_detected = is_conflict
                    # Reset aging if priority was elevated
                    robot.priority = robot.base_priority
                    robot.aging_level = 0

            self.resource_manager.record_enter(target_res_id, robot_id, is_conflict=is_conflict)
            self.deadlock_manager.record_allocation(robot_id, target_res_id)
            self.starvation_manager.clear_robot(robot_id)
            self.task_manager.update_task_status(task.id, TaskStatus.RUNNING)

            if is_conflict:
                self.metrics_manager.record_conflict()
                self.log_event(
                    EventType.RACE_CONDITION,
                    message=conflict_msg,
                    robot_id=robot_id,
                    resource_id=target_res_id
                )
            else:
                self.log_event(
                    EventType.RESOURCE_ACQUIRED,
                    message=f"Robot {robot_id} acquired {target_res_id} (waited {wait_duration:.1f}s)",
                    robot_id=robot_id,
                    resource_id=target_res_id
                )

            # EXECUTE IN CRITICAL SECTION (Simulation of work)
            steps = 20
            step_sleep = (task.duration / steps)
            exec_start = time.time()

            for step in range(steps):
                if stop_event.is_set():
                    break
                self.pause_event.wait()
                time.sleep(step_sleep)
                prog = round(((step + 1) / steps) * 100.0, 1)
                with self.lock:
                    if robot_id in self.robots:
                        self.robots[robot_id].task_progress = prog
                self.task_manager.update_task_status(task.id, TaskStatus.RUNNING, prog)

            exec_duration = time.time() - exec_start

            # 4. RELEASE RESOURCE (Critical Section Exit)
            self.sync_manager.release_resource(target_res_id, robot_id)
            self.resource_manager.record_leave(target_res_id, robot_id, usage_duration=exec_duration)
            self.deadlock_manager.record_release(robot_id, target_res_id)

            with self.lock:
                robot = self.robots.get(robot_id)
                if robot:
                    robot.state = RobotState.COMPLETED
                    robot.resource_id = None
                    robot.in_critical_section = False
                    robot.total_execution_time += exec_duration
                    # Battery consumption / recharge
                    if task.type == TaskType.CHARGE_ROBOT:
                        robot.battery = min(100.0, robot.battery + 30.0)
                    else:
                        robot.battery = max(10.0, robot.battery - random.uniform(3.0, 7.0))

            self.task_manager.update_task_status(task.id, TaskStatus.COMPLETED, 100.0)
            self.metrics_manager.record_task_completed(wait_duration, exec_duration)

            self.log_event(
                EventType.RESOURCE_RELEASED,
                message=f"Robot {robot_id} released {target_res_id}",
                robot_id=robot_id,
                resource_id=target_res_id
            )
            self.log_event(
                EventType.TASK_COMPLETED,
                message=f"Robot {robot_id} completed {task.type.value} ({exec_duration:.1f}s)",
                robot_id=robot_id
            )

            # Brief idle before next cycle
            time.sleep(random.uniform(0.5, 1.2) * speed_factor)

    def _move_robot_towards(self, robot_id: str, target_x: float, target_y: float, stop_event: threading.Event):
        """Smoothly interpolates robot position towards target"""
        steps = 10
        speed_factor = self.speed_multipliers.get(self.config.speed, 1.0)
        step_delay = (0.2 * speed_factor) / steps

        with self.lock:
            robot = self.robots.get(robot_id)
            if not robot:
                return
            start_x = robot.position.x
            start_y = robot.position.y
            robot.target_position = Position(x=target_x + 15, y=target_y + 15)

        for s in range(1, steps + 1):
            if stop_event.is_set():
                break
            alpha = s / steps
            with self.lock:
                robot = self.robots.get(robot_id)
                if robot:
                    robot.position.x = start_x + (target_x + 15 - start_x) * alpha
                    robot.position.y = start_y + (target_y + 15 - start_y) * alpha
            time.sleep(step_delay)

    def _find_candidate_resource(self, res_type: str, forced_res_id: Optional[str] = None) -> Optional[ResourceModel]:
        if forced_res_id:
            return self.resource_manager.get_resource(forced_res_id)
        candidates = [r for r in self.resource_manager.get_all_resources() if r.type.value == res_type]
        if not candidates:
            all_res = self.resource_manager.get_all_resources()
            return random.choice(all_res) if all_res else None
        # Pick one with fewest users or at random
        candidates.sort(key=lambda r: len(r.active_users))
        return candidates[0]

    # -------------------------------------------------------------
    # Background Watchdog: Deadlock & Starvation Detection
    # -------------------------------------------------------------
    def _watchdog_worker(self):
        while not self.watchdog_stop.is_set():
            time.sleep(0.5)
            if self.status != SimulationStatus.RUNNING:
                continue

            # 1. Deadlock Detection (WFG cycle check)
            cycle = self.deadlock_manager.detect_deadlock()
            if cycle:
                self.metrics_manager.record_deadlock()
                # Mark robots in cycle as BLOCKED
                with self.lock:
                    for rid in cycle.robots:
                        if rid in self.robots:
                            self.robots[rid].state = RobotState.BLOCKED
                self.log_event(
                    EventType.DEADLOCK_DETECTED,
                    message=f"DEADLOCK DETECTED! Circular wait: {cycle.cycle_description}",
                    details={"cycle": cycle.model_dump()}
                )

            # 2. Starvation & Priority Aging Check
            now = time.time()
            with self.lock:
                robots_snapshot = list(self.robots.values())

            for r in robots_snapshot:
                if r.state == RobotState.WAITING and r.waiting_since:
                    wait_sec = now - r.waiting_since
                    is_starving, new_prio, alert_msg = self.starvation_manager.check_starvation_and_age(
                        robot_id=r.id,
                        current_wait_time=wait_sec,
                        current_priority=r.priority,
                        resource_id=r.waiting_for_resource or "unknown"
                    )
                    if is_starving:
                        self.metrics_manager.record_starvation()
                        if alert_msg:
                            self.log_event(
                                EventType.PRIORITY_AGING,
                                message=alert_msg,
                                robot_id=r.id,
                                resource_id=r.waiting_for_resource
                            )
                        if new_prio is not None:
                            with self.lock:
                                robot = self.robots.get(r.id)
                                if robot:
                                    robot.priority = new_prio
                                    robot.aging_level = max(0, new_prio - robot.base_priority)
                            if r.waiting_for_resource:
                                self.sync_manager.update_waiter_priority(r.waiting_for_resource, r.id, new_prio)

            # 3. Update Metrics Snapshot
            running_count = sum(1 for r in robots_snapshot if r.state == RobotState.RUNNING)
            waiting_count = sum(1 for r in robots_snapshot if r.state == RobotState.WAITING)
            blocked_count = sum(1 for r in robots_snapshot if r.state == RobotState.BLOCKED)
            self.metrics_manager.update_snapshot(
                running_count=running_count,
                waiting_count=waiting_count,
                blocked_count=blocked_count,
                resources=self.resource_manager.get_all_resources()
            )

    # -------------------------------------------------------------
    # DEMO ACTIONS & CONTROLS
    # -------------------------------------------------------------
    def trigger_race_condition(self):
        """
        Launches concurrent requests to a single-capacity resource simultaneously.
        With No Synchronization: Demonstrates multiple robots crashing/entering same resource.
        With Mutex/Semaphore: Demonstrates serialized safe entry.
        """
        # Pick single-capacity resource
        target_res = "NC-01"
        self.log_event(
            EventType.SYSTEM_INFO,
            message=f"TRIGGERED RACE CONDITION DEMO on {target_res} with active technique: {self.config.technique.value}"
        )
        # Choose 3 robots
        candidate_ids = list(self.robots.keys())[:3]
        for cid in candidate_ids:
            with self.lock:
                if cid in self.robots:
                    self.robots[cid].target_position = Position(x=320, y=220)

    def trigger_deadlock_scenario(self):
        """
        Creates a controlled, classic OS circular wait between R01 and R02:
        R01 holds Corridor (NC-01) and requests Loading Bay (LB-01).
        R02 holds Loading Bay (LB-01) and requests Corridor (NC-01).
        """
        with self.lock:
            if "R01" not in self.robots or "R02" not in self.robots:
                return

            self.log_event(
                EventType.SYSTEM_INFO,
                message="TRIGGERED CONTROLLED DEADLOCK SCENARIO (R01 holds NC-01 waits LB-01; R02 holds LB-01 waits NC-01)"
            )

            # Setup R01
            r01 = self.robots["R01"]
            r01.state = RobotState.BLOCKED
            r01.resource_id = "NC-01"
            r01.waiting_for_resource = "LB-01"
            self.resource_manager.record_enter("NC-01", "R01")
            self.resource_manager.record_waiting("LB-01", "R01")
            self.deadlock_manager.record_allocation("R01", "NC-01")
            self.deadlock_manager.record_request("R01", "LB-01")

            # Setup R02
            r02 = self.robots["R02"]
            r02.state = RobotState.BLOCKED
            r02.resource_id = "LB-01"
            r02.waiting_for_resource = "NC-01"
            self.resource_manager.record_enter("LB-01", "R02")
            self.resource_manager.record_waiting("NC-01", "R02")
            self.deadlock_manager.record_allocation("R02", "LB-01")
            self.deadlock_manager.record_request("R02", "NC-01")

            # Force immediate cycle check
            cycle = self.deadlock_manager.detect_deadlock()
            if cycle:
                self.metrics_manager.record_deadlock()
                self.log_event(
                    EventType.DEADLOCK_DETECTED,
                    message=f"DEADLOCK DETECTED! Circular wait: {cycle.cycle_description}",
                    details={"cycle": cycle.model_dump()}
                )

    def recover_deadlock(self) -> Dict[str, Any]:
        """
        Executes Deadlock Recovery:
        1. Identifies cycle.
        2. Selects victim robot (e.g. lowest priority or fewer resources).
        3. Preempts victim: releases its held resource.
        4. Wakes waiting process.
        5. Logs each recovery phase.
        """
        with self.lock:
            cycle = self.deadlock_manager.detect_deadlock()
            if not cycle and self.deadlock_manager.active_deadlocks:
                cycle = self.deadlock_manager.active_deadlocks[0]

            if not cycle:
                return {"success": False, "message": "No active deadlock detected to recover."}

            prio_map = {rid: self.robots[rid].priority for rid in self.robots}
            victim, preempt_res = self.deadlock_manager.select_victim(cycle, prio_map)

            # Step 1: Preempt victim
            self.log_event(
                EventType.DEADLOCK_RECOVERED,
                message=f"RECOVERY STEP 1: Victim selected -> Robot {victim} (Priority {prio_map.get(victim, 3)})"
            )

            # Step 2: Release victim's resource
            self.sync_manager.force_preempt(preempt_res, victim)
            self.resource_manager.record_leave(preempt_res, victim)
            self.deadlock_manager.record_release(victim, preempt_res)

            # Reset victim state back to READY
            if victim in self.robots:
                self.robots[victim].state = RobotState.READY
                self.robots[victim].resource_id = None
                self.robots[victim].waiting_for_resource = None

            # Step 3: Unblock other process
            remaining_robots = [r for r in cycle.robots if r != victim]
            beneficiary = remaining_robots[0] if remaining_robots else None

            if beneficiary and beneficiary in self.robots:
                self.robots[beneficiary].state = RobotState.RUNNING
                self.robots[beneficiary].waiting_for_resource = None
                self.resource_manager.remove_from_waiting(preempt_res, beneficiary)
                self.resource_manager.record_enter(preempt_res, beneficiary)
                self.deadlock_manager.record_allocation(beneficiary, preempt_res)

            self.deadlock_manager.record_resolution()
            self.metrics_manager.record_deadlock_resolved()

            recovery_info = {
                "success": True,
                "victim": victim,
                "preempted_resource": preempt_res,
                "beneficiary": beneficiary,
                "message": f"Deadlock recovered successfully by preempting victim {victim} from {preempt_res}."
            }

            self.log_event(
                EventType.DEADLOCK_RECOVERED,
                message=recovery_info["message"],
                details=recovery_info
            )
            return recovery_info

    def trigger_starvation_scenario(self):
        """
        Creates a scenario where a low-priority robot R05 is kept waiting while
        higher-priority robots (R01, R02) repeatedly acquire a bottleneck resource.
        """
        with self.lock:
            # Set R05 to Low priority and start wait clock artificially
            target_rid = "R05" if "R05" in self.robots else list(self.robots.keys())[-1]
            robot = self.robots.get(target_rid)
            if robot:
                robot.priority = 1
                robot.base_priority = 1
                robot.state = RobotState.WAITING
                robot.waiting_for_resource = "NC-01"
                robot.waiting_since = time.time() - (self.config.starvation_threshold + 2.0)
                self.resource_manager.record_waiting("NC-01", target_rid)

            self.log_event(
                EventType.STARVATION_WARNING,
                message=f"TRIGGERED STARVATION TEST: Robot {target_rid} (Priority 1) set to long wait time. Watch Priority Aging elevate it!"
            )

    # -------------------------------------------------------------
    # SNAPSHOT / STATE EXPORT
    # -------------------------------------------------------------
    def get_full_state(self) -> Dict[str, Any]:
        with self.lock:
            robots_list = [r.model_dump() for r in self.robots.values()]
            resources_list = [r.model_dump() for r in self.resource_manager.get_all_resources()]
            tasks_list = [t.model_dump() for t in self.task_manager.get_all_tasks()[-20:]]
            metrics = self.metrics_manager.get_metrics().model_dump()
            history = self.metrics_manager.get_history()
            recent_events = [e.model_dump() for e in self.event_log[-35:]]
            deadlocks = [d.model_dump() for d in self.deadlock_manager.active_deadlocks]
            starvations = [s.model_dump() for s in self.starvation_manager.get_active_alerts()]
            wfg_graph = self.deadlock_manager.get_wfg_graph()

            # Primitive lock details
            sync_details = {}
            for res_id in self.resource_manager.get_resource_capacities_dict().keys():
                prim = self.sync_manager.get_primitive(res_id)
                if prim:
                    sync_details[res_id] = {
                        "active_holders": prim.get_active_holders(),
                        "waiters": prim.get_waiting_robot_ids(),
                        "capacity": prim.capacity,
                        "conflict_count": prim.conflict_count
                    }

            return {
                "status": self.status.value,
                "config": self.config.model_dump(),
                "robots": robots_list,
                "resources": resources_list,
                "tasks": tasks_list,
                "metrics": metrics,
                "history": history,
                "events": recent_events,
                "deadlocks": deadlocks,
                "starvations": starvations,
                "sync_details": sync_details,
                "wfg_graph": wfg_graph
            }
