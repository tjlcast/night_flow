// Dashboard.tsx
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Plus, Trash2, Edit, Server } from "lucide-react";
// @ts-ignore
import { create } from "zustand";

interface Workflow {
  id: string;
  name: string;
  updatedAt: string;
  config: any;
}

export default function Dashboard() {
  // const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [workflows, setWorkflows] = useState<Workflow[]>([
    // {
    //   id: "1",
    //   name: "Multiple LLMs",
    //   updatedAt: "2023-05-15",
    //   config: {
    //     name: "Multiple LLMs",
    //     nodes: [
    //       {
    //         id: "node-oscmxd5c",
    //         type: "customNode",
    //         position: {
    //           x: 360,
    //           y: 135,
    //         },
    //         data: {
    //           label: "数据输入",
    //           type: "input",
    //           action: "未配置",
    //           description: "",
    //           runtime: {
    //             input: null,
    //             isSuccess: true,
    //             nodeId: "node-oscmxd5c",
    //             output: "未配置",
    //           },
    //         },
    //         width: 150,
    //         height: 76,
    //         style: {},
    //       },
    //       {
    //         id: "node-zdqwk4be",
    //         type: "customNode",
    //         position: {
    //           x: 285,
    //           y: 240,
    //         },
    //         data: {
    //           label: "If/Else 条件",
    //           type: "conditional",
    //           action: "未配置",
    //           description: "",
    //           condition: "1 == 1",
    //           runtime: {
    //             input: "未配置",
    //             isSuccess: true,
    //             nodeId: "node-zdqwk4be",
    //             output: true,
    //           },
    //         },
    //         width: 150,
    //         height: 105,
    //         selected: false,
    //         dragging: false,
    //         style: {},
    //       },
    //       {
    //         id: "node-xop8rnk4",
    //         type: "customNode",
    //         position: {
    //           x: 195,
    //           y: 375,
    //         },
    //         data: {
    //           label: "大模型对话",
    //           type: "llm",
    //           action: "未配置",
    //           description: "",
    //           model: "CHAT",
    //           temperature: 0,
    //           maxTokens: 0,
    //           messages: [
    //             {
    //               role: "user",
    //               content: "你好",
    //             },
    //           ],
    //           runtime: {
    //             input: true,
    //             isSuccess: true,
    //             nodeId: "node-xop8rnk4",
    //             output: "你好！有什么可以帮助你的吗？",
    //           },
    //         },
    //         width: 225,
    //         height: 200,
    //         selected: true,
    //         positionAbsolute: {
    //           x: 195,
    //           y: 375,
    //         },
    //         dragging: false,
    //         style: {},
    //       },
    //       {
    //         id: "node-s0ndjb3y",
    //         type: "customNode",
    //         position: {
    //           x: 480,
    //           y: 390,
    //         },
    //         data: {
    //           label: "大模型对话",
    //           type: "llm",
    //           action: "未配置",
    //           description: "",
    //           model: "CHAT",
    //           temperature: 0,
    //           maxTokens: 0,
    //           messages: [
    //             {
    //               role: "user",
    //               content: "你是谁？",
    //             },
    //           ],
    //         },
    //         width: 150,
    //         height: 135,
    //         selected: false,
    //         positionAbsolute: {
    //           x: 480,
    //           y: 390,
    //         },
    //         dragging: false,
    //         style: {},
    //       },
    //     ],
    //     edges: [
    //       {
    //         source: "node-zdqwk4be",
    //         sourceHandle: "true",
    //         target: "node-xop8rnk4",
    //         targetHandle: null,
    //         animated: true,
    //         style: {
    //           stroke: "#555",
    //           strokeWidth: 2,
    //         },
    //         id: "reactflow__edge-node-zdqwk4betrue-node-xop8rnk4",
    //       },
    //       {
    //         source: "node-zdqwk4be",
    //         sourceHandle: "false",
    //         target: "node-s0ndjb3y",
    //         targetHandle: null,
    //         animated: true,
    //         style: {
    //           stroke: "#555",
    //           strokeWidth: 2,
    //         },
    //         id: "reactflow__edge-node-zdqwk4befalse-node-s0ndjb3y",
    //       },
    //       {
    //         source: "node-oscmxd5c",
    //         sourceHandle: null,
    //         target: "node-zdqwk4be",
    //         targetHandle: null,
    //         animated: true,
    //         style: {
    //           stroke: "#555",
    //           strokeWidth: 2,
    //         },
    //         id: "reactflow__edge-node-oscmxd5c-node-zdqwk4be",
    //       },
    //     ],
    //     exportedAt: "2025-04-01T15:14:50.562Z",
    //   },
    // },
    // {
    //   id: "2",
    //   name: "Data Processing",
    //   updatedAt: "2023-05-10",
    //   config: {
    //     name: "Data Processing",
    //     nodes: [],
    //     edges: [],
    //   },
    // },
    // {
    //   id: "3",
    //   name: "Customer Onboarding",
    //   updatedAt: "2023-05-01",
    //   config: {
    //     name: "Customer Onboarding",
    //     nodes: [],
    //     edges: [],
    //   },
    // },
  ]);
  // @ts-ignore
  const [loading, setLoading] = useState(true);
  // @ts-ignore
  const [error, setError] = useState<string | null>(null);

  // load workflow from db
  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        setLoading(true);

        const ip = import.meta.env.VITE_WORKFLOW_IP;
        const port = import.meta.env.VITE_WORKFLOW_PORT;
        // Fetch all workflows
        const response = await fetch(`http://${ip}:${port}/api/workflows/`);
        if (!response.ok) {
          throw new Error("Failed to fetch workflows");
        }
        const data = await response.json();

        // Transform the API response to match your frontend structure
        const transformedWorkflows = data.map((workflow: any) => ({
          id: workflow.id.toString(),
          name: workflow.name,
          updatedAt: workflow.updated_at,
          config: {
            ...workflow.config,
            name: workflow.name,
            exportedAt: workflow.config.exportedAt || workflow.exported_at,
          },
        }));

        // const updatedWorkFlows = [...workflows, ...transformedWorkflows];
        const updatedWorkFlows = transformedWorkflows;
        setWorkflows(updatedWorkFlows);
        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        // Fallback to initial data if API fails
        setWorkflows([
          {
            id: "1",
            name: "Multiple LLMs",
            updatedAt: "2023-05-15",
            config: {
              name: "Multiple LLMs",
              nodes: [
                {
                  id: "node-oscmxd5c",
                  type: "customNode",
                  position: { x: 360, y: 135 },
                  data: {
                    label: "数据输入",
                    type: "input",
                    action: "未配置",
                    description: "",
                    runtime: {
                      input: null,
                      isSuccess: true,
                      nodeId: "node-oscmxd5c",
                      output: "未配置",
                    },
                  },
                  width: 150,
                  height: 76,
                  style: {},
                },
                {
                  id: "node-zdqwk4be",
                  type: "customNode",
                  position: { x: 285, y: 240 },
                  data: {
                    label: "If/Else 条件",
                    type: "conditional",
                    action: "未配置",
                    description: "",
                    condition: "1 == 1",
                    runtime: {
                      input: "未配置",
                      isSuccess: true,
                      nodeId: "node-zdqwk4be",
                      output: true,
                    },
                  },
                  width: 150,
                  height: 105,
                  selected: false,
                  dragging: false,
                  style: {},
                },
                {
                  id: "node-xop8rnk4",
                  type: "customNode",
                  position: { x: 195, y: 375 },
                  data: {
                    label: "大模型对话",
                    type: "llm",
                    action: "未配置",
                    description: "",
                    model: "CHAT",
                    temperature: 0,
                    maxTokens: 0,
                    messages: [{ role: "user", content: "你好" }],
                    runtime: {
                      input: true,
                      isSuccess: true,
                      nodeId: "node-xop8rnk4",
                      output: "你好！有什么可以帮助你的吗？",
                    },
                  },
                  width: 225,
                  height: 200,
                  selected: true,
                  positionAbsolute: { x: 195, y: 375 },
                  dragging: false,
                  style: {},
                },
                {
                  id: "node-s0ndjb3y",
                  type: "customNode",
                  position: { x: 480, y: 390 },
                  data: {
                    label: "大模型对话",
                    type: "llm",
                    action: "未配置",
                    description: "",
                    model: "CHAT",
                    temperature: 0,
                    maxTokens: 0,
                    messages: [{ role: "user", content: "你是谁？" }],
                  },
                  width: 150,
                  height: 135,
                  selected: false,
                  positionAbsolute: { x: 480, y: 390 },
                  dragging: false,
                  style: {},
                },
              ],
              edges: [
                {
                  source: "node-zdqwk4be",
                  sourceHandle: "true",
                  target: "node-xop8rnk4",
                  targetHandle: null,
                  animated: true,
                  style: { stroke: "#555", strokeWidth: 2 },
                  id: "reactflow__edge-node-zdqwk4betrue-node-xop8rnk4",
                },
                {
                  source: "node-zdqwk4be",
                  sourceHandle: "false",
                  target: "node-s0ndjb3y",
                  targetHandle: null,
                  animated: true,
                  style: { stroke: "#555", strokeWidth: 2 },
                  id: "reactflow__edge-node-zdqwk4befalse-node-s0ndjb3y",
                },
                {
                  source: "node-oscmxd5c",
                  sourceHandle: null,
                  target: "node-zdqwk4be",
                  targetHandle: null,
                  animated: true,
                  style: { stroke: "#555", strokeWidth: 2 },
                  id: "reactflow__edge-node-oscmxd5c-node-zdqwk4be",
                },
              ],
              exportedAt: "2025-04-01T15:14:50.562Z",
            },
          },
          {
            id: "2",
            name: "Data Processing",
            updatedAt: "2023-05-10",
            config: { name: "Data Processing", nodes: [], edges: [] },
          },
          {
            id: "3",
            name: "Customer Onboarding",
            updatedAt: "2023-05-01",
            config: { name: "Customer Onboarding", nodes: [], edges: [] },
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, []);

  // delete workflow from db
  // Function to delete a workflow
  const deleteWorkflow = async (id: string) => {
    try {
      const ip = import.meta.env.VITE_WORKFLOW_IP;
      const port = import.meta.env.VITE_WORKFLOW_PORT;
      const response = await fetch(`http://${ip}:${port}/api/workflows/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete workflow");
      }

      setWorkflows((prev) => prev.filter((w) => w.id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to delete workflow"
      );
      throw err;
    }
  };

  const navigate = useNavigate();

  const handleDeleteWorkflow = (id: string) => {
    try {
      deleteWorkflow(id);
    } catch (err) {
      console.error(err);
    }
    setWorkflows(workflows.filter((workflow) => workflow.id !== id));
  };

  const handleNavigateToMachineManager = () => {
    navigate("/machine-manager");
  };

  // 添加状态控制信息框显示
  const [showJialtangInfoModal, setShowJialtangInfoModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Toolbar */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-8 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold text-gray-800">
            Workflow Dashboard
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={handleNavigateToMachineManager}
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
            >
              <Server size={16} className="mr-2" />
              Machine Manager
            </button>
            <Link
              to="/workflow/new"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              <Plus size={16} className="mr-2" />
              New Workflow
            </Link>
            {/* <Link
              to="/workflow/new"
              className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
              onClick={(e) => {
                e.preventDefault(); // 阻止默认跳转行为
                // 准备要创建的工作流数据
                const newWorkflowData = {
                  name: "New Workflow Example",
                  updatedAt: new Date().toISOString(),
                  config: {
                    name: "New Workflow Example",
                    nodes: [
                      {
                        id: "node-1",
                        type: "customNode",
                        position: { x: 100, y: 100 },
                        data: {
                          label: "New Node",
                          type: "input",
                          action: "未配置",
                          description: "",
                        },
                        width: 150,
                        height: 76,
                      },
                    ],
                    edges: [],
                    exportedAt: new Date().toISOString(),
                  },
                };
                createWorkflow(newWorkflowData);
                // createWorkflow(newWorkflowData); // 调用你的函
                // window.location.href = "/workflow/new"; // 手动跳转
              }}
            >
              <Plus size={16} className="mr-2" />
              New Workflow
            </Link> */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-800">
                  {workflow.name}
                </h3>
                <div className="flex space-x-2">
                  <Link
                    to={`/workflow/${workflow.id}`}
                    state={{ workflowConfig: workflow.config }}
                    className="text-gray-500 hover:text-blue-600"
                    title="Edit"
                  >
                    <Edit size={16} />
                  </Link>
                  <button
                    onClick={() => handleDeleteWorkflow(workflow.id)}
                    className="text-gray-500 hover:text-red-600"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Last updated: {workflow.updatedAt}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {/* <footer className="fixed bottom-0 left-0 right-0 py-4 bg-white border-t border-gray-200 text-center text-gray-500">
        Power by jialtang
      </footer> */}
      <footer className="fixed bottom-0 left-0 right-0 py-4 bg-white border-t border-gray-200 text-center">
        <button
          onClick={() => setShowJialtangInfoModal(true)}
          className="text-blue-600 hover:text-blue-800 hover:underline"
        >
          Power by jialtang
        </button>
      </footer>

      {/* 信息框模态框 */}
      {showJialtangInfoModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">关于 jialtang</h3>
            <p className="mb-4">
              jialtang写的？什么鬼！大模型写的！
              <br />
              赞美Deepseek！
              <br />
              赞美太阳！
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setShowJialtangInfoModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
