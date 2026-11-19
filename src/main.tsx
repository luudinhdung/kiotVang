import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { enableHybridCloudMode } from './utils/hybridApi';

// Enable Hybrid Mode: Uses SQLite backend on localhost, and automatically falls back
// to browser database on Vercel / Netlify so all features work 100% online for free!
enableHybridCloudMode();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
