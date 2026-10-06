import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from backend.core.simulation_engine import SimulationEngine
from backend.websocket.manager import connection_manager
from backend.api.simulation_routes import router as simulation_router, set_engine as set_sim_engine
from backend.api.preset_routes import router as preset_router, set_engine as set_preset_engine
from backend.api.experiment_routes import router as experiment_router, set_engine as set_exp_engine

# Initialize core simulation engine
engine = SimulationEngine()
set_sim_engine(engine)
set_preset_engine(engine)
set_exp_engine(engine)

# Background task for broadcasting live state to WebSocket clients
broadcast_task = None

async def state_broadcaster():
    """Broadcasts simulation snapshots to all connected WebSockets at ~10Hz"""
    while True:
        try:
            if connection_manager.active_connections:
                state = engine.get_full_state()
                await connection_manager.broadcast_json({
                    "type": "state_update",
                    "data": state
                })
            await asyncio.sleep(0.1)  # 100ms broadcast interval
        except asyncio.CancelledError:
            break
        except Exception as e:
            await asyncio.sleep(0.2)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    global broadcast_task
    broadcast_task = asyncio.create_task(state_broadcaster())
    yield
    # Shutdown
    if broadcast_task:
        broadcast_task.cancel()
    engine.reset()

app = FastAPI(
    title="Warehouse Operating System",
    description="Concurrent Robot Coordination and Process Synchronization API",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API routers
app.include_router(simulation_router)
app.include_router(preset_router)
app.include_router(experiment_router)

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "service": "Warehouse OS Simulation Backend",
        "simulation_status": engine.status.value,
        "robots_count": len(engine.robots),
        "technique": engine.config.technique.value
    }

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    try:
        # Send initial state immediately upon connection
        initial_state = engine.get_full_state()
        await websocket.send_json({
            "type": "state_update",
            "data": initial_state
        })
        
        while True:
            # Keep connection alive & listen for potential incoming commands from client
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception:
        connection_manager.disconnect(websocket)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
