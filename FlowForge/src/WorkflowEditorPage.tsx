// WorkflowEditorPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import WorkflowEditor from "./components/WorkflowEditor";
import { Download, Bug, BugOff, Rocket, Upload, ArrowLeft } from "lucide-react";
import "./index.css";
import { useWorkflowStore } from "./store/workflowStore";
import { WorkflowWebSocket } from "./utils/websocket";
import { ImportWorkflowModal } from "./components/ImportWorkflowModal";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Workflow {
  id: string;
  name: string;
  updated_at: string;
  created_at: string;
  exported_at: string;
  config: any;
}

export default function WorkflowEditorPage() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // Add this to access location state
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [exportedJson, setExportedJson] = useState<string>("");
  const [socketInstance, setSocketInstance] =
    useState<WorkflowWebSocket | null>(null);
  const [isDebugModel, setIsDebugModel] = useState(false);
  const [workflowName, setWorkflowName] = useState<string>(
    workflowId === "new" ? "Untitled Workflow" : `Workflow ${workflowId}`
  );
  const { nodes, edges, updateNode, updateNodeStyle, importWorkflow } =
    useWorkflowStore();

  useEffect(() => {
    if (workflowId) {
      const loadWorkflow = async () => {
        try {
          const fetchedWorkflow = await fetchWorkflow(workflowId);
          setWorkflowName(fetchedWorkflow.name);
          fetchedWorkflow.config.nodes.forEach((node: any) => {
            updateNode(node.id, node.data);
          });
        } catch (err) {
          console.error("Failed to load workflow:", err);
          alert("Failed to load workflow:" + workflowId + " error: " + err);
        }
      };

      loadWorkflow();
    } else {
      importWorkflow([], []);
    }
  }, [workflowId]);

  // Load workflow config when component mounts
  useEffect(() => {
    if (location.state?.workflowConfig) {
      const { name, nodes, edges } = location.state.workflowConfig;
      setWorkflowName(name);
      if (workflowId) {
        importWorkflow(nodes, edges);
      }
    }
  }, [location.state, importWorkflow]);

  const fetchWorkflow = async (id: string): Promise<Workflow> => {
    try {
      const ip = import.meta.env.VITE_WORKFLOW_IP;
      const port = import.meta.env.VITE_WORKFLOW_PORT;
      const response = await fetch(`http://${ip}:${port}/api/workflows/${id}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: Workflow = await response.json();
      return data;
    } catch (error) {
      console.error("Error fetching workflow:", error);
      throw error; // 可以自定义错误处理
    }
  };

  // Function to create a new workflow
  // 定义一个异步函数 createWorkflow，用于创建新的工作流
  const createWorkflow = async (workflowData: Omit<Workflow, "id">) => {
    try {
      // 使用 fetch 发送 POST 请求到指定的 API 端点，以创建新的工作流
      const ip = import.meta.env.VITE_WORKFLOW_IP;
      const port = import.meta.env.VITE_WORKFLOW_PORT;
      const response = await fetch(`http://${ip}:${port}/api/workflows/`, {
        method: "POST", // 指定请求方法为 POST
        headers: {
          "Content-Type": "application/json", // 设置请求头，指定内容类型为 JSON
        },
        body: JSON.stringify(workflowData), // 将工作流数据转换为 JSON 字符串作为请求体
      });

      // 检查响应状态码，如果不是 2xx 范围，则抛出错误
      if (!response.ok) {
        throw new Error("Failed to create workflow");
      }

      // 解析响应体为 JSON 对象，获取新创建的工作流数据
      const newWorkflow = await response.json();
      return newWorkflow.id.toString();
    } catch (err) {
      alert("Failed to create workflow. error: " + err);
      throw err;
    }
  };

  const handleCleanRuntimeAndStyle = () => {
    nodes.forEach((node) => {
      const { runtime, ...cleanData } = node.data;
      updateNode(node.id, cleanData);
      updateNodeStyle(node.id, "");
    });
  };

  const prepareExportData = () => {
    const workflowData = {
      name: workflowName,
      nodes: nodes,
      edges: edges,
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(workflowData, null, 2);
  };

  const handleExportWorkflow = () => {
    const jsonString = prepareExportData();
    setExportedJson(jsonString);
    setIsExportModalOpen(true);
  };

  // Function to update a workflow into db
  const updateWorkflow = async (id: string, workflowData: Partial<any>) => {
    try {
      const ip = import.meta.env.VITE_WORKFLOW_IP;
      const port = import.meta.env.VITE_WORKFLOW_PORT;
      const response = await fetch(`http://${ip}:${port}/api/workflows/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(workflowData),
      });

      if (!response.ok) {
        throw new Error("Failed to update workflow");
      }
    } catch (err) {
      throw err;
    }
  };

  const handleDownloadWorkflow = () => {
    const jsonString = prepareExportData();
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();

    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRuntimeMessage = (message: {
    isSuccess: boolean;
    nodeId: string;
    output: any;
    error?: any;
    input?: any;
  }) => {
    if (message.isSuccess) {
      updateNodeStyle(message.nodeId, { border: "2px solid #10B981" });
    } else {
      updateNodeStyle(message.nodeId, { border: "2px solid #EF4444" });
      console.error(`Node ${message.nodeId} error:`, message.error);
    }
    updateNode(message.nodeId, {
      ...nodes.find((node) => node.id === message.nodeId)?.data,
      runtime: {
        ...message,
      },
    });
  };

  const handleRunWorkflow = () => {
    socketInstance?.close();
    setIsSocketConnected(true);
    handleCleanRuntimeAndStyle();

    const currentWorkflowId = workflowId ? workflowId : "abc123";
    const ws = new WorkflowWebSocket(
      currentWorkflowId,
      () => {
        const workflowData = {
          name: workflowName,
          nodes: nodes,
          edges: edges,
          exportedAt: new Date().toISOString(),
        };
        const jsonString = JSON.stringify(workflowData, null, 2);
        if (!ws.send(jsonString)) {
          console.error("Failed to send workflow data");
        }
      },
      () => {
        setIsSocketConnected(false);
      }
    );
    ws.connect(handleRuntimeMessage);
    setSocketInstance(ws);

    console.log("Running workflow...");
    console.log(JSON.stringify(nodes));
    console.log(JSON.stringify(edges));
  };

  useEffect(() => {
    return () => socketInstance?.close();
  }, []);

  useEffect(() => {
    handleCleanRuntimeAndStyle();
  }, [isDebugModel]);

  const handleImportWorkflow = (jsonData: any) => {
    try {
      if (jsonData.name) {
        setWorkflowName(jsonData.name);
      }
      importWorkflow(jsonData.nodes, jsonData.edges);
      setIsImportModalOpen(false);
    } catch (error) {
      console.error("Failed to import workflow:", error);
      alert("导入工作流失败，请检查JSON格式是否正确。");
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 气泡 */}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate("/")}
              className="mr-2 text-gray-500 hover:text-gray-700"
              title="Back to Dashboard"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">
              {workflowId === "new"
                ? "Create New Workflow"
                : `Editing: ${workflowName}`}
            </h1>
            <div className="mx-4 h-6 w-px bg-gray-200"></div>
            <input
              type="text"
              value={workflowName}
              onChange={(e) => setWorkflowName(e.target.value)}
              className="text-lg text-gray-700 bg-transparent border-0 border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:ring-0 px-1 py-0.5"
            />
          </div>
          <div className="flex space-x-2">
            {isDebugModel && isSocketConnected && (
              <div className="flex items-center px-3 text-sm text-green-600">
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                Running
              </div>
            )}

            <button
              onClick={() => {
                setIsDebugModel((prevState) => !prevState);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              {isDebugModel ? (
                <>
                  <BugOff size={16} className="mr-1" />
                  Debug Off
                </>
              ) : (
                <>
                  <Bug size={16} className="mr-1" />
                  Debug
                </>
              )}
            </button>

            {!isDebugModel && (
              <button
                onClick={() => setIsImportModalOpen(true)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <Upload size={16} className="mr-1" />
                导入工作流
              </button>
            )}

            {!isDebugModel && (
              <button
                onClick={handleExportWorkflow}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <Download size={16} className="mr-1" />
                导出工作流
              </button>
            )}

            {!isDebugModel && (
              <button
                onClick={async () => {
                  const workflowData: Workflow = {
                    name: workflowName,
                    updated_at: new Date().toISOString(),
                    config: {
                      name: workflowName,
                      nodes: nodes,
                      edges: edges,
                      exportedAt: new Date().toISOString(),
                    },
                    id: "",
                    created_at: "",
                    exported_at: "",
                  };

                  try {
                    if (workflowId) {
                      await updateWorkflow(workflowId, workflowData);
                      toast.success("工作流更新成功!", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                      });
                    } else {
                      const newWorkflowId = await createWorkflow(workflowData);
                      toast.success("工作流创建成功!", {
                        position: "top-right",
                        autoClose: 3000,
                        hideProgressBar: false,
                        closeOnClick: true,
                        pauseOnHover: true,
                        draggable: true,
                        progress: undefined,
                      });
                      navigate(`/workflow/${newWorkflowId}`);
                    }
                    // const jsonString = JSON.stringify(workflowData, null, 2);
                    // navigator.clipboard.writeText(jsonString);
                  } catch (error) {
                    toast.error("保存失败: " + error, {
                      position: "top-right",
                      autoClose: 5000,
                      hideProgressBar: false,
                      closeOnClick: true,
                      pauseOnHover: true,
                      draggable: true,
                      progress: undefined,
                    });
                  }
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                保存工作流
              </button>
            )}

            {isDebugModel && (
              <button
                onClick={handleRunWorkflow}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
              >
                <Rocket size={16} className="mr-1" />
                Run
              </button>
            )}
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <WorkflowEditor isDebugModel={isDebugModel} />
      </div>
      {isImportModalOpen && (
        <ImportWorkflowModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onImport={handleImportWorkflow}
        />
      )}
      {isExportModalOpen && (
        <ImportWorkflowModal
          isOpen={isExportModalOpen}
          onClose={() => setIsExportModalOpen(false)}
          defaultValue={exportedJson}
          isExportMode={true}
          onDownload={handleDownloadWorkflow}
        />
      )}
    </div>
  );
}
