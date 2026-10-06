from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, Optional
from backend.models.simulation import SimulationConfig, SimulationSpeed

router = APIRouter(prefix="/simulation", tags=["simulation"])

# Engine singleton instance will be provided by main.py
engine = None

def set_engine(sim_engine):
    global engine
    engine = sim_engine

@router.get("/state")
async def get_state():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    return engine.get_full_state()

@router.post("/configure")
async def configure_simulation(config: SimulationConfig):
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.configure(config)
    return {"success": True, "message": "Simulation configured successfully"}

@router.post("/start")
async def start_simulation():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.start()
    return {"success": True, "message": "Simulation started"}

@router.post("/pause")
async def pause_simulation():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.pause()
    return {"success": True, "message": "Simulation paused"}

@router.post("/resume")
async def resume_simulation():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.resume()
    return {"success": True, "message": "Simulation resumed"}

@router.post("/reset")
async def reset_simulation():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.reset()
    return {"success": True, "message": "Simulation reset successfully"}

class SpeedPayload(BaseModel):
    speed: SimulationSpeed

@router.post("/speed")
async def set_speed(payload: SpeedPayload):
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.set_speed(payload.speed)
    return {"success": True, "speed": payload.speed.value}

@router.post("/trigger/race-condition")
async def trigger_race_condition():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.trigger_race_condition()
    return {"success": True, "message": "Race condition triggered"}

@router.post("/trigger/deadlock")
async def trigger_deadlock():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.trigger_deadlock_scenario()
    return {"success": True, "message": "Deadlock scenario triggered"}

@router.post("/recover/deadlock")
async def recover_deadlock():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    result = engine.recover_deadlock()
    return result

@router.post("/trigger/starvation")
async def trigger_starvation():
    if not engine:
        raise HTTPException(status_code=500, detail="Engine not initialized")
    engine.trigger_starvation_scenario()
    return {"success": True, "message": "Starvation scenario triggered"}
