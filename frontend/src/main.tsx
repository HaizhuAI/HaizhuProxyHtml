import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';

import './styles/tokens.css';
import './styles/base.css';
import './styles/responsive.css';
import './index.css';

import App from './App';
import { ensureDemoSession } from './lib/api';

ensureDemoSession();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
