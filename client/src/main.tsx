import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';

import './index.css';
import App from './App.tsx';

// Error handling for production
const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Failed to find the root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <HelmetProvider>
      <App />
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)'
          }
        }}
      />
    </HelmetProvider>
  </StrictMode>
);