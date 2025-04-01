import { Download } from "lucide-react";
import { useEffect, useState } from "react";

// In your ImportWorkflowModal component, add these props:
interface ImportWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport?: (jsonData: any) => void;
  defaultValue?: string;
  isExportMode?: boolean;
  onDownload?: () => void;
}

// Then modify the modal content based on the mode:
export function ImportWorkflowModal({
  isOpen,
  onClose,
  onImport,
  defaultValue = "",
  isExportMode = false,
  onDownload,
}: ImportWorkflowModalProps) {
  const [jsonInput, setJsonInput] = useState(defaultValue);

  useEffect(() => {
    setJsonInput(defaultValue);
  }, [defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">
          {isExportMode ? "导出工作流" : "导入工作流"}
        </h2>
        <textarea
          className="w-full h-64 p-3 border border-gray-300 rounded-md mb-4 font-mono text-sm"
          value={jsonInput}
          placeholder='{"name": "Workflow Name", "nodes": [...], "edges": [...]}'
          onChange={(e) => setJsonInput(e.target.value)}
          readOnly={isExportMode}
        />
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300"
          >
            取消
          </button>
          {isExportMode ? (
            <button
              onClick={onDownload}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
            >
              <Download size={16} className="mr-1" />
              下载
            </button>
          ) : (
            <button
              onClick={() => {
                try {
                  const jsonData = JSON.parse(jsonInput);
                  onImport?.(jsonData);
                } catch (error) {
                  alert("无效的JSON格式");
                }
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              导入
            </button>
          )}
        </div>
      </div>
    </div>
  );
}