import datetime
import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List, Set
from collections import deque


class WorkflowContext:
    """工作流上下文，用于跟踪执行状态和传递数据"""

    def __init__(self):
        self.execution_history: Dict[str, Dict[str, Any]] = {}  # 节点ID -> 执行记录
        self.global_data: Dict[str, Any] = {}  # 全局共享数据
        self.current_data: Any = None  # 当前传递的数据

    def record_execution(self, node_id: str, status: str, input_data: Any, output_data: Any = None):
        """记录节点执行情况"""
        self.execution_history[node_id] = {
            'status': status,
            'input': input_data,
            'output': output_data,
            'timestamp': datetime.datetime.now().isoformat()
        }

    def get_node_history(self, node_id: str) -> Optional[Dict[str, Any]]:
        """获取节点的执行历史"""
        return self.execution_history.get(node_id)

    def set_global_data(self, key: str, value: Any):
        """设置全局数据"""
        self.global_data[key] = value

    def get_global_data(self, key: str) -> Any:
        """获取全局数据"""
        return self.global_data.get(key)


class Node(ABC):
    """抽象基类，所有节点类型的父类"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        self.id = node_id
        self.type = node_type
        self.label = data.get('label', '')
        self.action = data.get('action', '未配置')
        self.description = data.get('description', '')
        self.next_nodes: List['Node'] = []

    @abstractmethod
    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List['Node']:
        """执行节点逻辑，返回后续节点"""
        pass

    def add_next_node(self, node: 'Node'):
        """添加后续节点"""
        self.next_nodes.append(node)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id={self.id}, type={self.type}, label={self.label})"


class InputNode(Node):
    """数据输入节点"""

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行输入节点 {self.label}，action: {self.action}")
        # 模拟输入数据
        output_data = {"input_data": "示例输入数据"}
        context.current_data = output_data
        context.record_execution(self.id, "completed", input_data, output_data)
        return self.next_nodes if self.next_nodes else []


class TransformNode(Node):
    """数据转换节点"""

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行转换节点 {self.label}，输入: {input_data}，action: {self.action}")
        # 模拟转换操作
        output_data = {"transformed_data": f"转换后的{input_data}"}
        context.current_data = output_data
        context.record_execution(self.id, "completed", input_data, output_data)
        return self.next_nodes if self.next_nodes else []


class ConditionalNode(Node):
    """条件节点"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        super().__init__(node_id, node_type, data)
        self.condition = False  # 默认条件为真，可以从data中获取实际条件
        self.true_branch: Optional[Node] = None
        self.false_branch: Optional[Node] = None

    def set_branches(self, true_branch: Node, false_branch: Node):
        """设置条件分支"""
        self.true_branch = true_branch
        self.false_branch = false_branch

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行条件节点 {self.label}，输入: {input_data}，条件: {self.condition}")

        # 记录执行情况
        context.record_execution(self.id, "evaluated", input_data, {
                                 "condition_result": self.condition})

        if self.condition:
            print("条件为真，走true分支")
            return [self.true_branch] if self.true_branch else []
        else:
            print("条件为假，走false分支")
            return [self.false_branch] if self.false_branch else []


class OutputNode(Node):
    """数据输出节点"""

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行输出节点 {self.label}，输入: {input_data}，action: {self.action}")
        # 记录最终输出
        context.record_execution(self.id, "completed", input_data, {
                                 "final_output": input_data})
        context.current_data = input_data  # 保持数据不变
        return self.next_nodes if self.next_nodes else []


class FanInNode(Node):
    """扇入节点（并行开始）"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        super().__init__(node_id, node_type, data)
        self.parallel_nodes: List[Node] = []

    def add_parallel_node(self, node: Node):
        """添加并行节点"""
        self.parallel_nodes.append(node)

    def parallel_paths(self) -> int:
        """获取并行路径数"""
        return len(self.parallel_nodes)

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行扇入节点 {self.label}，并行路径数: {self.parallel_paths()}")
        context.record_execution(self.id, "parallel_start", input_data, {
                                 "parallel_count": self.parallel_paths()})

        # 返回所有并行节点作为下一步
        return self.parallel_nodes


class FanOutNode(Node):
    """扇出节点（并行结束）"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        super().__init__(node_id, node_type, data)
        self.parallel_paths = data.get('parallelPaths', 1)

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行扇出节点 {self.label}，合并并行路径")
        # 这里可以添加并行结果合并逻辑
        output_data = {"merged_data": input_data}
        context.current_data = output_data
        context.record_execution(
            self.id, "parallel_end", input_data, output_data)
        return self.next_nodes if self.next_nodes else []


