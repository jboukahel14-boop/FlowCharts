import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import WorkflowEditor from './pages/WorkflowEditor.jsx';
import WorkflowsList from './pages/WorkflowsList.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<WorkflowsList />} />
        <Route path="/workflows/:id" element={<WorkflowEditor />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
