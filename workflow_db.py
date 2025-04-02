from pydantic import BaseModel
from typing import List
from fastapi.responses import JSONResponse
from fastapi import APIRouter, HTTPException, Depends, Response
from contextlib import contextmanager
import sqlite3
import json
from datetime import datetime


@contextmanager
def workflow_db(db_path='workflows.db'):
    db = WorkflowDB(db_path)
    try:
        yield db
    finally:
        db.close()


class WorkflowDB:
    def __init__(self, db_path='workflows.db'):
        self.conn = sqlite3.connect(db_path)
        self.create_table()

    def create_table(self):
        """创建 workflow 表"""
        query = """
        CREATE TABLE IF NOT EXISTS workflows (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            config_json TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP,
            exported_at TIMESTAMP
        )
        """
        self.conn.execute(query)
        self.conn.commit()

    def insert_workflow(self, workflow):
        """插入新 workflow 并返回新增记录的自增ID"""
        query = """
        INSERT INTO workflows (name, config_json, updated_at, exported_at)
        VALUES (?, ?, ?, ?)
        """
        config_json = json.dumps(workflow['config'])
        cursor = self.conn.cursor()  # 获取游标对象

        cursor.execute(query, (
            workflow['name'],
            config_json,
            workflow['updatedAt'],
            workflow['config']['exportedAt']
        ))
        self.conn.commit()

        # 获取最后插入的自增ID
        new_id = cursor.lastrowid
        return new_id

    def get_workflow(self, id):
        """获取单个 workflow"""
        query = "SELECT * FROM workflows WHERE id = ?"
        cursor = self.conn.execute(query, (id,))
        row = cursor.fetchone()

        if row:
            return {
                'id': row[0],
                'name': row[1],
                'config': json.loads(row[2]),
                'created_at': row[3],
                'updated_at': row[4],
                'exported_at': row[5]
            }
        return None

    def get_all_workflows(self):
        """获取所有 workflows"""
        query = "SELECT * FROM workflows ORDER BY updated_at DESC"
        cursor = self.conn.execute(query)

        workflows = []
        for row in cursor:
            workflows.append({
                'id': row[0],
                'name': row[1],
                'config': json.loads(row[2]),
                'created_at': row[3],
                'updated_at': row[4],
                'exported_at': row[5]
            })
        return workflows

    def update_workflow(self, workflow):
        """更新 workflow"""
        query = """
        UPDATE workflows 
        SET name = ?, config_json = ?, updated_at = ?, exported_at = ?
        WHERE id = ?
        """
        config_json = json.dumps(workflow['config'])
        updated_at = datetime.now().isoformat()  # 更新为当前时间

        self.conn.execute(query, (
            workflow['name'],
            config_json,
            updated_at,
            workflow['config']['exportedAt'],
            workflow['id']
        ))
        self.conn.commit()

    def delete_workflow(self, id):
        """删除 workflow"""
        query = "DELETE FROM workflows WHERE id = ?"
        self.conn.execute(query, (id,))
        self.conn.commit()

    def close(self):
        """关闭数据库连接"""
        self.conn.close()

    def get_workflows_by_node_type(self, node_type):
        """查询包含特定类型节点的 workflows"""
        query = """
        SELECT * FROM workflows 
        WHERE json_extract(config_json, '$.nodes[*].data.type') LIKE ?
        """
        cursor = self.conn.execute(query, (f'%{node_type}%',))

        workflows = []
        for row in cursor:
            workflows.append({
                'id': row[0],
                'name': row[1],
                'config': json.loads(row[2]),
                'created_at': row[3],
                'updated_at': row[4],
                'exported_at': row[5]
            })
        return workflows


