import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

try {
  const params = new URLSearchParams(window.location.search || '');
  const sid = params.get('sid');
  if (sid) {
    try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
    const clean = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, clean);
  }
} catch (e) {}

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);