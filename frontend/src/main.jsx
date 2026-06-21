import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast';
import { ReactFlowProvider } from '@xyflow/react';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ReactFlowProvider>
      <App />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#16161f',
            color: '#e5e7eb',
            border: '1px solid #2a2a3e',
            borderRadius: '12px',
          },
        }}
      />
    </ReactFlowProvider>
  </React.StrictMode>,
);
