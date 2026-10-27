import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './app/App';
import { markShellClasses } from './platform/tauri';
import './styles/app.css';

markShellClasses();

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root container is missing');
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
