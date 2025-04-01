// App.tsx (main entry)
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./Dashboard";
import WorkflowEditorPage from "./WorkflowEditorPage";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/workflow/new" element={<WorkflowEditorPage />} />
        <Route path="/workflow/:workflowId" element={<WorkflowEditorPage />} />
      </Routes>
    </Router>
  );
}

export default App;