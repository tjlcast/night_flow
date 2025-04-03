import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  Bot,
  ChartBar,
  Copy,
  Database,
  FilePlus,
  GitBranch,
  GitFork,
  GitMerge,
  Layers,
  Mail,
  MessageSquare,
  Server,
} from "lucide-react";

const nodeIcons: Record<string, JSX.Element> = {
  input: <FilePlus size={20} />,
  output: <Database size={20} />,
  transform: <Layers size={20} />,
  api: <Server size={20} />,
  webhook: <Copy size={20} />,
  notification: <Mail size={20} />,
  analytics: <ChartBar size={20} />,
  messaging: <MessageSquare size={20} />,
  conditional: <GitFork size={20} />,
  fanIn: <GitBranch size={20} />,
  fanOut: <GitMerge size={20} />,
  llm: <Bot size={20} />,
};

const CustomNode = ({ data, selected, id }: NodeProps) => {
  const icon = nodeIcons[data.type] || <Database size={20} />;

  // Default number of outputs for fan-in and inputs for fan-out
  const parallelPaths = data.parallelPaths || 3;

  return (
    <div
      className={`
      relative min-w-[150px] max-w-[250px] bg-white border-2 rounded-lg shadow-sm
      ${selected ? "border-blue-500 shadow-blue-100" : "border-gray-200"}
    `}
    >
      {/* Default input handle */}
      {data.type !== "fanOut" ? (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      ) : (
        // Multiple input handles for fan-out node
        Array.from({ length: parallelPaths }).map((_, i) => {
          const position = (100 / (parallelPaths + 1)) * (i + 1);
          return (
            <Handle
              key={`in-${i}`}
              id={`in-${i}`}
              type="target"
              position={Position.Top}
              className="w-3 h-3 bg-purple-500 border-2 border-white"
              style={{ left: `${position}%` }}
            />
          );
        })
      )}

      <div className="px-4 py-3">
        <div className="flex items-center mb-1">
          <div className="mr-2 text-gray-600">{icon}</div>
          <span className="text-sm font-medium text-gray-800">
            {data.label}
          </span>
          <button
            className="mr-2 p-1 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
            title="复制 id"
            onClick={() => {
              navigator.clipboard.writeText(id);
            }}
          >
            <Copy size={16} />
          </button>
        </div>
        {data.action && (
          <div className="text-xs px-2 py-1 bg-gray-100 rounded-md text-gray-600 mt-1">
            {data.action}
          </div>
        )}
        {data.condition && (
          <div className="text-xs px-2 py-1 bg-blue-50 rounded-md text-blue-600 mt-1 border border-blue-100">
            条件: {data.condition}
          </div>
        )}
        {(data.type === "fanIn" || data.type === "fanOut") && (
          <div className="text-xs px-2 py-1 bg-purple-50 rounded-md text-purple-600 mt-1 border border-purple-100">
            并行路径: {data.parallelPaths || 3}
          </div>
        )}
        {/* 添加LLM节点的特定信息显示 */}
        {data.type === "llm" && (
          <>
            <div className="text-xs px-2 py-1 bg-green-50 rounded-md text-green-600 mt-1 border border-green-100">
              模型: {data.model || "CHAT"}
            </div>
            <div className="text-xs px-2 py-1 bg-green-50 rounded-md text-green-600 mt-1 border border-green-100">
              温度: {data.temperature || 0}
            </div>
            {data.runtime?.output && (
              <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
                <div className="font-medium mb-1">AI回复:</div>
                <div className="whitespace-pre-wrap">
                  {typeof data.runtime.output === "string"
                    ? data.runtime.output
                    : JSON.stringify(data.runtime.output, null, 2)}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* 添加API节点的特定信息显示 */}
      {data.type === "api" && (
        <>
          <div className="text-xs px-2 py-1 bg-green-50 rounded-md text-green-600 mt-1 border border-green-100">
            METHOD: {data.method || "GET"}
          </div>

          <div className="text-xs px-2 py-1 bg-green-50 rounded-md text-green-600 mt-1 border border-green-100">
            URL: {data.url}
          </div>

          {/* 美观的headers展示 */}
          {data.headers && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
              <div className="font-medium mb-1">请求头:</div>
              <div className="space-y-1">
                {(() => {
                  // 检查 data.headers 是否为字符串
                  const headers =
                    typeof data.headers === "string"
                      ? JSON.parse(data.headers) // 如果是字符串，先转换为 JSON 对象
                      : data.headers; // 否则直接使用

                  // 使用 Object.entries() 遍历 headers
                  return Object.entries(headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <div className="font-semibold text-gray-700 min-w-[100px]">
                        {key}:
                      </div>
                      <div className="text-gray-600 break-all">
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          )}

          {data.runtime?.output && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 border border-gray-200">
              <div className="font-medium mb-1">AI回复:</div>
              <div className="whitespace-pre-wrap">
                {typeof data.runtime.output === "string"
                  ? data.runtime.output.length > 30
                    ? data.runtime.output.substring(0, 30) + "……"
                    : data.runtime.output
                  : JSON.stringify(data.runtime.output, null, 2).length > 30
                  ? JSON.stringify(data.runtime.output, null, 2).substring(
                      0,
                      30
                    ) + "……"
                  : JSON.stringify(data.runtime.output, null, 2)}
              </div>
            </div>
          )}
        </>
      )}

      {data.type === "conditional" ? (
        <>
          <Handle
            id="true"
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-green-500 border-2 border-white"
            style={{ left: "30%" }}
          />
          <div
            className="absolute text-xs text-green-600 font-medium"
            style={{ bottom: -5, left: "25%" }}
          >
            True
          </div>

          <Handle
            id="false"
            type="source"
            position={Position.Bottom}
            className="w-3 h-3 bg-red-500 border-2 border-white"
            style={{ left: "70%" }}
          />
          <div
            className="absolute text-xs text-red-600 font-medium"
            style={{ bottom: -5, left: "65%" }}
          >
            False
          </div>
        </>
      ) : data.type === "fanIn" ? (
        // Multiple output handles for fan-in node
        Array.from({ length: parallelPaths }).map((_, i) => {
          const position = (100 / (parallelPaths + 1)) * (i + 1);
          return (
            <Handle
              key={`out-${i}`}
              id={`out-${i}`}
              type="source"
              position={Position.Bottom}
              className="w-3 h-3 bg-purple-500 border-2 border-white"
              style={{ left: `${position}%` }}
            />
          );
        })
      ) : data.type === "fanOut" ? (
        // Single output for fan-out
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-purple-500 border-2 border-white"
        />
      ) : (
        // Default output handle
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 bg-gray-400 border-2 border-white"
        />
      )}
    </div>
  );
};

export default memo(CustomNode);
