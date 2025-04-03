from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from routers import nodes, workers
from utils import WebSocketManager, simulate_realtime_updates, start_heartbeat_checker
import uvicorn
import asyncio
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时
    websocket_manager = WebSocketManager()
    app.state.websocket_manager = websocket_manager
    
    # 启动后台任务
    asyncio.create_task(simulate_realtime_updates(websocket_manager))
    asyncio.create_task(start_heartbeat_checker(websocket_manager))
    
    yield
    
    # 关闭时
    # 可以在这里添加清理代码

app = FastAPI(lifespan=lifespan)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

# 包含路由
app.include_router(nodes.router)
app.include_router(workers.router)

@app.websocket("/ws/nodes")
async def websocket_endpoint(websocket: WebSocket):
    websocket_manager = websocket.app.state.websocket_manager
    await websocket_manager.connect(websocket)
    try:
        while True:
            # 保持连接打开
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=3000)