import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react"; // Import the back arrow icon

interface Node {
  id: number;
  name: string;
  online: boolean;
  ip: string;
  cpu: {
    cores: number;
    usage: number;
  };
  memory: {
    used: number;
    total: number;
  };
  disk: {
    used: number;
    total: number;
  };
  tasks?: Array<{
    name: string;
    status: "running" | "completed" | "failed";
  }>;
}

export default function MachineManager() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState("请选择要执行的操作");
  const socketRef = useRef<WebSocket | null>(null);
  const navigate = useNavigate();

  // API configuration
  const API_BASE_URL = "http://localhost:3000/api";
  const WS_BASE_URL = "ws://localhost:3000/ws";

  // Fetch nodes from API
  const fetchNodes = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/nodes`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setNodes(data);
      setError(null);
      initializeWebSocket();
    } catch (err) {
      console.error("Error fetching nodes:", err);
      setError(
        `无法获取节点数据: ${err instanceof Error ? err.message : String(err)}`
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch single node
  const fetchNode = async (nodeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (err) {
      console.error("Error fetching node:", err);
      setError(
        `无法获取节点数据: ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    }
  };

  // Node actions
  const offlineNode = async (nodeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/offline`, {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (err) {
      console.error("Error offlining node:", err);
      setError(
        `下线节点失败: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  };

  const onlineNode = async (nodeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}/online`, {
        method: "PUT",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (err) {
      console.error("Error onlining node:", err);
      setError(
        `上线节点失败: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  };

  const deleteNode = async (nodeId: number) => {
    try {
      const response = await fetch(`${API_BASE_URL}/nodes/${nodeId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return true;
    } catch (err) {
      console.error("Error deleting node:", err);
      setError(
        `删除节点失败: ${err instanceof Error ? err.message : String(err)}`
      );
      return false;
    }
  };

  // WebSocket connection
  const initializeWebSocket = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.close();
    }

    const socket = new WebSocket(`${WS_BASE_URL}/nodes`);
    socketRef.current = socket;

    socket.onopen = () => {
      console.log("WebSocket connection established");
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      console.log("Received update:", data);

      setNodes((prevNodes) => {
        let updatedNodes = [...prevNodes];

        switch (data.type) {
          case "node_update":
            const updatedNode = data.payload;
            const index = updatedNodes.findIndex(
              (n) => n.id === updatedNode.id
            );
            if (index !== -1) {
              updatedNodes[index] = updatedNode;
            } else {
              updatedNodes.push(updatedNode);
            }
            break;

          case "node_offline":
            const offlineNodeId = data.payload.id;
            const offlineIndex = updatedNodes.findIndex(
              (n) => n.id === offlineNodeId
            );
            if (offlineIndex !== -1) {
              updatedNodes[offlineIndex].online = false;
            }
            break;

          case "node_online":
            const onlineNodeId = data.payload.id;
            const onlineIndex = updatedNodes.findIndex(
              (n) => n.id === onlineNodeId
            );
            if (onlineIndex !== -1) {
              updatedNodes[onlineIndex].online = true;
            } else {
              updatedNodes.push(data.payload);
            }
            break;

          case "node_deleted":
            const deletedNodeId = data.payload.id;
            updatedNodes = updatedNodes.filter((n) => n.id !== deletedNodeId);
            break;
        }

        return updatedNodes;
      });
    };

    socket.onclose = (event) => {
      if (event.wasClean) {
        console.log(
          `WebSocket closed cleanly, code=${event.code}, reason=${event.reason}`
        );
      } else {
        console.log("WebSocket connection died");
        // Attempt to reconnect
        setTimeout(initializeWebSocket, 5000);
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("实时连接中断，正在尝试重新连接...");
    };
  };

  // Modal actions
  const handleRefreshNode = async () => {
    if (!selectedNodeId) return;

    setModalMessage("正在刷新节点数据...");
    const node = await fetchNode(selectedNodeId);
    if (node) {
      setModalMessage("节点数据已刷新");
      setTimeout(() => setModalOpen(false), 1000);
    } else {
      setModalMessage("刷新节点数据失败");
    }
  };

  const handleOnlineNode = async () => {
    if (!selectedNodeId) return;

    setModalMessage("正在上线节点...");
    const success = await onlineNode(selectedNodeId);
    if (success) {
      setModalMessage("节点已上线");
      setTimeout(() => setModalOpen(false), 1000);
    } else {
      setModalMessage("上线节点失败");
    }
  };

  const handleOfflineNode = async () => {
    if (!selectedNodeId) return;

    setModalMessage("正在下线节点...");
    const success = await offlineNode(selectedNodeId);
    if (success) {
      setModalMessage("节点已下线");
      setTimeout(() => setModalOpen(false), 1000);
    } else {
      setModalMessage("下线节点失败");
    }
  };

  const handleDeleteNode = async () => {
    if (!selectedNodeId) return;

    setModalMessage("正在删除节点...");
    const success = await deleteNode(selectedNodeId);
    if (success) {
      setModalMessage("节点已删除");
      setTimeout(() => setModalOpen(false), 1000);
    } else {
      setModalMessage("删除节点失败");
    }
  };

  // Clean up WebSocket on unmount
  useEffect(() => {
    fetchNodes();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  return (
    <div className="container mx-auto p-5">
      {/* Back button and title header */}
      <div className="flex items-center mb-8">
        <button
          onClick={() => navigate(-1)} // Go back to previous page
          className="mr-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="text-gray-600" />
        </button>
        {/* <h1 className="text-3xl font-bold text-gray-800">机器节点管理系统</h1> */}
      </div>

      {error && (
        <div className="error-message text-center p-5 bg-red-100 text-red-800 rounded-lg mb-5">
          {error}
        </div>
      )}

      <br></br>
      <h1 className="text-3xl font-bold text-center mb-8">机器节点管理系统</h1>

      {error && (
        <div className="error-message text-center p-5 bg-red-100 text-red-800 rounded-lg mb-5">
          {error}
        </div>
      )}

      {loading ? (
        <div className="loading text-center p-5 text-gray-600">
          加载节点数据中...
        </div>
      ) : nodes.length === 0 ? (
        <div className="loading text-center p-5 text-gray-600">
          没有可用的节点数据
        </div>
      ) : (
        <div className="nodes-container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {nodes.map((node) => (
            <div
              key={node.id}
              className="node-card bg-white rounded-lg shadow-sm p-5 hover:shadow-md transition-shadow"
            >
              <div className="node-header flex items-center mb-4">
                <div className="node-icon w-10 h-10 bg-blue-50 rounded-full flex items-center justify-center mr-4 text-blue-500 text-xl">
                  💻
                </div>
                <div className="node-info flex-1">
                  <div className="node-name font-bold mb-1">{node.name}</div>
                  <span
                    className={`node-status inline-block px-2 py-1 rounded-full text-xs ${
                      node.online
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {node.online ? "在线" : "离线"}
                  </span>
                </div>
                <button
                  className="node-details-btn bg-blue-600 text-white px-3 py-1 rounded text-sm ml-1 hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    const details = document.getElementById(
                      `details-${node.id}`
                    );
                    if (details) {
                      details.style.display =
                        details.style.display === "block" ? "none" : "block";
                    }
                  }}
                >
                  详情
                </button>
                <button
                  className="node-actions-btn bg-gray-600 text-white px-3 py-1 rounded text-sm ml-1 hover:bg-gray-700 transition-colors"
                  onClick={() => {
                    setSelectedNodeId(node.id);
                    setModalOpen(true);
                  }}
                >
                  操作
                </button>
              </div>

              <div
                id={`details-${node.id}`}
                className="node-details hidden mt-4 pt-4 border-t border-gray-200"
              >
                <div className="detail-item mb-3">
                  <div className="detail-label font-bold text-gray-600 mb-1">
                    IP地址
                  </div>
                  <div>{node.ip}</div>
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label font-bold text-gray-600 mb-1">
                    CPU使用率 ({node.cpu.cores}核)
                  </div>
                  <div>{node.cpu.usage}%</div>
                  <div className="progress-container h-2 bg-gray-200 rounded mt-1">
                    <div
                      className="progress-bar h-full rounded bg-green-500"
                      style={{ width: `${node.cpu.usage}%` }}
                    ></div>
                  </div>
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label font-bold text-gray-600 mb-1">
                    内存使用
                  </div>
                  <div>
                    {node.memory.used}GB / {node.memory.total}GB
                  </div>
                  <div className="progress-container h-2 bg-gray-200 rounded mt-1">
                    <div
                      className="progress-bar h-full rounded bg-blue-500"
                      style={{
                        width: `${
                          (node.memory.used / node.memory.total) * 100
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="detail-item mb-3">
                  <div className="detail-label font-bold text-gray-600 mb-1">
                    磁盘使用
                  </div>
                  <div>
                    {node.disk.used}GB / {node.disk.total}GB
                  </div>
                  <div className="progress-container h-2 bg-gray-200 rounded mt-1">
                    <div
                      className="progress-bar h-full rounded bg-yellow-500"
                      style={{
                        width: `${(node.disk.used / node.disk.total) * 100}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <div className="tasks-title font-bold mt-4 mb-2">
                  {node.tasks && node.tasks.length > 0
                    ? `运行任务 (${node.tasks.length})`
                    : "没有运行中的任务"}
                </div>

                {node.tasks && node.tasks.length > 0 && (
                  <ul className="task-list">
                    {node.tasks.map((task, index) => (
                      <li
                        key={index}
                        className="task-item flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0"
                      >
                        <span className="task-name font-bold">{task.name}</span>
                        <span
                          className={`task-status text-xs px-2 py-1 rounded ${
                            task.status === "running"
                              ? "bg-blue-100 text-blue-800"
                              : task.status === "completed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {task.status === "running"
                            ? "运行中"
                            : task.status === "completed"
                            ? "已完成"
                            : "失败"}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Action Modal */}
      {modalOpen && (
        <div className="modal fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="modal-content bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="modal-header flex justify-between items-center p-4 border-b">
              <h3 className="modal-title font-bold text-lg">
                {selectedNodeId
                  ? `节点操作 - ${
                      nodes.find((n) => n.id === selectedNodeId)?.name || ""
                    }`
                  : "节点操作"}
              </h3>
              <button
                className="close-btn text-2xl font-bold text-gray-500 hover:text-gray-700"
                onClick={() => setModalOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="modal-body p-4">
              <p>{modalMessage}</p>
            </div>

            <div className="modal-footer flex justify-end gap-2 p-4 border-t">
              <button
                className="action-btn px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                onClick={handleRefreshNode}
              >
                刷新
              </button>
              <button
                className="action-btn px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                onClick={handleOnlineNode}
              >
                上线
              </button>
              <button
                className="action-btn px-4 py-2 rounded bg-yellow-600 text-white hover:bg-yellow-700"
                onClick={handleOfflineNode}
              >
                下线
              </button>
              <button
                className="action-btn px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                onClick={handleDeleteNode}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
