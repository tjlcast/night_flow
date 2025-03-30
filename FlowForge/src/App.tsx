import { useEffect, useState } from "react";
import WorkflowEditor from "./components/WorkflowEditor";
import { Download, Bug, Rocket } from "lucide-react";
import "./index.css";
import { useWorkflowStore } from "./store/workflowStore";
import { WorkflowWebSocket } from "./utils/websocket";

function App() {
  const [currentWorkflowId, setCurrentWorkflowId] = useState<string>("abc123");
  const [socketInstance, setSocketInstance] =
    useState<WorkflowWebSocket | null>(null);
  const [isDebugModel, setIsDebugModel] = useState(false);
  const [workflowName, setWorkflowName] = useState<string>("Untitled Workflow");
  const { nodes, edges, updateNode, updateNodeStyle } = useWorkflowStore();

  const handleExportWorkflow = () => {
    // Create workflow data object
    const workflowData = {
      name: workflowName,
      nodes: nodes,
      edges: edges,
      exportedAt: new Date().toISOString(),
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(workflowData, null, 2);

    // Create blob and download link
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create temporary link element to trigger download
    const link = document.createElement("a");
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRuntimeMessage = (message: {
    isSuccess: boolean;
    nodeId: string;
    output: any;
    error?: string;
  }) => {
    if (message.isSuccess) {
      updateNodeStyle(message.nodeId, { border: "2px solid #10B981" });
    } else {
      updateNodeStyle(message.nodeId, { border: "2px solid #EF4444" });
      console.error(`Node ${message.nodeId} error:`, message.error);
    }
  };

  const handleRunWorkflow = () => {
    // 关闭现有连接
    socketInstance?.close();

    // 创建新连接
    const ws = new WorkflowWebSocket(currentWorkflowId);
    ws.connect(handleRuntimeMessage);
    setSocketInstance(ws);

    // Add your workflow execution logic heres
    console.log("Running workflow...");
    // Add your workflow execution logic here
    nodes
      .map((node) => ({
        ...node,
        data: {
          ...node.data,
          runtime: {
            input: node.data.label,
            output: node.data.label,
          },
        },
      }))
      .forEach((node) => {
        updateNode(node.id, node.data);
      });

    nodes[0]["style"] = { border: "1px solid red" };
    nodes[1]["style"] = { border: "1px solid green" };
    updateNodeStyle(nodes[0].id, nodes[0]["style"]);
    updateNodeStyle(nodes[1].id, nodes[1]["style"]);

    console.log(JSON.stringify(nodes));
    console.log(JSON.stringify(edges));
  };

  // 组件卸载时关闭连接
  useEffect(() => {
    return () => socketInstance?.close();
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">
              工作流编排器
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
            <button
              onClick={() => {
                setIsDebugModel((prevState) => !prevState);
              }}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Bug size={16} className="mr-1" />
              Debug
            </button>
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
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
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
    </div>
  );
}

export default App;
