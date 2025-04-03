// @ts-ignore
import { useState, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  addEdge,
  Node,
  // @ts-ignore
  Edge,
  NodeTypes,
  Connection,
  OnSelectionChangeParams,
} from "reactflow";
import "reactflow/dist/style.css";

import Sidebar from "./Sidebar";
import NodePanel from "./NodePanel";
import CustomNode from "./CustomNode";
import { nanoid } from "./utils";
import { useWorkflowStore } from "../store/workflowStore";

// Define the node types for the workflow
const nodeTypes: NodeTypes = {
  customNode: CustomNode,
};

interface WorkflowEditorProps {
  isDebugModel: boolean;
}

export default function WorkflowEditor({ isDebugModel }: WorkflowEditorProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<Edge | null>(null);

  // Add a new state to track if mouse is over the flow
  const [isMouseOverFlowNode, setIsMouseOverFlowNode] = useState(false);

  // Add mouse enter/leave handlers for the flow container
  const onMouseEnterFlowNode = useCallback(() => {
    setIsMouseOverFlowNode(true);
  }, []);

  const onMouseLeaveFlowNode = useCallback(() => {
    setIsMouseOverFlowNode(false);
  }, []);

  // Get state and actions from store
  const {
    nodes,
    edges,
    // @ts-ignore
    setNodes,
    setEdges,
    onNodesChange,
    onEdgesChange,
    addNode,
    removeNode,
    updateNode,
    removeEdge,
  } = useWorkflowStore();

  // 在组件顶部添加新的状态
  const [copiedNode, setCopiedNode] = useState<Node | null>(null);

  // 提取粘贴逻辑到单独函数
  const pasteNode = useCallback(
    (nodeToCopy: Node) => {
      if (!reactFlowInstance) return;

      nodeToCopy.selected = false;

      // 获取鼠标当前位置作为新节点的位置
      const newNodeId = `node-${nanoid()}`;

      // 创建新节点（深拷贝）
      const newNode: Node = {
        ...JSON.parse(JSON.stringify(nodeToCopy)), // 深度复制
        id: newNodeId,
        position: {
          x: nodeToCopy.position.x + 50, // 偏移位置
          y: nodeToCopy.position.y + 50,
        },
        data: {
          ...nodeToCopy.data,
          label: nodeToCopy.data.label
            ? `${nodeToCopy.data.label} (copy)`
            : nodeToCopy.data.label,
        },
      };

      setSelectedNode(null);
      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  // 在现有的useEffect键盘事件监听器中添加Ctrl+X处理
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only process if mouse is over the flow node
      if (!isMouseOverFlowNode) return;

      // 处理Delete/Backspace键
      if (event.key === "Delete" || event.key === "Backspace") {
        if (selectedEdge) {
          deleteEdge();
        } else if (selectedNode) {
          deleteNode(selectedNode.id);
        }
      }

      // // 新增：处理Ctrl+X快捷键
      // if (event.ctrlKey && event.key === "x") {
      //   event.preventDefault(); // 阻止默认的剪切行为
      //   if (selectedEdge) {
      //     deleteEdge();
      //   } else if (selectedNode) {
      //     deleteNode(selectedNode.id);
      //   }
      // }

      // 处理Ctrl+C快捷键 - 复制节点JSON
      if (
        event.ctrlKey &&
        (event.key === "c" || event.key === "C") &&
        selectedNode
      ) {
        event.preventDefault();
        setCopiedNode(selectedNode);
        // 复制节点JSON到剪贴板
        navigator.clipboard
          .writeText(JSON.stringify(selectedNode))
          .then(() => {
            console.log("Node copied to clipboard");
          })
          .catch((err) => {
            console.error("Failed to copy node:", err);
          });
      }

      // 处理Ctrl+V快捷键 - 粘贴节点
      if (event.ctrlKey && (event.key === "v" || event.key === "V")) {
        event.preventDefault();

        // 首先尝试从剪贴板读取节点数据
        navigator.clipboard
          .readText()
          .then((text) => {
            try {
              const parsedNode = JSON.parse(text) as Node;
              if (parsedNode.id && parsedNode.type) {
                // 基本验证
                pasteNode(parsedNode);
              }
            } catch (e) {
              console.error("Failed to parse node from clipboard:", e);
            }
          })
          .catch((err) => {
            console.error("Failed to read clipboard:", err);
            // 如果剪贴板读取失败，尝试使用内部存储的节点
            if (copiedNode) {
              pasteNode(copiedNode);
            }
          });
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [
    isMouseOverFlowNode,
    selectedEdge,
    selectedNode,
    removeEdge,
    removeNode,
    copiedNode,
    nodes,
    addNode,
  ]);

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#555", strokeWidth: 2 },
            selected: false,
          },
          eds
        )
      );
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow");
      const name = event.dataTransfer.getData("application/nodename");

      if (
        typeof type === "undefined" ||
        !type ||
        !reactFlowBounds ||
        !reactFlowInstance
      ) {
        return;
      }

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNodeData: any = {
        label: name,
        type,
        action: "未配置",
        description: "",
      };

      // Add specific fields based on node type
      if (type === "conditional") {
        newNodeData.condition = "";
      } else if (type === "fanIn" || type === "fanOut") {
        newNodeData.parallelPaths = 3; // Default number of parallel paths
      }

      const newNode = {
        id: `node-${nanoid()}`,
        type: "customNode",
        position,
        data: newNodeData,
      };

      addNode(newNode);
    },
    [reactFlowInstance, addNode]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    setSelectedEdge(null); // Clear edge selection when node is clicked
  }, []);

  const onEdgeClick = useCallback((_: React.MouseEvent, edge: Edge) => {
    setSelectedEdge(edge);
    setSelectedNode(null); // Clear node selection when edge is clicked
  }, []);

  const onSelectionChange = useCallback(
    ({ nodes, edges }: OnSelectionChangeParams) => {
      if (nodes.length === 1) {
        setSelectedNode(nodes[0]);
        setSelectedEdge(null);
      } else if (edges.length === 1) {
        setSelectedEdge(edges[0]);
        setSelectedNode(null);
      } else if (nodes.length === 0 && edges.length === 0) {
        setSelectedNode(null);
        setSelectedEdge(null);
      }
    },
    []
  );

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
    setSelectedEdge(null);
  }, []);

  const updateNodeData = useCallback(
    (nodeId: string, newData: any) => {
      updateNode(nodeId, newData);
    },
    [updateNode]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      removeNode(nodeId);
      if (selectedNode && selectedNode.id === nodeId) {
        setSelectedNode(null);
      }
    },
    [selectedNode, removeNode]
  );

  const deleteEdge = useCallback(() => {
    if (selectedEdge) {
      removeEdge(selectedEdge.id);
      setSelectedEdge(null);
    }
  }, [selectedEdge, removeEdge]);

  return (
    <div className="flex h-full">
      {!isDebugModel && <Sidebar />}
      <div className="flex-1 flex">
        <div className="flex-1 h-full" ref={reactFlowWrapper}>
          <ReactFlowProvider>
            <ReactFlow
              style={{
                cursor:
                  "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDMyIDMyIj4KICA8cGF0aCBkPSJNNiA2TDI2IDZMMjYgMjBMMTYgMjBMMTIgMjZMMTIgMjBMNiAyMFoiIGZpbGw9IndoaXRlIiBzdHJva2U9ImJsYWNrIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'), pointer",
              }}
              nodes={nodes}
              edges={edges.map((edge) => ({
                ...edge,
                style: {
                  ...edge.style,
                  stroke: selectedEdge?.id === edge.id ? "#ff0072" : "#555",
                  strokeWidth: selectedEdge?.id === edge.id ? 3 : 2,
                },
              }))}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onInit={setReactFlowInstance}
              onDrop={onDrop}
              onDragOver={onDragOver}
              onNodeClick={onNodeClick}
              onEdgeClick={onEdgeClick}
              onPaneClick={onPaneClick}
              onSelectionChange={onSelectionChange}
              nodeTypes={nodeTypes}
              fitView
              snapToGrid
              // deleteKeyCode={["Backspace", "Delete"]}
              onNodeMouseEnter={onMouseEnterFlowNode}
              onNodeMouseLeave={onMouseLeaveFlowNode}
            >
              <Background />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </ReactFlowProvider>
        </div>
        {selectedNode && (
          <NodePanel
            isDebugModel={isDebugModel}
            node={selectedNode}
            updateNodeData={updateNodeData}
            deleteNode={deleteNode}
            onClose={() => setSelectedNode(null)}
          />
        )}
        {selectedEdge && (
          <div className="w-64 bg-white border-l border-gray-200 p-4 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">Edge Settings</h3>
              <button
                onClick={() => setSelectedEdge(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 mb-2">
                Connection from <strong>{selectedEdge.source}</strong> to{" "}
                <strong>{selectedEdge.target}</strong>
              </p>
            </div>
            <button
              onClick={deleteEdge}
              className="mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded"
            >
              Delete Edge
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
