// Dashboard.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Edit } from "lucide-react";

interface Workflow {
  id: string;
  name: string;
  updatedAt: string;
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState<Workflow[]>([
    { id: "1", name: "Marketing Campaign", updatedAt: "2023-05-15" },
    { id: "2", name: "Data Processing", updatedAt: "2023-05-10" },
    { id: "3", name: "Customer Onboarding", updatedAt: "2023-05-01" },
  ]);

  const handleDeleteWorkflow = (id: string) => {
    setWorkflows(workflows.filter(workflow => workflow.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Workflow Dashboard</h1>
          <Link
            to="/workflow/new"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus size={16} className="mr-2" />
            New Workflow
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-800">{workflow.name}</h3>
                <div className="flex space-x-2">
                  <Link
                    to={`/workflow/${workflow.id}`}
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
    </div>
  );
}