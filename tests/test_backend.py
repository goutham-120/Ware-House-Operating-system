import pytest
import time
import threading
from backend.models.simulation import SyncTechnique, SimulationConfig, ResourceCapacityConfig, SimulationSpeed
from backend.core.synchronization_manager import SynchronizationManager, ResourceSyncPrimitive
from backend.core.deadlock_manager import DeadlockManager
from backend.core.starvation_manager import StarvationManager
from backend.core.simulation_engine import SimulationEngine

def test_no_synchronization_detects_race_conditions():
    """Verify that multiple threads accessing a single slot without synchronization produce conflicts"""
    primitive = ResourceSyncPrimitive("TEST-RES", capacity=1, technique=SyncTechnique.NO_SYNCHRONIZATION)
    
    # 2 robots enter
    acq1, conf1 = primitive.acquire("R01", priority=3)
    acq2, conf2 = primitive.acquire("R02", priority=3)
    
    assert acq1 is True
    assert acq2 is True
    assert conf2 is not None
    assert "RACE CONDITION DETECTED" in conf2
    assert primitive.conflict_count >= 1

def test_mutex_enforces_mutual_exclusion():
    """Verify that Mutex enforces single ownership and queues waiters"""
    primitive = ResourceSyncPrimitive("TEST-RES", capacity=1, technique=SyncTechnique.MUTEX)
    
    acq1, conf1 = primitive.acquire("R01", priority=3)
    assert acq1 is True
    assert conf1 is None
    assert primitive.active_holders == ["R01"]

    # In a separate thread, try to acquire with short timeout
    worker_acquired = False
    def try_acquire():
        nonlocal worker_acquired
        res, _ = primitive.acquire("R02", priority=3, timeout=0.1)
        worker_acquired = res

    t = threading.Thread(target=try_acquire)
    t.start()
    t.join()
    assert worker_acquired is False  # Timed out waiting because R01 holds it

    # Release by R01
    primitive.release("R01")
    assert len(primitive.active_holders) == 0

def test_semaphore_respects_capacity():
    """Verify that Semaphore permits up to capacity holders"""
    primitive = ResourceSyncPrimitive("TEST-SEMAPHORE", capacity=2, technique=SyncTechnique.SEMAPHORE)
    
    acq1, _ = primitive.acquire("R01", priority=3)
    acq2, _ = primitive.acquire("R02", priority=3)
    assert acq1 is True and acq2 is True
    assert len(primitive.active_holders) == 2

    # Third should timeout
    third_acquired = False
    def try_third():
        nonlocal third_acquired
        res, _ = primitive.acquire("R03", priority=3, timeout=0.1)
        third_acquired = res

    t = threading.Thread(target=try_third)
    t.start()
    t.join()
    assert third_acquired is False

    primitive.release("R01")
    assert len(primitive.active_holders) == 1

def test_deadlock_detection_and_recovery():
    """Verify cycle detection in Wait-For Graph and victim recovery"""
    dm = DeadlockManager()
    
    # R01 holds NC-01 and waits for LB-01
    dm.record_allocation("R01", "NC-01")
    dm.record_request("R01", "LB-01")

    # R02 holds LB-01 and waits for NC-01
    dm.record_allocation("R02", "LB-01")
    dm.record_request("R02", "NC-01")

    # Detect cycle
    cycle = dm.detect_deadlock()
    assert cycle is not None
    assert set(cycle.robots) == {"R01", "R02"}
    assert set(cycle.resources) == {"NC-01", "LB-01"}

    # Victim selection
    priorities = {"R01": 5, "R02": 3}
    victim, preempt_res = dm.select_victim(cycle, priorities)
    assert victim == "R02"  # Lower priority
    assert preempt_res == "LB-01"

def test_starvation_and_priority_aging():
    """Verify that prolonged waiting triggers starvation alert and priority aging"""
    sm = StarvationManager(starvation_threshold=2.0, aging_interval=1.0, aging_enabled=True)
    
    # Short wait time: no starvation
    is_starving, new_prio, _ = sm.check_starvation_and_age("R05", current_wait_time=0.5, current_priority=1, resource_id="NC-01")
    assert not is_starving
    assert new_prio is None

    # Prolonged wait time: starvation detected and aging kicks in
    is_starving, new_prio, msg = sm.check_starvation_and_age("R05", current_wait_time=3.0, current_priority=1, resource_id="NC-01")
    assert is_starving is True
    assert new_prio == 2
    assert "PRIORITY AGING" in msg

def test_simulation_engine_lifecycle():
    """Verify engine start, pause, resume, reset without error"""
    engine = SimulationEngine()
    engine.configure(SimulationConfig(robot_count=3, technique=SyncTechnique.MUTEX))
    assert len(engine.robots) == 3
    
    engine.start()
    time.sleep(0.5)
    assert engine.status.value == "RUNNING"
    
    engine.pause()
    assert engine.status.value == "PAUSED"
    
    engine.resume()
    assert engine.status.value == "RUNNING"
    
    engine.reset()
    assert engine.status.value == "IDLE"

def test_simulation_speed_hierarchy():
    """Verify that Fast mode runs faster than Normal, which runs faster than Slow (Slow < Normal < Fast)"""
    engine = SimulationEngine()
    
    # Fast: 0.35 factor
    fast_factor = engine.speed_multipliers[SimulationSpeed.FAST]
    normal_factor = engine.speed_multipliers[SimulationSpeed.NORMAL]
    slow_factor = engine.speed_multipliers[SimulationSpeed.SLOW]

    assert fast_factor < normal_factor < slow_factor
    assert fast_factor == 0.35
    assert normal_factor == 1.0
    assert slow_factor == 2.0

