import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { ErrorBoundary } from './components/common/ErrorBoundary.jsx';
import { initGlobalErrorLogging } from './utils/errorLogger.js';
import './index.css';

initGlobalErrorLogging();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
