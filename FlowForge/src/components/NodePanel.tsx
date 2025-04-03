import { useState, useEffect } from "react";
import { Node } from "reactflow";
import { ChevronDown, ChevronUp, Trash2, X } from "lucide-react";

import { Tooltip } from "@mui/material";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";

interface NodePanelProps {
  isDebugModel: boolean;
  node: Node;
  updateNodeData: (nodeId: string, newData: any) => void;
  deleteNode: (nodeId: string) => void;
  onClose: () => void;
}

export default function NodePanel({
  isDebugModel,
  node,
  updateNodeData,
  deleteNode,
  onClose,
}: NodePanelProps) {
  const [localLabel, setLocalLabel] = useState(node.data.label);
  const [localAction, setLocalAction] = useState(node.data.action || "未配置");
  const [localInput, setLocalInput] = useState(
    node.data?.runtime?.input || "No input"
  );
  const [localOutput, setLocalOutput] = useState(
    node.data?.runtime?.input || "No output"
  );
  const [localDescription, setLocalDescription] = useState(
    node.data.description || ""
  );
  const [localCondition, setLocalCondition] = useState(
    node.data.condition || ""
  );
  const [localParallelPaths, setLocalParallelPaths] = useState(
    node.data.parallelPaths || 3
  );

  // LLM
  const [localModel, setLocalModel] = useState(node.data.model || "CHAT");
  const [localTemperature, setLocalTemperature] = useState(
    node.data.temperature || 0
  );
  const [localMaxTokens, setLocalMaxTokens] = useState(
    node.data.maxTokens || 0
  );
  const [localMessages, setLocalMessages] = useState(
    node.data.messages || [{ role: "user", content: "" }]
  );

  // API
  const [localMethod, setLocalMethod] = useState(node.data.method || "GET");
  const [localUrl, setLocalUrl] = useState(
    node.data.url || "http://localhost:8080"
  );
  const [localHeaders, setLocalHeaders] = useState(
    node.data.headers || JSON.stringify({ "Content-Type": "application/json" })
  );
  const [localBody, setLocalBody] = useState(node.data.body || {});

  // Debug
  const [showDebugInfo, setShowDebugInfo] = useState(false);

  useEffect(() => {
    setLocalLabel(node.data.label);
    setLocalAction(node.data.action || "未配置");
    setLocalDescription(node.data.description || "");
    setLocalCondition(node.data.condition || "");
    setLocalParallelPaths(node.data.parallelPaths || 3);
    setLocalInput(node.data?.runtime?.input);
    setLocalOutput(node.data?.runtime?.output);

    setLocalModel(node.data.model || "CHAT");
    setLocalTemperature(node.data.temperature || 0);
    setLocalMaxTokens(node.data.maxTokens || 0);
    setLocalMessages(node.data.messages || [{ role: "user", content: "" }]);

    setLocalMethod(node.data.method || "GET");
    setLocalUrl(node.data.url || "http://localhost:8080");
    setLocalHeaders(node.data.headers || {});
    setLocalBody(node.data.body || {});
  }, [node]);

  const handleSave = () => {
    const updatedData: any = {
      label: localLabel,
      action: localAction,
      description: localDescription,
    };

    if (node.data.type === "conditional") {
      updatedData.condition = localCondition;
    }

    if (node.data.type === "fanIn" || node.data.type === "fanOut") {
      updatedData.parallelPaths = parseInt(localParallelPaths.toString(), 10);
    }

    if (node.data.type === "llm") {
      updatedData.model = localModel;
      updatedData.temperature = parseFloat(localTemperature.toString());
      updatedData.maxTokens = parseInt(localMaxTokens.toString(), 10);
      updatedData.messages = localMessages;
    }

    if (node.data.type === "api") {
      updatedData.method = localMethod;
      updatedData.url = localUrl;
      updatedData.headers = localHeaders;
      updatedData.body = localBody;
    }

    updateNodeData(node.id, updatedData);
  };

  const handleDelete = () => {
    deleteNode(node.id);
  };

  return (
    <div className="w-80 border-l border-gray-200 bg-white overflow-auto">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-800">节点详情</h3>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={18} />
        </button>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            节点名称
          </label>
          <input
            type="text"
            value={localLabel}
            onChange={(e) => setLocalLabel(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            节点类型
          </label>
          <div className="px-3 py-2 border border-gray-300 bg-gray-50 rounded-md shadow-sm sm:text-sm">
            {node.data.type}
          </div>
        </div>
        {node.data.type === "conditional" && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              条件表达式
              <Tooltip
                title="${input.xxx}上一个执行节点的输出，${context.nodeid.input|output} 已经执行的节点输入输出"
                placement="top"
                arrow
              >
                <HelpOutlineIcon
                  fontSize="small"
                  className="ml-1 text-gray-400 hover:text-gray-600 cursor-help"
                />
              </Tooltip>
            </label>
            <input
              type="text"
              value={localCondition}
              onChange={(e) => setLocalCondition(e.target.value)}
              onBlur={handleSave}
              placeholder="例如: value > 10"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        )}
        {(node.data.type === "fanIn" || node.data.type === "fanOut") && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              并行路径数量
            </label>
            <input
              type="number"
              min="2"
              max="6"
              value={localParallelPaths}
              onChange={(e) =>
                setLocalParallelPaths(parseInt(e.target.value, 10))
              }
              onBlur={handleSave}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">
              {node.data.type === "fanIn" ? "输出路径数量" : "输入路径数量"}{" "}
              (2-6)
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            动作配置
          </label>
          <input
            type="text"
            value={localAction}
            onChange={(e) => setLocalAction(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            描述
          </label>
          <textarea
            rows={4}
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            onBlur={handleSave}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* // 在返回的JSX中添加LLM节点的配置表单 */}
        {node.data.type === "llm" && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                模型
              </label>
              <select
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                onBlur={handleSave}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="CHAT">通用对话</option>
                {/* <option value="TEXT">文本生成</option> */}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                温度 (0-1)
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={localTemperature}
                onChange={(e) =>
                  setLocalTemperature(parseFloat(e.target.value))
                }
                onBlur={handleSave}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                最大Token数 (0表示不限制)
              </label>
              <input
                type="number"
                min="0"
                value={localMaxTokens}
                onChange={(e) =>
                  setLocalMaxTokens(parseInt(e.target.value, 10))
                }
                onBlur={handleSave}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                对话消息
              </label>
              {localMessages.map(
                (msg: { role: string; content: string }, index: number) => (
                  <div key={index} className="mb-2">
                    <select
                      value={msg.role}
                      onChange={(e) => {
                        const newMessages = [...localMessages];
                        newMessages[index].role = e.target.value;
                        setLocalMessages(newMessages);
                        handleSave();
                      }}
                      className="w-full mb-1 px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
                    >
                      <option value="user">用户</option>
                      <option value="assistant">助手</option>
                      <option value="system">系统</option>
                    </select>
                    <textarea
                      value={msg.content}
                      onChange={(e) => {
                        const newMessages = [...localMessages];
                        newMessages[index].content = e.target.value;
                        setLocalMessages(newMessages);
                        handleSave();
                      }}
                      rows={2}
                      className="w-full px-2 py-1 border border-gray-300 rounded-md shadow-sm text-sm"
                    />
                    <button
                      onClick={() => {
                        const newMessages = localMessages.filter(
                          (_: any, i: number) => i !== index
                        );
                        setLocalMessages(newMessages);

                        // 直接使用 newMessages 更新节点数据，而不是等待状态更新
                        const updatedData = {
                          ...node.data,
                          messages: newMessages,
                        };
                        updateNodeData(node.id, updatedData);
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      - 删除消息
                    </button>
                  </div>
                )
              )}
              <button
                onClick={() => {
                  setLocalMessages([
                    ...localMessages,
                    { role: "user", content: "" },
                  ]);
                  handleSave();
                }}
                className="mt-1 text-xs text-blue-500 hover:text-blue-700"
              >
                + 添加消息
              </button>
            </div>
          </>
        )}

        {/* API节点配置表单 */}
        {node.data.type === "api" && (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                请求方法
              </label>
              <select
                value={localMethod}
                onChange={(e) => setLocalMethod(e.target.value)}
                onBlur={handleSave}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                请求URL
                <Tooltip title="支持${xxx}占位符" placement="top" arrow>
                  <HelpOutlineIcon
                    fontSize="small"
                    className="ml-1 text-gray-400 hover:text-gray-600 cursor-help"
                  />
                </Tooltip>
              </label>
              <input
                type="text"
                value={localUrl}
                onChange={(e) => setLocalUrl(e.target.value)}
                onBlur={handleSave}
                placeholder="https://api.example.com/endpoint"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                请求头
              </label>
              <textarea
                value={localHeaders}
                onChange={(e) => setLocalHeaders(e.target.value)}
                onBlur={handleSave}
                placeholder={
                  '{\n  "Content-Type": "application/json",\n  "Authorization": "Bearer token"\n}'
                }
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
              />
            </div>

            {localMethod !== "GET" && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  请求体
                  <Tooltip title="支持${xxx}占位符" placement="top" arrow>
                    <HelpOutlineIcon
                      fontSize="small"
                      className="ml-1 text-gray-400 hover:text-gray-600 cursor-help"
                    />
                  </Tooltip>
                </label>
                <textarea
                  value={localBody}
                  onChange={(e) => setLocalBody(e.target.value)}
                  onBlur={handleSave}
                  placeholder={'{\n  "key": "value"\n}'}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm font-mono"
                />
              </div>
            )}

            {/* <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                超时时间(ms)
              </label>
              <input
                type="number"
                value={localTimeout}
                onChange={(e) => setLocalTimeout(parseInt(e.target.value))}
                onBlur={handleSave}
                placeholder="5000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div> */}
          </>
        )}

        {!isDebugModel && (
          <div className="pt-2">
            <button
              onClick={handleDelete}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <Trash2 size={16} className="mr-2" />
              删除节点
            </button>
          </div>
        )}
        {isDebugModel && (
          <div>
            <hr className="my-4" />
            <button
              onClick={() => setShowDebugInfo(!showDebugInfo)}
              className="flex items-center justify-between w-full p-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md"
            >
              <span>调试信息</span>
              {showDebugInfo ? (
                <ChevronUp size={16} />
              ) : (
                <ChevronDown size={16} />
              )}
            </button>

            {showDebugInfo && (
              <div className="mt-2 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Input
                  </label>
                  <textarea
                    rows={4}
                    value={JSON.stringify(localInput, null, 2)}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleSave}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Output
                  </label>
                  <textarea
                    rows={4}
                    value={JSON.stringify(localOutput, null, 2)}
                    onChange={(e) => setLocalDescription(e.target.value)}
                    onBlur={handleSave}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