test_workflow_json = {
    "id": "2",
    "name": "Multiple LLMs",
    "updatedAt": "2023-05-15",
    "config": {
        "name": "Multiple LLMs",
        "nodes": [
            {
                "id": "node-oscmxd5c",
                "type": "customNode",
                "position": {
                    "x": 360,
                    "y": 135
                },
                "data": {
                    "label": "数据输入",
                    "type": "input",
                    "action": "未配置",
                    "description": "",
                    "runtime": {
                        "input": None,
                        "isSuccess": True,
                        "nodeId": "node-oscmxd5c",
                        "output": "未配置"
                    }
                },
                "width": 150,
                "height": 76,
                "style": {}
            },
            {
                "id": "node-zdqwk4be",
                "type": "customNode",
                "position": {
                    "x": 285,
                    "y": 240
                },
                "data": {
                    "label": "If/Else 条件",
                    "type": "conditional",
                    "action": "未配置",
                    "description": "",
                    "condition": "1 == 1",
                    "runtime": {
                        "input": "未配置",
                        "isSuccess": True,
                        "nodeId": "node-zdqwk4be",
                        "output": True
                    }
                },
                "width": 150,
                "height": 105,
                "selected": False,
                "dragging": False,
                "style": {}
            },
            {
                "id": "node-xop8rnk4",
                "type": "customNode",
                "position": {
                    "x": 195,
                    "y": 375
                },
                "data": {
                    "label": "大模型对话",
                    "type": "llm",
                    "action": "未配置",
                    "description": "",
                    "model": "CHAT",
                    "temperature": 0,
                    "maxTokens": 0,
                    "messages": [
                        {
                            "role": "user",
                            "content": "你好"
                        }
                    ],
                    "runtime": {
                        "input": True,
                        "isSuccess": True,
                        "nodeId": "node-xop8rnk4",
                        "output": "你好！有什么可以帮助你的吗？"
                    }
                },
                "width": 225,
                "height": 200,
                "selected": True,
                "positionAbsolute": {
                    "x": 195,
                    "y": 375
                },
                "dragging": False,
                "style": {}
            },
            {
                "id": "node-s0ndjb3y",
                "type": "customNode",
                "position": {
                    "x": 480,
                    "y": 390
                },
                "data": {
                    "label": "大模型对话",
                    "type": "llm",
                    "action": "未配置",
                    "description": "",
                    "model": "CHAT",
                    "temperature": 0,
                    "maxTokens": 0,
                    "messages": [
                        {
                            "role": "user",
                            "content": "你是谁？"
                        }
                    ]
                },
                "width": 150,
                "height": 135,
                "selected": False,
                "positionAbsolute": {
                    "x": 480,
                    "y": 390
                },
                "dragging": False,
                "style": {}
            }
        ],
        "edges": [
            {
                "source": "node-zdqwk4be",
                "sourceHandle": "true",
                "target": "node-xop8rnk4",
                "targetHandle": None,
                "animated": True,
                "style": {
                    "stroke": "#555",
                    "strokeWidth": 2
                },
                "id": "reactflow__edge-node-zdqwk4betrue-node-xop8rnk4"
            },
            {
                "source": "node-zdqwk4be",
                "sourceHandle": "false",
                "target": "node-s0ndjb3y",
                "targetHandle": None,
                "animated": True,
                "style": {
                    "stroke": "#555",
                    "strokeWidth": 2
                },
                "id": "reactflow__edge-node-zdqwk4befalse-node-s0ndjb3y"
            },
            {
                "source": "node-oscmxd5c",
                "sourceHandle": None,
                "target": "node-zdqwk4be",
                "targetHandle": None,
                "animated": True,
                "style": {
                    "stroke": "#555",
                    "strokeWidth": 2
                },
                "id": "reactflow__edge-node-oscmxd5c-node-zdqwk4be"
            }
        ],
        "exportedAt": "2025-04-01T15:14:50.562Z"
    }
}


