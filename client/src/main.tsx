// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from 'sonner'; // Add toast notifications
import './index.css';
import App from './App.tsx';

// Error handling for production
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right" 
      richColors 
      closeButton
      toastOptions={{
        duration: 4000,
        style: { background: '#fff', color: '#1f2937' }
      }}
    />
  </StrictMode>
);