from collections import deque
from workflow import Workflow
import asyncio
import json
from concurrent.futures import ThreadPoolExecutor
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, WebSocket
from threading import Event
from fastapi.responses import HTMLResponse

# 原有工作流相关代码保持不变，此处省略...
# （将用户提供的所有类定义放在这里）

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Content-Type"],
)

executor = ThreadPoolExecutor()

# 示例工作流配置
example_workflow = {
    "nodes": [
        {
            "id": "1",
            "type": "input",
            "data": {
                "type": "input",
                "label": "开始节点",
                "action": "接收输入",
                "description": "工作流开始节点"
            }
        },
        {
            "id": "2",
            "type": "transform",
            "data": {
                "type": "transform",
                "label": "数据转换",
                "action": "转换数据格式",
                "description": "数据格式转换节点"
            }
        },
        {
            "id": "3",
            "type": "conditional",
            "data": {
                "type": "conditional",
                "label": "条件判断",
                "action": "根据条件路由",
                "description": "条件判断节点",
                "condition": True
            }
        },
        {
            "id": "4",
            "type": "output",
            "data": {
                "type": "output",
                "label": "输出结果",
                "action": "保存结果",
                "description": "工作流结束节点"
            }
        }
    ],
    "edges": [
        {"source": "1", "target": "2", "sourceHandle": None},
        {"source": "2", "target": "3", "sourceHandle": None},
        {"source": "3", "target": "4", "sourceHandle": "true"}
    ]
}


class StoppableWorkflow(Workflow):
    def __init__(self, *args, **kwargs):
        super().__init__(*args,  **kwargs)
        self.stop_event = Event()

    def execute(self, on_node_complete=None):
        if not self.start_node:
            return

        queue = deque([(self.start_node, None)])
        visited = set([self.start_node.id])

        while queue and not self.stop_event.is_set():
            current_node, current_input = queue.popleft()

            try:
                next_step_nodes = current_node.execute(
                    self.context, current_input)
                is_success = True
                error = None
            except Exception as e:
                self.context.record_execution(
                    current_node.id, "failed", current_input, {"error": str(e)})
                is_success = False
                error = str(e)
                next_step_nodes = []

            # 获取执行结果
            node_history = self.context.get_node_history(current_node.id)
            output = node_history.get('output') if node_history else None

            # 触发回调
            if on_node_complete:
                on_node_complete(current_node.id, is_success,
                                 current_input, output, error)

            # 处理后续节点
            for next_node in next_step_nodes:
                if next_node and next_node.id not in visited:
                    queue.append((next_node, self.context.current_data))
                    visited.add(next_node.id)


@app.websocket("/workflow/runtime/{workflow_id}")
async def websocket_endpoint(websocket: WebSocket, workflow_id: str):
    await websocket.accept()

    # # 创建可停止的工作流实例
    # # 读取JSON文件
    # with open('workflow.json', 'r', encoding='utf-8') as f:
    #     workflow_data = json.load(f)
    data = await websocket.receive_json()
    workflow_data = json.loads(data)

    workflow = StoppableWorkflow(workflow_data)
    loop = asyncio.get_event_loop()
    queue = asyncio.Queue()

    def on_node_complete(node_id, is_success, input, output, error):
        message = {
            "input": json.dumps(input),
            "isSuccess": is_success,
            "nodeId": node_id,
            "output": output
        }
        if error:
            message["error"] = error
        asyncio.run_coroutine_threadsafe(queue.put(message), loop)

    # 在后台线程中执行工作流
    def run_workflow():
        try:
            workflow.execute(on_node_complete)
        finally:
            asyncio.run_coroutine_threadsafe(queue.put(None), loop)  # 结束信号

    future = loop.run_in_executor(executor, run_workflow)

    try:
        while True:
            message = await queue.get()
            if message is None:
                break
            await websocket.send_json(message)
    except Exception as e:
        print(f"连接异常: {e}")
    finally:
        workflow.stop_event.set()
        future.cancel()
        await websocket.close()


@app.get("/")
async def get():
    return HTMLResponse("""
    <html>
        <head>
            <title>Workflow WebSocket Test</title>
        </head>
        <body>
            <script>
                const ws = new WebSocket('ws://localhost:8000/workflow/runtime/1');
                ws.onmessage = event => {
                    const pre = document.createElement('pre');
                    pre.textContent = JSON.stringify(JSON.parse(event.data), null, 2);
                    document.body.appendChild(pre);
                };
            </script>
            <h1>Workflow WebSocket Test</h1>
        </body>
    </html>
    """)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
