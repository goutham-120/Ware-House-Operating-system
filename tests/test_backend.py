import pytest
import time
import threading
from backend.models.simulation import SyncTechnique, SimulationConfig, ResourceCapacityConfig
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
