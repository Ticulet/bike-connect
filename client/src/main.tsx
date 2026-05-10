import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ToastProvider } from './components/ui/ToastProvider.js';
import './index.css';
import App from './App.js';

const root = document.getElementById('root');
if (root == null) throw new Error('Root element not found');

createRoot(root).render(
  <StrictMode>
    <ToastProvider>
      <App />
    </ToastProvider>
  </StrictMode>,
);
