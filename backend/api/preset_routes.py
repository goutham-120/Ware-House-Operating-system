from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List
from backend.models.simulation import SimulationConfig, SyncTechnique, ResourceCapacityConfig, SimulationSpeed

router = APIRouter(prefix="/presets", tags=["presets"])

engine = None

def set_engine(sim_engine):
    global engine
    engine = sim_engine

PRESETS: Dict[str, Dict[str, Any]] = {
    "normal": {
        "id": "normal",
        "name": "1. Normal Warehouse",
        "description": "Balanced workload with 5 robots, diverse tasks, moderate capacities, and Mutex protection.",
        "config": SimulationConfig(
            robot_count=5,
            technique=SyncTechnique.MUTEX,
            speed=SimulationSpeed.NORMAL,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=2,
                loading_bays=2,
                narrow_corridors=2,
                storage_zones=2
            ),
            selected_tasks=["Pick Item", "Transport Item", "Move to Storage", "Load Item", "Unload Item", "Charge Robot"],
            starvation_threshold=8.0,
            aging_enabled=True
        )
    },
    "race_condition": {
        "id": "race_condition",
        "name": "2. Race Condition Demo",
        "description": "5 robots competing for a single-capacity Corridor with NO SYNCHRONIZATION. Watch unsafe simultaneous access and conflicts occur!",
        "config": SimulationConfig(
            robot_count=5,
            technique=SyncTechnique.NO_SYNCHRONIZATION,
            speed=SimulationSpeed.NORMAL,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=1,
                loading_bays=1,
                narrow_corridors=1,
                storage_zones=1
            ),
            selected_tasks=["Transport Item"],
            starvation_threshold=10.0,
            aging_enabled=False
        )
    },
    "mutex_demo": {
        "id": "mutex_demo",
        "name": "3. Mutex / Lock Demo",
        "description": "Same high-contention workload as Race Condition, but protected by Mutex. Mutual exclusion is enforced; robots serialize safely.",
        "config": SimulationConfig(
            robot_count=5,
            technique=SyncTechnique.MUTEX,
            speed=SimulationSpeed.NORMAL,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=1,
                loading_bays=1,
                narrow_corridors=1,
                storage_zones=1
            ),
            selected_tasks=["Transport Item"],
            starvation_threshold=10.0,
            aging_enabled=True
        )
    },
    "semaphore_demo": {
        "id": "semaphore_demo",
        "name": "4. Semaphore Demo",
        "description": "Counting Semaphore with capacity=2 on Narrow Corridors and Storage. Exactly 2 robots enter simultaneously, 3rd robot waits.",
        "config": SimulationConfig(
            robot_count=6,
            technique=SyncTechnique.SEMAPHORE,
            speed=SimulationSpeed.NORMAL,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=2,
                loading_bays=1,
                narrow_corridors=2,
                storage_zones=2
            ),
            selected_tasks=["Transport Item", "Move to Storage"],
            starvation_threshold=8.0,
            aging_enabled=True
        )
    },
    "deadlock_demo": {
        "id": "deadlock_demo",
        "name": "5. Deadlock Demo",
        "description": "Creates classic Resource Allocation Graph circular wait (R01 holds Corridor waits for Bay; R02 holds Bay waits for Corridor).",
        "config": SimulationConfig(
            robot_count=3,
            technique=SyncTechnique.MUTEX,
            speed=SimulationSpeed.NORMAL,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=1,
                loading_bays=1,
                narrow_corridors=1,
                storage_zones=1
            ),
            selected_tasks=["Transport Item", "Load Item"],
            starvation_threshold=15.0,
            aging_enabled=False
        )
    },
    "starvation_demo": {
        "id": "starvation_demo",
        "name": "6. Starvation & Priority Aging Demo",
        "description": "Demonstrates starvation of Low-Priority processes and how Priority Aging elevates their priority to grant resource access.",
        "config": SimulationConfig(
            robot_count=5,
            technique=SyncTechnique.MUTEX,
            speed=SimulationSpeed.NORMAL,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=1,
                loading_bays=1,
                narrow_corridors=1,
                storage_zones=1
            ),
            selected_tasks=["Transport Item"],
            starvation_threshold=5.0,
            aging_interval=2.5,
            aging_enabled=True
        )
    },
    "high_contention": {
        "id": "high_contention",
        "name": "7. High Contention",
        "description": "Stress test with 10 robots competing heavily for limited bottleneck resources. Evaluates queue lengths and synchronization overhead.",
        "config": SimulationConfig(
            robot_count=10,
            technique=SyncTechnique.MUTEX_AND_SEMAPHORE,
            speed=SimulationSpeed.FAST,
            resource_capacities=ResourceCapacityConfig(
                charging_stations=2,
                loading_bays=1,
                narrow_corridors=2,
                storage_zones=2
            ),
            selected_tasks=["Pick Item", "Transport Item", "Load Item", "Charge Robot"],
            starvation_threshold=7.0,
            aging_enabled=True
        )
    }
}

@router.get("")
async def get_presets():
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "description": p["description"],
            "config": p["config"].model_dump()
        }
        for p in PRESETS.values()
    ]

@router.post("/{preset_id}/load")
async def load_preset(preset_id: str):
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    preset = PRESETS.get(preset_id)
    if not preset:
        raise HTTPException(status_code=404, detail="Preset not found")
    
    engine.configure(preset["config"])
    return {
        "success": True,
        "preset_id": preset_id,
        "name": preset["name"],
        "message": f"Loaded preset '{preset['name']}'"
    }
