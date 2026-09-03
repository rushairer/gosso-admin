import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary';
import './i18n';
import './styles/tailwind.css';
import './index.css';
import './styles/tokens.css';
import './styles/design-system-alignment.css';
import './styles/accessibility.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
