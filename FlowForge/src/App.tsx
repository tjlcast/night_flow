import { useState } from 'react';
import WorkflowEditor from './components/WorkflowEditor';
import { Download, Bug } from 'lucide-react';
import './index.css';
import { useWorkflowStore } from './store/workflowStore';

function App() {
  const [workflowName, setWorkflowName] = useState<string>("Untitled Workflow");
  const { nodes, edges } = useWorkflowStore();

  const handleExportWorkflow = () => {
    // Create workflow data object
    const workflowData = {
      name: workflowName,
      nodes: nodes,
      edges: edges,
      exportedAt: new Date().toISOString()
    };

    // Convert to JSON string
    const jsonString = JSON.stringify(workflowData, null, 2);
    
    // Create blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create temporary link element to trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = `${workflowName.replace(/\s+/g, '_')}.json`;
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-800">工作流编排器</h1>
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
              onClick={handleExportWorkflow}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Download size={16} className="mr-1" />
              导出工作流
            </button>
            <button 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center"
            >
              <Bug size={16} className="mr-1" />
              Debug
            </button>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors">
              保存工作流
            </button>
          </div>
        </div>
      </header>
      <div className="flex-1 overflow-hidden">
        <WorkflowEditor />
      </div>
    </div>
  );
}

export default App;
