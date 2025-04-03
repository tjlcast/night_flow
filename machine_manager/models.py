from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from datetime import datetime

class Task(BaseModel):
    id: int
    name: str
    status: str  # "running", "completed", "failed"

class CPUInfo(BaseModel):
    usage: float
    cores: int

class MemoryInfo(BaseModel):
    used: float  # GB
    total: float  # GB

class DiskInfo(BaseModel):
    used: float  # GB
    total: float  # GB

class Node(BaseModel):
    id: int
    name: str
    online: bool
    ip: str
    port: Optional[int] = None
    cpu: CPUInfo
    memory: MemoryInfo
    disk: DiskInfo
    tasks: List[Task] = []
    last_heartbeat: Optional[datetime] = None
    metrics: Optional[Dict[str, Any]] = None

class WorkerRegisterRequest(BaseModel):
    name: Optional[str] = None
    ip: str
    port: Optional[int] = None
    cpu_cores: Optional[int] = 4
    memory_gb: Optional[float] = 8
    disk_gb: Optional[float] = 100

class HeartbeatRequest(BaseModel):
    tasks: Optional[List[Task]] = None
    cpu: Optional[Dict[str, float]] = None
    memory: Optional[Dict[str, float]] = None
    disk: Optional[List[Dict[str, float]]] = None

class MetricsRequest(BaseModel):
    cpu: Dict[str, float]
    memory: Dict[str, float]
    disk: List[Dict[str, float]]
