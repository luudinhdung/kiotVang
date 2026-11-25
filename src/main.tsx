import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { enableHybridCloudMode } from './utils/hybridApi';

// Enable Hybrid Mode: Uses SQLite backend on localhost, and automatically falls back
// to browser database on Vercel / iOS PWA / Android APK so all features work 100% online & offline!
enableHybridCloudMode();

// Register Service Worker for iOS & Android PWA Offline support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore SW registration errors in dev mode
    });
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
