import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Link } from 'react-router-dom';
import { NavigationProvider, TooltipProvider } from '@gouno/ui/core';
import { ThemeProvider } from '@gouno/ui/theme';
import './i18n';
import './styles/tailwind.css';
import './styles/accessibility.css';
import App from './App';
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider brand="gosso-admin" storageKey="gosso-admin:theme">
      <NavigationProvider link={Link}>
        <TooltipProvider>
          <App />
        </TooltipProvider>
      </NavigationProvider>
    </ThemeProvider>
  </StrictMode>
);
