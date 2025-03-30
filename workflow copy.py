import json
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, List
from collections import deque


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
    def execute(self, input_data: Optional[str] = None) -> List['Node']:
        """执行节点逻辑，返回输出数据"""
        pass

    def add_next_node(self, node: 'Node'):
        """添加后续节点"""
        self.next_nodes.append(node)

    def __repr__(self) -> str:
        return f"{self.__class__.__name__}(id={self.id}, type={self.type}, label={self.label})"


class InputNode(Node):
    """数据输入节点"""

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行输入节点 {self.label}，action: {self.action}")
        return [] if self.next_nodes == None else [self.next_nodes[0]]


class TransformNode(Node):
    """数据转换节点"""

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行转换节点 {self.label}，输入: {input_data}，action: {self.action}")
        return [] if self.next_nodes == None else [self.next_nodes[0]]


class ConditionalNode(Node):
    """条件节点"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        super().__init__(node_id, node_type, data)
        # 假设条件为真
        self.condition = False  # data.get('condition', True)
        self.true_branch: Optional[Node] = None
        self.false_branch: Optional[Node] = None

    def set_branches(self, true_branch: Node, false_branch: Node):
        """设置条件分支"""
        self.true_branch = true_branch
        self.false_branch = false_branch

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行条件节点 {self.label}，输入: {input_data}，条件: {self.condition}")
        # 这里简化处理，实际应根据condition评估结果选择分支

        if self.condition:
            print("条件为真，走true分支")
            return [] if self.next_nodes == None else [self.true_branch]
        else:
            print("条件为假，走false分支")
            return [] if self.next_nodes == None else [self.false_branch]


class OutputNode(Node):
    """数据输出节点"""

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行输出节点 {self.label}，输入: {input_data}，action: {self.action}")
        return [] if self.next_nodes == None or len(self.next_nodes) == 0 else [self.next_nodes[0]]


class FanInNode(Node):
    """扇入节点（并行开始）"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        super().__init__(node_id, node_type, data)

    def add_parallel_node(self, node: Node):
        """添加并行节点"""
        self.add_next_node(node)

    def parallel_paths(self) -> int:
        """获取并行路径数"""
        return len(self.next_nodes)

    def next_parallel_nodes(self) -> List[Node]:
        """获取并行节点列表"""
        return self.next_nodes

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行扇入节点 {self.label}，并行路径数: {self.parallel_paths()}")
        # 启动所有并行节点
        results = []
        for node in self.next_nodes:
            results.append(node.execute(input_data))
        return [] if self.next_nodes == None else self.next_nodes


class FanOutNode(Node):
    """扇出节点（并行结束）"""

    def __init__(self, node_id: str, node_type: str, data: Dict[str, Any]):
        super().__init__(node_id, node_type, data)
        self.parallel_paths = data.get('parallelPaths', 1)

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行扇出节点 {self.label}，合并并行路径")
        return [] if self.next_nodes == None else [self.next_nodes[0]]


class APINode(Node):
    """API请求节点"""

    def execute(self, input_data: Optional[str] = None) -> str:
        print(f"执行API节点 {self.label}，输入: {input_data}，action: {self.action}")
        return [] if self.next_nodes == None else [self.next_nodes[0]]


class WebhookNode(Node):
    """Webhook节点"""

    def execute(self, input_data: Optional[str] = None) -> str:
        print(
            f"执行Webhook节点 {self.label}，输入: {input_data}，action: {self.action}")
        return [] if self.next_nodes == None else [self.next_nodes[0]]


class Workflow:
    """工作流类，负责解析和执行整个工作流"""

    def __init__(self, workflow_json: Dict[str, Any]):
        self.nodes: Dict[str, Node] = {}
        self.edges = workflow_json['edges']
        self.start_node: Optional[Node] = None
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

        # 初始输入数据
        input_data = None

        # 从起始节点开始
        queue.append((self.start_node, input_data))
        visited.add(self.start_node.id)

        while queue:
            current_node, current_input = queue.popleft()

            # 执行当前节点
            next_step_nodes = current_node.execute(current_input)

            for next_node in next_step_nodes:
                if next_node and next_node.id not in visited:
                    queue.append((next_node, "0"))
                    visited.add(next_node.id)

        print("工作流执行完成(BFS顺序)")


# 示例使用
if __name__ == "__main__":
    # 读取JSON文件
    with open('workflow.json', 'r', encoding='utf-8') as f:
        workflow_data = json.load(f)

    # 创建并执行工作流
    workflow = Workflow(workflow_data)
    workflow.execute()
