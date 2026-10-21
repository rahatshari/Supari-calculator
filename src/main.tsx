import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { App } from './App';
import { ErrorBoundary } from './components/ErrorBoundary';

declare global {
  interface Window {
    __APP_MOUNTED__?: boolean;
  }
}

const container = document.getElementById('root');
if (container) {
  window.__APP_MOUNTED__ = true;
  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
} else {
  console.error('Fatal: #root element not found in DOM');
}
