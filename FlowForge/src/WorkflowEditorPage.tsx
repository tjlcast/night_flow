// WorkflowEditorPage.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import WorkflowEditor from "./components/WorkflowEditor";
import { Download, Bug, BugOff, Rocket, Upload, ArrowLeft } from "lucide-react";
import "./index.css";
import { useWorkflowStore } from "./store/workflowStore";
import { WorkflowWebSocket } from "./utils/websocket";
import { ImportWorkflowModal } from "./components/ImportWorkflowModal";

export default function WorkflowEditorPage() {
  const { workflowId } = useParams();
  const navigate = useNavigate();
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

    const currentWorkflowId = workflowId ? workflowId : "abc123"
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
