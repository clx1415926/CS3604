/**
 * Unified Authentication Middleware
 * Shared module for all pages, validates session state via backend
 * Backend is the single source of truth, frontend only caches
 */

const AUTH_CONFIG = {
  // Auth service endpoints (by priority)
  authBases: [
    'http://localhost:8082/api/v1',
    'http://localhost:8080/api/v1',
  ],
  // Session check interval (ms)
  pollInterval: 3000,
  // Request timeout (ms)
  timeout: 3000,
};

// Current session state (cache)
let _sessionState = {
  sid: null,
  user: null,
  logged: false,
  lastCheck: 0,
};

// State change listeners
const _listeners = new Set();

/**
 * Get sid from multiple sources (without auto-saving)
 */
function getSidFromSources() {
  try {
    // From URL hash
    const hashMatch = (window.location.hash || '').match(/sid=([^&]+)/);
    if (hashMatch) return decodeURIComponent(hashMatch[1]);
    
    // From URL search params
    const searchMatch = (window.location.search || '').match(/sid=([^&]+)/);
    if (searchMatch) return decodeURIComponent(searchMatch[1]);
    
    // From sessionStorage
    const fromSession = sessionStorage.getItem('session_id');
    if (fromSession) return fromSession;
    
    // From localStorage
    const fromLocal = localStorage.getItem('SESSION_ID');
    if (fromLocal) return fromLocal;
    
    return null;
  } catch (e) {
    return null;
  }
}

/**
 * Verify session with backend
 */
async function verifySession(sid) {
  if (!sid) return { valid: false, user: null };
  
  for (const base of AUTH_CONFIG.authBases) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), AUTH_CONFIG.timeout);
      
      const response = await fetch(`${base}/auth/session/profile`, {
        headers: { 'Authorization': 'Bearer ' + sid },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        if (data && (data.username || data.name)) {
          return { valid: true, user: data };
        }
      }
    } catch (e) {
      // Try next base
    }
  }
  
  return { valid: false, user: null };
}

/**
 * Notify all listeners of state change
 */
function notifyListeners(state) {
  _listeners.forEach(cb => {
    try { cb(state); } catch (e) {}
  });
}

/**
 * Update local storage based on session state
 */
function syncStorage(sid, user) {
  try {
    if (sid && user) {
      localStorage.setItem('SESSION_ID', sid);
      sessionStorage.setItem('session_id', sid);
      const nick = (user.username || '') + (user.name ? '(' + user.name + ')' : '');
      localStorage.setItem('UC_NICK', nick);
    } else {
      localStorage.removeItem('SESSION_ID');
      sessionStorage.removeItem('session_id');
      localStorage.removeItem('UC_NICK');
      sessionStorage.removeItem('UC_NICK');
    }
  } catch (e) {}
}

/**
 * Clean URL parameters (remove sid)
 */
function cleanUrl() {
  try {
    const params = new URLSearchParams(window.location.search);
    if (params.has('sid')) {
      params.delete('sid');
      const newUrl = window.location.origin + window.location.pathname + 
        (params.toString() ? '?' + params.toString() : '') + 
        (window.location.hash || '');
      window.history.replaceState({}, document.title, newUrl);
    }
  } catch (e) {}
}

/**
 * Check authentication status
 */
async function checkAuth(force = false) {
  const now = Date.now();
  
  // Use cache if checked recently and not forced
  if (!force && _sessionState.lastCheck > 0 && (now - _sessionState.lastCheck) < 1000) {
    return { logged: _sessionState.logged, user: _sessionState.user, sid: _sessionState.sid };
  }
  
  const sid = getSidFromSources();
  
  if (!sid) {
    // No session ID found
    const newState = { logged: false, user: null, sid: null };
    const changed = _sessionState.logged !== false;
    _sessionState = { ...newState, lastCheck: now };
    syncStorage(null, null);
    if (changed) notifyListeners(newState);
    return newState;
  }
  
  // Verify with backend
  const result = await verifySession(sid);
  
  if (result.valid) {
    const newState = { logged: true, user: result.user, sid: sid };
    const changed = !_sessionState.logged || _sessionState.sid !== sid;
    _sessionState = { ...newState, lastCheck: now };
    syncStorage(sid, result.user);
    cleanUrl();
    if (changed) notifyListeners(newState);
    return newState;
  } else {
    // Session invalid, clear everything
    const newState = { logged: false, user: null, sid: null };
    const changed = _sessionState.logged !== false;
    _sessionState = { ...newState, lastCheck: now };
    syncStorage(null, null);
    cleanUrl();
    if (changed) notifyListeners(newState);
    return newState;
  }
}

/**
 * Logout
 */
async function logout() {
  const sid = _sessionState.sid || getSidFromSources();
  
  if (sid) {
    // Call backend logout
    for (const base of AUTH_CONFIG.authBases) {
      try {
        await fetch(`${base}/auth/logout`, {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + sid },
        });
        break;
      } catch (e) {}
    }
  }
  
  // Clear local state
  const newState = { logged: false, user: null, sid: null };
  _sessionState = { ...newState, lastCheck: Date.now() };
  syncStorage(null, null);
  notifyListeners(newState);
  
  return newState;
}

/**
 * Register state change listener
 */
function onChange(callback) {
  if (typeof callback === 'function') {
    _listeners.add(callback);
  }
}

/**
 * Get current state
 */
function getState() {
  return { logged: _sessionState.logged, user: _sessionState.user, sid: _sessionState.sid };
}

// Polling timer
let _pollTimer = null;

/**
 * Start polling
 */
function startPolling() {
  if (_pollTimer) return;
  
  _pollTimer = setInterval(() => {
    checkAuth(true);
  }, AUTH_CONFIG.pollInterval);
  
  // Also check on window focus
  window.addEventListener('focus', () => checkAuth(true));
}

/**
 * Initialize authentication
 */
async function init() {
  const state = await checkAuth(true);
  startPolling();
  return state;
}

// Export to global
window.AuthMiddleware = {
  init,
  checkAuth,
  logout,
  onChange,
  getState,
  startPolling,
};

console.log('[AuthMiddleware] Loaded');
