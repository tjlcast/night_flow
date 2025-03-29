from fastapi import APIRouter, HTTPException, Request
from models import WorkerRegisterRequest, HeartbeatRequest, MetricsRequest
from utils import nodes_db, generate_id, Node
from datetime import datetime
from typing import Dict, Any

router = APIRouter(prefix="/api/v1/workers", tags=["workers"])


@router.post("/register")
async def register_worker(worker: WorkerRegisterRequest, request: Request):
    if not worker.ip:
        return {"error": "Missing required fields"}

    # 创建新节点
    new_node = {
        "id": generate_id(),
        "name": worker.name or f"Worker-{generate_id()}",
        "online": True,
        "ip": worker.ip,
        "port": worker.port,
        "cpu": {"usage": 0, "cores": worker.cpu_cores or 4},
        "memory": {"used": 0, "total": worker.memory_gb or 8},
        "disk": {"used": 0, "total": worker.disk_gb or 100},
        "tasks": [],
        "last_heartbeat": datetime.now(),
        "metrics": None,
    }
    new_node_obj = Node(
        id=new_node["id"],
        name=new_node["name"],
        online=new_node["online"],
        ip=new_node["ip"],
        port=new_node["port"],
        cpu=new_node["cpu"],
        memory=new_node["memory"],
        disk=new_node["disk"],
        tasks=new_node["tasks"],
        last_heartbeat=new_node["last_heartbeat"],
        metrics=new_node["metrics"]
    )

    nodes_db.append(new_node_obj)
    print(f"Worker registered: {new_node['name']} (ID: {new_node['id']})")

    # 广播节点添加通知
    websocket_manager = request.app.state.websocket_manager
    await websocket_manager.broadcast({
        "type": "node_update",
        "payload": new_node
    })

    return {
        "worker_id": new_node["id"],
        "status": "registered",
        "heartbeat_interval": 30000,  # 30秒心跳间隔
    }


@router.post("/{worker_id}/heartbeat")
async def receive_heartbeat(worker_id: int, request: Request):
    jr = await request.json()
    heartbeat = HeartbeatRequest()
    heartbeat.tasks = jr.get("tasks")
    heartbeat.cpu = jr.get("cpu")
    heartbeat.memory = jr.get("memory")
    heartbeat.disk = jr.get("disk")
    node = next((n for n in nodes_db if n.id == worker_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Worker not found")

    # 更新最后心跳时间和状态
    node.last_heartbeat = datetime.now()
    node.online = True

    # 更新任务状态
    if heartbeat.tasks:
        node.tasks = heartbeat.tasks

    # 更新指标数据
    if heartbeat.cpu:
        node.cpu.usage = heartbeat.cpu.get("usage_percent", node.cpu.usage)

    if heartbeat.memory:
        node.memory.used = heartbeat.memory.get(
            "used", node.memory.used) / (1024 ** 3)  # 转换为GB

    if heartbeat.disk:
        node.disk.used = heartbeat.disk.get(
            "used", node.disk.used) / (1024 ** 3)  # 转换为GB

    print(f"Heartbeat received from {worker_id}")

    # 广播节点添加通知
    websocket_manager = request.app.state.websocket_manager
    await websocket_manager.broadcast({
        "type": "node_update",
        "payload": node.model_dump()
    })

    return {
        "status": "ok",
        "next_heartbeat_interval": 30000,
    }


@router.post("/{worker_id}/metrics")
async def receive_metrics(worker_id: int, metrics: MetricsRequest):
    node = next((n for n in nodes_db if n.id == worker_id), None)
    if not node:
        raise HTTPException(status_code=404, detail="Worker not found")

    # 更新指标数据
    node.cpu.usage = metrics.cpu.get("usage_percent", node.cpu.usage)
    node.memory.used = metrics.memory.get(
        "used", node.memory.used) / (1024 ** 3)  # 转换为GB
    node.disk.used = metrics.disk[0].get(
        "used", node.disk.used) / (1024 ** 3) if metrics.disk else 0  # 转换为GB

    print(f"Metrics updated for {worker_id}")

    return {"status": "ok"}
