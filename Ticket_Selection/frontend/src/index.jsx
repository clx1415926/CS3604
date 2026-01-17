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
    // 先验证后端会话是否有效，再决定是否恢复
    fetch('http://localhost:8082/api/v1/auth/session', {
      headers: { Authorization: 'Bearer ' + sid }
    }).then(r => {
      if (r.ok) {
        // 会话有效，保存到 localStorage
        try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
        console.log('[Index] session valid, saved to localStorage');
      } else {
        // 会话无效（已退出或过期），清除本地存储
        try { localStorage.removeItem('SESSION_ID'); } catch (e) {}
        console.log('[Index] session invalid, cleared localStorage');
        try { window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } })); } catch (e) {}
      }
    }).catch(() => {
      // 网络错误时保守处理，不自动恢复会话
      console.log('[Index] session check failed, not restoring');
    });
    // 无论如何都清除 URL 中的 sid 参数
    params.delete('sid');
    const clean = url.origin + url.pathname + (params.toString() ? ('?' + params.toString()) : '') + url.hash;
    window.history.replaceState({}, document.title, clean);
    console.log('[Index] removed sid from URL, href now', clean);
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
