// App.tsx or your main routing component
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import WorkflowEditorPage from './WorkflowEditorPage'; // Your existing workflow editor component
import MachineManager from './MachineManager'; // You'll need to create this component
import DocumentEditorPage from './DocumentEditorPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workflow/new" element={<WorkflowEditorPage />} />
        <Route path="/document/new" element={<DocumentEditorPage />} />
        <Route path="/workflow/:workflowId" element={<WorkflowEditorPage />} />
        <Route path="/machine-manager" element={<MachineManager />} />
      </Routes>
    </Router>
  );
}

export default App;