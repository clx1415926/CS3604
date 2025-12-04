import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

try {
  console.log('[Index] boot', window.location.href);
  const url = new URL(window.location.href);
  const params = url.searchParams;
  const sid = params.get('sid');
  console.log('[Index] href before', url.toString());
  if (sid) {
    try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
    params.delete('sid');
    const clean = url.origin + url.pathname + (params.toString() ? ('?' + params.toString()) : '') + url.hash;
    window.history.replaceState({}, document.title, clean);
    console.log('[Index] removed sid, href now', clean);
  }
} catch (e) {}

window.addEventListener('popstate', () => { try { console.log('[Index] popstate', window.location.href); } catch(e){} });
window.addEventListener('hashchange', () => { try { console.log('[Index] hashchange', window.location.href); } catch(e){} });
document.addEventListener('DOMContentLoaded', () => { try { console.log('[Index] DOMContentLoaded', window.location.href); } catch(e){} });
document.addEventListener('visibilitychange', () => { try { console.log('[Index] visibilitychange', document.visibilityState); } catch(e){} });
window.addEventListener('beforeunload', () => { try { console.log('[Index] beforeunload', window.location.href); } catch(e){} });
window.addEventListener('unload', () => { try { console.log('[Index] unload'); } catch(e){} });

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