class APINode(Node):
    """API请求节点"""

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(f"执行API节点 {self.label}，输入: {input_data}，action: {self.action}")
        # 模拟API调用
        output_data = {"api_response": f"API响应: {input_data}"}
        context.current_data = output_data
        context.record_execution(self.id, "completed", input_data, output_data)
        return self.next_nodes if self.next_nodes else []


class WebhookNode(Node):
    """Webhook节点"""

    def execute(self, context: WorkflowContext, input_data: Optional[Any] = None) -> List[Node]:
        print(
            f"执行Webhook节点 {self.label}，输入: {input_data}，action: {self.action}")
        # 模拟Webhook调用
        output_data = {"webhook_response": f"Webhook响应: {input_data}"}
        context.current_data = output_data
        context.record_execution(self.id, "completed", input_data, output_data)
        return self.next_nodes if self.next_nodes else []


class Workflow:
    """工作流类，负责解析和执行整个工作流"""

    def __init__(self, workflow_json: Dict[str, Any]):
        self.nodes: Dict[str, Node] = {}
        self.edges = workflow_json['edges']
        self.start_node: Optional[Node] = None
        self.context = WorkflowContext()
        self._parse_nodes(workflow_json['nodes'])
        self._connect_nodes()

    def _parse_nodes(self, nodes_data: List[Dict[str, Any]]):
        """解析所有节点"""
        for node_data in nodes_data:
            node_id = node_data['id']
            node_type = node_data['type']
            data = node_data['data']

            # 根据类型创建不同的节点对象
            node_type_map = {
                'input': InputNode,
                'transform': TransformNode,
                'conditional': ConditionalNode,
                'output': OutputNode,
                'fanIn': FanInNode,
                'fanOut': FanOutNode,
                'api': APINode,
                'webhook': WebhookNode
            }

            # 获取实际类型（data中的type字段）
            actual_type = data['type']
            node_class = node_type_map.get(actual_type, Node)
            self.nodes[node_id] = node_class(node_id, actual_type, data)

            # 找到起始节点（没有入边的节点）
            if actual_type == 'input':
                self.start_node = self.nodes[node_id]

    def _connect_nodes(self):
        """连接所有节点"""
        for edge in self.edges:
            source_node = self.nodes[edge['source']]
            target_node = self.nodes[edge['target']]

            if isinstance(source_node, ConditionalNode):
                if 'true' == edge['sourceHandle']:
                    source_node.true_branch = target_node
                elif 'false' == edge['sourceHandle']:
                    source_node.false_branch = target_node
            elif isinstance(source_node, FanInNode):
                source_node.add_parallel_node(target_node)
            else:
                source_node.add_next_node(target_node)

    def execute(self):
        """使用广度优先算法执行整个工作流"""
        if not self.start_node:
            print("工作流没有起始节点")
            return

        print("开始执行工作流(BFS顺序)...")

        # 使用队列进行BFS
        queue = deque()
        visited = set()

        # 从起始节点开始
        queue.append((self.start_node, None))
        visited.add(self.start_node.id)

        while queue:
            current_node, current_input = queue.popleft()

            # 执行当前节点
            next_step_nodes = current_node.execute(self.context, current_input)

            for next_node in next_step_nodes:
                if next_node and next_node.id not in visited:
                    # 传递当前上下文中的数据
                    queue.append((next_node, self.context.current_data))
                    visited.add(next_node.id)

        print("工作流执行完成(BFS顺序)")
        print("\n执行历史记录:")
        for node_id, history in self.context.execution_history.items():
            print(f"节点 {node_id}: {history}")

    def get_execution_history(self) -> Dict[str, Dict[str, Any]]:
        """获取执行历史"""
        return self.context.execution_history




def test2():
    # 读取JSON文件
    with open('workflow.json', 'r', encoding='utf-8') as f:
        workflow_data = json.load(f)

    # 创建并执行工作流
    workflow = Workflow(workflow_data)
    workflow.execute()


def test1():
    import datetime

    # 示例工作流JSON
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

    # 创建并执行工作流
    workflow = Workflow(example_workflow)
    workflow.execute()

    # 获取执行历史
    history = workflow.get_execution_history()
    print("\n详细的执行历史:")
    print(json.dumps(history, indent=2, ensure_ascii=False))



# 示例使用
if __name__ == "__main__":
    test2()