def test_simulation_speed_live_switching():
    """Verify that changing speed on a running engine updates configuration and scales step delays live"""
    engine = SimulationEngine()
    engine.configure(SimulationConfig(robot_count=2, technique=SyncTechnique.MUTEX, speed=SimulationSpeed.NORMAL))
    engine.start()
    
    assert engine.config.speed == SimulationSpeed.NORMAL
    
    # Live switch to FAST
    engine.set_speed(SimulationSpeed.FAST)
    assert engine.config.speed == SimulationSpeed.FAST
    
    # Live switch to SLOW
    engine.set_speed(SimulationSpeed.SLOW)
    assert engine.config.speed == SimulationSpeed.SLOW
    
    # Case-insensitive string support
    engine.set_speed("fast")
    assert engine.config.speed == SimulationSpeed.FAST
    
    engine.reset()
    assert engine.status.value == "IDLE"

def test_resource_occupancy_strict_current_not_cumulative():
    """
    Rigorously verifies that In Use count and active occupants:
    - Strictly reflect robots currently inside at this exact moment
    - Equal len(current_occupants)
    - Free = Capacity - In Use
    - Never accumulate across repeated historical entries/exits
    """
    from backend.models.robot import RobotState
    from backend.models.simulation import ResourceCapacityConfig

    engine = SimulationEngine()
    engine.configure(SimulationConfig(
        robot_count=4,
        technique=SyncTechnique.SEMAPHORE,
        resource_capacities=ResourceCapacityConfig(narrow_corridors=1)
    ))
    
    # Check NC-01 which has capacity 2
    nc = engine.resource_manager.get_resource("NC-01")
    assert nc is not None
    cap = nc.capacity
    assert cap == 2
    
    # 1. Initially empty
    state = engine.get_full_state()
    res_data = next(r for r in state["resources"] if r["id"] == "NC-01")
    assert len(res_data["active_users"]) == 0
    assert res_data["available_slots"] == 2
    assert state["sync_details"]["NC-01"]["active_holders"] == []

    # 2. R01 enters
    engine.robots["R01"].state = RobotState.RUNNING
    engine.robots["R01"].resource_id = "NC-01"
    state = engine.get_full_state()
    res_data = next(r for r in state["resources"] if r["id"] == "NC-01")
    assert res_data["active_users"] == ["R01"]
    assert len(res_data["active_users"]) == 1
    assert res_data["available_slots"] == 1
    assert state["sync_details"]["NC-01"]["active_holders"] == ["R01"]

    # 3. R02 enters while R01 is inside
    engine.robots["R02"].state = RobotState.RUNNING
    engine.robots["R02"].resource_id = "NC-01"
    state = engine.get_full_state()
    res_data = next(r for r in state["resources"] if r["id"] == "NC-01")
    assert set(res_data["active_users"]) == {"R01", "R02"}
    assert len(res_data["active_users"]) == 2
    assert res_data["available_slots"] == 0
    assert set(state["sync_details"]["NC-01"]["active_holders"]) == {"R01", "R02"}

    # 4. R01 leaves
    engine.robots["R01"].state = RobotState.COMPLETED
    engine.robots["R01"].resource_id = None
    state = engine.get_full_state()
    res_data = next(r for r in state["resources"] if r["id"] == "NC-01")
    assert res_data["active_users"] == ["R02"]
    assert len(res_data["active_users"]) == 1
    assert res_data["available_slots"] == 1
    assert state["sync_details"]["NC-01"]["active_holders"] == ["R02"]

    # 5. R03 enters
    engine.robots["R03"].state = RobotState.RUNNING
    engine.robots["R03"].resource_id = "NC-01"
    state = engine.get_full_state()
    res_data = next(r for r in state["resources"] if r["id"] == "NC-01")
    assert set(res_data["active_users"]) == {"R02", "R03"}
    assert len(res_data["active_users"]) == 2
    assert res_data["available_slots"] == 0

    # 6. Both R02 and R03 leave
    engine.robots["R02"].state = RobotState.READY
    engine.robots["R02"].resource_id = None
    engine.robots["R03"].state = RobotState.COMPLETED
    engine.robots["R03"].resource_id = None
    state = engine.get_full_state()
    res_data = next(r for r in state["resources"] if r["id"] == "NC-01")
    assert res_data["active_users"] == []
    assert len(res_data["active_users"]) == 0
    assert res_data["available_slots"] == 2

    # 7. Simulate 10 historical entry/exit cycles to prove count never accumulates
    for i in range(10):
        # R04 enters
        engine.robots["R04"].state = RobotState.RUNNING
        engine.robots["R04"].resource_id = "NC-01"
        s = engine.get_full_state()
        r_nc = next(r for r in s["resources"] if r["id"] == "NC-01")
        assert len(r_nc["active_users"]) == 1
        assert r_nc["available_slots"] == 1
        
        # R04 leaves
        engine.robots["R04"].state = RobotState.COMPLETED
        engine.robots["R04"].resource_id = None
        s = engine.get_full_state()
        r_nc = next(r for r in s["resources"] if r["id"] == "NC-01")
        assert len(r_nc["active_users"]) == 0
        assert r_nc["available_slots"] == 2
        assert s["sync_details"]["NC-01"]["active_holders"] == []
