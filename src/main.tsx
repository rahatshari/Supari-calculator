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

function mountApp() {
  const container = document.getElementById('root');
  if (!container) return;

  window.__APP_MOUNTED__ = true;
  document.body.classList.add('app-ready');

  const root = createRoot(container);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>
  );
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}
