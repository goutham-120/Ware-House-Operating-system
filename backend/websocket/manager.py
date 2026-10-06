import asyncio
import json
from typing import List, Set
from fastapi import WebSocket

class ConnectionManager:
    """
    Manages active WebSocket client connections and broadcasts live simulation updates.
    """
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast_json(self, data: dict):
        if not self.active_connections:
            return
        dead_connections = set()
        text_data = json.dumps(data)
        for connection in self.active_connections:
            try:
                await connection.send_text(text_data)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)

connection_manager = ConnectionManager()
