import { useState } from 'react';
import { X } from 'lucide-react';

interface ImportWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

export default function ImportWorkflowModal({ isOpen, onClose, onImport }: ImportWorkflowModalProps) {
  const [jsonInput, setJsonInput] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    try {
      // Check if input is empty
      if (!jsonInput.trim()) {
        setError('请输入工作流JSON数据');
        return;
      }
      
      // Parse the JSON input
      const parsedData = JSON.parse(jsonInput);
      
      // Basic validation
      if (!parsedData.nodes || !Array.isArray(parsedData.nodes)) {
        setError('工作流数据需要包含nodes数组');
        return;
      }
      
      if (!parsedData.edges || !Array.isArray(parsedData.edges)) {
        setError('工作流数据需要包含edges数组');
        return;
      }
      
      // Clear any previous errors
      setError(null);
      
      // Pass the data back for import
      onImport(parsedData);
    } catch (err) {
      setError('JSON格式无效，请检查输入');
      console.error('JSON parsing error:', err);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    // Close modal when clicking on backdrop (not modal content)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">导入工作流</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 flex-1 overflow-auto">
          <div className="mb-4">
            <label htmlFor="workflow-json" className="block mb-2 text-sm font-medium text-gray-700">
              请粘贴工作流JSON数据：
            </label>
            <textarea
              id="workflow-json"
              rows={12}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm font-mono"
              placeholder='{"name": "Workflow Name", "nodes": [...], "edges": [...]}'
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
            />
            {error && (
              <p className="mt-2 text-sm text-red-600">{error}</p>
            )}
          </div>
        </div>
        
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            取消
          </button>
          <button
            onClick={handleImport}
            className="px-4 py-2 bg-blue-600 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