# 使用示例
if __name__ == "__main__":
    # 示例 workflow 数据 (简化版)
    example_workflow = {
        "id": "1",
        "name": "Multiple LLMs",
        "updatedAt": "2023-05-15",
        "config": {
            "name": "Multiple LLMs",
            "nodes": [],
            "edges": [],
            "exportedAt": "2025-04-01T15:14:50.562Z"
        }
    }

    # 初始化数据库
    db = WorkflowDB()

    # 1. 插入 workflow
    id = db.insert_workflow(example_workflow)
    print(f"插入 workflow 成功. id:{id}")

    # 2. 查询单个 workflow
    workflow = db.get_workflow(id)
    print("查询结果:", workflow['name'])

    # 3. 更新 workflow
    example_workflow['name'] = "Updated Workflow"
    db.update_workflow(example_workflow)
    print("更新 workflow 成功")

    # 4. 查询所有 workflows
    db.insert_workflow(test_workflow_json)
    all_workflows = db.get_all_workflows()
    print(f"共有 {len(all_workflows)} 个 workflows")

    # 5. 删除 workflow
    db.delete_workflow("1")
    print("删除 workflow 成功")

    # 关闭连接
    db.close()

    # 使用方式
    with workflow_db() as db:
        workflows = db.get_all_workflows()
        wfs = db.get_all_workflows()
        for wf in wfs:
            db.delete_workflow(wf["id"])


router = APIRouter(
    prefix="/api/workflows",
    tags=["workflows"],
    responses={404: {"description": "Not found"}},
)

# Pydantic模型用于请求和响应验证


class WorkflowCreate(BaseModel):
    name: str
    config: dict


class WorkflowUpdate(BaseModel):
    name: str
    config: dict


class WorkflowResponse(BaseModel):
    id: int
    name: str
    config: dict
    created_at: str
    updated_at: str
    exported_at: str

# 依赖项获取数据库连接


def get_db():
    with workflow_db() as db:
        yield db


@router.post("/", response_model=WorkflowResponse, status_code=201)
def create_workflow(workflow: WorkflowCreate, db: WorkflowDB = Depends(get_db)):
    """创建新的workflow"""
    try:
        workflow_data = {
            "name": workflow.name,
            "config": workflow.config,
            "updatedAt": datetime.now().isoformat()
        }
        if "exportedAt" not in workflow.config:
            workflow_data["config"]["exportedAt"] = datetime.now().isoformat()

        workflow_id = db.insert_workflow(workflow_data)
        created_workflow = db.get_workflow(workflow_id)

        return JSONResponse(
            status_code=201,
            content=created_workflow
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(db: WorkflowDB = Depends(get_db)):
    """获取所有workflows"""
    try:
        workflows = db.get_all_workflows()
        return workflows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{workflow_id}", response_model=WorkflowResponse)
def get_workflow(workflow_id: int, db: WorkflowDB = Depends(get_db)):
    """获取单个workflow详情"""
    workflow = db.get_workflow(workflow_id)
    if not workflow:
        raise HTTPException(status_code=404, detail="Workflow not found")
    return workflow


@router.put("/{workflow_id}", response_model=WorkflowResponse)
def update_workflow(workflow_id: int, workflow: WorkflowUpdate, db: WorkflowDB = Depends(get_db)):
    """更新workflow"""
    try:
        existing = db.get_workflow(workflow_id)
        if not existing:
            raise HTTPException(status_code=404, detail="Workflow not found")

        workflow_data = {
            "id": workflow_id,
            "name": workflow.name,
            "config": workflow.config,
            "updatedAt": datetime.now().isoformat()
        }
        if "exportedAt" not in workflow.config:
            workflow_data["config"]["exportedAt"] = datetime.now().isoformat()

        db.update_workflow(workflow_data)
        updated_workflow = db.get_workflow(workflow_id)
        return updated_workflow
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{workflow_id}", status_code=204)
def delete_workflow(workflow_id: int, db: WorkflowDB = Depends(get_db)):
    """删除workflow"""
    existing = db.get_workflow(workflow_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Workflow not found")
    db.delete_workflow(workflow_id)
    return Response(status_code=204)


@router.get("/search/by_node_type/{node_type}", response_model=List[WorkflowResponse])
def search_by_node_type(node_type: str, db: WorkflowDB = Depends(get_db)):
    """根据节点类型搜索workflows"""
    try:
        workflows = db.get_workflows_by_node_type(node_type)
        return workflows
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
