from typing import List, Dict, Any
from models import *
from fastapi import WebSocket
import asyncio
import random
from datetime import datetime


class WebSocketManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: Dict[str, Any]):
        if "last_heartbeat" in message["payload"] and isinstance(message["payload"]["last_heartbeat"], datetime):
            message["payload"]["last_heartbeat"] = str(
                int(message["payload"]["last_heartbeat"].timestamp()))
        for connection in self.active_connections:
            await connection.send_json(message)


# 模拟数据库
nodes_db: List[Node] = [
    Node(
        id=1,
        name="Web服务器-01",
        online=True,
        ip="192.168.1.101",
        cpu=CPUInfo(usage=65, cores=8),
        memory=MemoryInfo(used=12, total=16),
        disk=DiskInfo(used=120, total=256),
        tasks=[
            Task(id=101, name="Web服务", status="running"),
            Task(id=102, name="数据库同步", status="running"),
            Task(id=103, name="日志清理", status="completed"),
        ],
    ),
    Node(
        id=2,
        name="数据库服务器-02",
        online=True,
        ip="192.168.1.102",
        cpu=CPUInfo(usage=45, cores=16),
        memory=MemoryInfo(used=32, total=64),
        disk=DiskInfo(used=512, total=1024),
        tasks=[
            Task(id=201, name="主数据库", status="running"),
            Task(id=202, name="备份任务", status="completed"),
        ],
    ),
    Node(
        id=3,
        name="缓存服务器-03",
        online=False,
        ip="192.168.1.103",
        cpu=CPUInfo(usage=0, cores=4),
        memory=MemoryInfo(used=0, total=8),
        disk=DiskInfo(used=5, total=50),
        tasks=[],
    ),
    Node(
        id=4,
        name="应用服务器-04",
        online=True,
        ip="192.168.1.104",
        cpu=CPUInfo(usage=78, cores=8),
        memory=MemoryInfo(used=14, total=16),
        disk=DiskInfo(used=80, total=200),
        tasks=[
            Task(id=401, name="应用服务A", status="running"),
            Task(id=402, name="应用服务B", status="failed"),
            Task(id=403, name="定时任务", status="completed"),
        ],
    ),
]


def generate_id() -> int:
    if not nodes_db:
        return 1
    return max(node.id for node in nodes_db) + 1


async def simulate_realtime_updates(websocket_manager: WebSocketManager):
    while True:
        await asyncio.sleep(5)  # 每5秒更新一次
        print("Starting simulation of real-time updates...")

        for node in nodes_db:
            if node.name == "jialtang-surface":
                continue

            if node.online:
                # 模拟数据变化
                node.cpu.usage = max(
                    0, min(100, node.cpu.usage + (random.random() * 10 - 5)))
                node.memory.used = max(
                    0, min(node.memory.total, node.memory.used + (random.random() - 0.5)))
                node.disk.used = max(
                    0, min(node.disk.total, node.disk.used + (random.random() * 2 - 1)))

                # 随机改变任务状态
                if random.random() > 0.8 and node.tasks:
                    random_task_index = random.randint(0, len(node.tasks) - 1)
                    node.tasks[random_task_index].status = random.choice(
                        ["running", "completed", "failed"])

                # 广播更新
                await websocket_manager.broadcast({
                    "type": "node_update",
                    "payload": node.dict()
                })

        # 随机模拟节点上线/下线
        if random.random() > 0.9 and nodes_db:
            random_node_index = random.randint(0, len(nodes_db) - 1)
            nodes_db[random_node_index].online = not nodes_db[random_node_index].online

            await websocket_manager.broadcast({
                "type": "node_online" if nodes_db[random_node_index].online else "node_offline",
                "payload": nodes_db[random_node_index].dict() if nodes_db[random_node_index].online else {"id": nodes_db[random_node_index].id}
            })


async def start_heartbeat_checker(websocket_manager: WebSocketManager):
    check_interval = 30  # 心跳检查间隔（秒）
    while True:
        await asyncio.sleep(35)  # 每35秒检查一次

        now = datetime.now()
        for node in nodes_db:
            # 检查是否存在last_heartbeat字段
            has_no_heartbeat = node.last_heartbeat is None
            # 检查是否超时（30秒）
            is_timeout = node.last_heartbeat and (
                now - node.last_heartbeat).total_seconds() > 30

            if node.online and (has_no_heartbeat or is_timeout):
                node.online = False
                print(f"Worker {node.id} timed out")
                # 广播更新
                await websocket_manager.broadcast({
                    "type": "node_update",
                    "payload": node.dict()
                })
