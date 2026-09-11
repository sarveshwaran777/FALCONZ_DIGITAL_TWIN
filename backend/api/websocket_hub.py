import json
import logging
from typing import List, Set
from fastapi import WebSocket, WebSocketDisconnect
from backend.telemetry.schema import FullSystemState

logger = logging.getLogger(__name__)

class WebSocketHub:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        try:
            # Enable TCP_NODELAY on the underlying socket to prevent Nagle buffering
            raw_transport = websocket.scope.get("transport")
            if raw_transport:
                sock = raw_transport.get_extra_info("socket")
                if sock:
                    import socket
                    sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
        except Exception:
            pass
        self.active_connections.add(websocket)
        logger.info(f"WebSocket client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total clients: {len(self.active_connections)}")

    async def broadcast_state(self, state: FullSystemState):
        if not self.active_connections:
            return

        payload = state.model_dump_json()
        dead_connections = []

        for connection in list(self.active_connections):
            try:
                await connection.send_text(payload)
            except Exception as e:
                dead_connections.append(connection)

        for dead in dead_connections:
            self.disconnect(dead)

websocket_hub = WebSocketHub()
