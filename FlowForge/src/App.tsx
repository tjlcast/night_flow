// App.tsx or your main routing component
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import WorkflowEditorPage from './WorkflowEditorPage'; // Your existing workflow editor component
import MachineManager from './MachineManager'; // You'll need to create this component

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workflow/new" element={<WorkflowEditorPage />} />
        <Route path="/workflow/:id" element={<WorkflowEditorPage />} />
        <Route path="/machine-manager" element={<MachineManager />} />
      </Routes>
    </Router>
  );
}

export default App;