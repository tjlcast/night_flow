from fastapi import APIRouter, HTTPException, Request
from models import Node
from utils import nodes_db, WebSocketManager
from typing import List

router = APIRouter(prefix="/api/nodes", tags=["nodes"])


@router.get("/", response_model=List[Node])
async def list_nodes():
    return nodes_db


@router.get("/{node_id}", response_model=Node)
async def get_node(node_id: int):
    node = next((n for n in nodes_db if n.id == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")
    return node


@router.put("/{node_id}/offline")
async def set_node_offline(
    node_id: int,
    request: Request
):
    node = next((n for n in nodes_db if n.id == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    node.online = False

    # 广播节点下线通知
    websocket_manager = request.app.state.websocket_manager
    await websocket_manager.broadcast({
        "type": "node_offline",
        "payload": {"id": node_id}
    })

    return {"success": True, "message": "Node set to offline"}


@router.put("/{node_id}/online")
async def set_node_online(
    node_id: int,
    request: Request
):
    node = next((n for n in nodes_db if n.id == node_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Node not found")

    node.online = True

    # 广播节点上线通知
    websocket_manager = request.app.state.websocket_manager
    await websocket_manager.broadcast({
        "type": "node_online",
        "payload": {"id": node_id}
    })

    return {"success": True, "message": "Node set to online"}


@router.delete("/{node_id}")
async def delete_node(
    node_id: int,
    request: Request
):
    global nodes_db
    node_index = next((i for i, n in enumerate(
        nodes_db) if n.id == node_id), None)
    if node_index is None:
        raise HTTPException(status_code=404, detail="Node not found")

    deleted_node = nodes_db.pop(node_index)

    # 广播节点删除通知
    websocket_manager = request.app.state.websocket_manager
    await websocket_manager.broadcast({
        "type": "node_deleted",
        "payload": {"id": node_id}
    })

    return {"success": True, "message": "Node deleted successfully"}
