import { useState, useEffect } from "react";
import { Node } from "reactflow";
import { Trash2, X } from "lucide-react";

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
  const [localInput, setLocalInput] = useState(node.data?.runtime?.input || "No input");
  const [localOutput, setLocalOutput] = useState(node.data?.runtime?.input || "No output");
  const [localDescription, setLocalDescription] = useState(
    node.data.description || ""
  );
  const [localCondition, setLocalCondition] = useState(
    node.data.condition || ""
  );
  const [localParallelPaths, setLocalParallelPaths] = useState(
    node.data.parallelPaths || 3
  );

  useEffect(() => {
    setLocalLabel(node.data.label);
    setLocalAction(node.data.action || "未配置");
    setLocalDescription(node.data.description || "");
    setLocalCondition(node.data.condition || "");
    setLocalParallelPaths(node.data.parallelPaths || 3);
    setLocalInput(node.data?.runtime?.input || "No input");
    setLocalOutput(node.data?.runtime?.output || "No output");
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
    </div>
  );
}
