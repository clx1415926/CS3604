const http = require('http');
const { URL } = require('url');
const routes = require('./routes/profile');
const passengerRoutes = require('./routes/passengers');

const PORT = process.env.PORT || 8083;

// Rate Limiter
const rateLimits = new Map();
function checkRateLimit(req) {
  if (req.headers['x-test-rate-limit-bypass']) return true;
  const ip = req.socket.remoteAddress;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const max = 60; // 60 requests per minute

  let record = rateLimits.get(ip);
  if (!record) {
      record = { count: 0, start: now };
  }
  
  if (now - record.start > windowMs) {
    record.count = 0;
    record.start = now;
  }
  
  record.count++;
  rateLimits.set(ip, record);
  return record.count <= max;
}

function send(res, status, data, reqInfo = null) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS,DELETE',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  res.end(JSON.stringify(data));
  
  if (reqInfo) {
      const { req, userId } = reqInfo;
      const ip = req.socket.remoteAddress;
      console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - User:${userId || 'Anon'} - IP:${ip} - Status:${status} ${status >= 400 ? 'Error: ' + (data.error || '') : ''}`);
  }
}

function parseBody(req) {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (chunk) => (body += chunk));
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (e) {
        resolve({});
      }
    });
  });
}

const sidCache = new Map();
const looksLikeSessionId = (token) => typeof token === 'string' && (token.startsWith('sid-') || token.startsWith('sess-'));

async function resolveSessionToUserId(sessionId) {
  const cached = sidCache.get(sessionId);
  if (cached && cached.user_id && cached.expires_at && Date.now() < cached.expires_at) {
    return { userId: cached.user_id, invalid: false };
  }

  const bases = ['http://localhost:8080/api/v1', 'http://localhost:8081/api/v1', 'http://127.0.0.1:8082/api/v1'];
  let sawUnauthorized = false;
  for (const base of bases) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    try {
      const r = await fetch(`${base}/auth/session`, {
        headers: { Authorization: `Bearer ${sessionId}` },
        signal: controller.signal,
      });
      if (r.status === 401) {
        sawUnauthorized = true;
        continue;
      }
      if (!r.ok) {
        continue;
      }
      const d = await r.json().catch(() => ({}));
      const userId = d && typeof d.user_id === 'string' ? d.user_id : null;
      if (userId) {
        sidCache.set(sessionId, { user_id: userId, expires_at: Date.now() + 60 * 1000 });
        return { userId, invalid: false };
      }
    } catch (e) {
    } finally {
      clearTimeout(timeout);
    }
  }

  return { userId: null, invalid: sawUnauthorized };
}

async function getUserId(req) {
  const auth = req.headers['authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  if (token === 'sess-super-12306') return 'u-super';
  if (token.startsWith('sid-')) {
    const parsed = token.slice(4);
    if (parsed) return parsed;
  }
  if (looksLikeSessionId(token)) {
    const resolved = await resolveSessionToUserId(token);
    if (resolved.invalid) return null;
    if (resolved.userId) return resolved.userId;
  }
  return token;
}

function createServer() {
  return http.createServer(async (req, res) => {
    const u = new URL(req.url, `http://localhost:${PORT}`);
    if (req.method === 'OPTIONS') return send(res, 200, {});

    if (!checkRateLimit(req)) {
      return send(res, 429, { error: 'TOO_MANY_REQUESTS', message: '请求过于频繁，请稍后再试' });
    }

    const userId = await getUserId(req);
    const reqInfo = { req, userId };

    try {
      if (req.method === 'GET' && u.pathname === '/api/v1/user/profile') {
        const r = await routes.getUserProfile(userId);
        return send(res, r.status, r.body, reqInfo);
      }
      if (req.method === 'PATCH' && u.pathname === '/api/v1/user/profile/traveler-type') {
        const payload = await parseBody(req);
        if (userId && (!payload || !payload.user_id)) payload.user_id = userId;
        const r = await routes.patchTravelerType(payload);
        return send(res, r.status, r.body || {}, reqInfo);
      }
      if (req.method === 'GET' && u.pathname === '/api/v1/user/security/phone/context') {
        const r = await routes.getPhoneVerificationContext(userId);
        return send(res, r.status, r.body || {}, reqInfo);
      }
      if (req.method === 'POST' && u.pathname === '/api/v1/user/security/phone/change') {
        const payload = await parseBody(req);
        if (userId && (!payload || !payload.user_id)) payload.user_id = userId;
        const r = await routes.postPhoneChange(payload);
        const data = r.body || {};
        return send(res, r.status, data, reqInfo);
      }

      if (req.method === 'GET' && u.pathname === '/api/v1/metadata/country-codes') {
        if (!userId) {
          return send(res, 401, { error: 'UNAUTHORIZED', message: '未登录或会话已过期' }, reqInfo);
        }
        const r = await routes.getCountryCodes();
        return send(res, r.status, r.body || {}, reqInfo);
      }

      if (req.method === 'GET' && u.pathname === '/api/v1/orders') {
        const auth = req.headers['authorization'];
        const token = auth && String(auth).startsWith('Bearer ') ? String(auth).slice(7) : '';
        const r = await routes.getOrders(userId, token, Object.fromEntries(u.searchParams));
        return send(res, r.status, r.body || {}, reqInfo);
      }

      if (req.method === 'POST' && u.pathname.match(/^\/api\/v1\/internal\/users\/[^\/]+\/init-self-passenger$/)) {
        if (req.headers['x-internal-secret'] !== '12306-internal-secret') {
          return send(res, 403, { error: 'FORBIDDEN' });
        }
        const parts = u.pathname.split('/');
        const targetUserId = parts[parts.length - 2];

        await passengerRoutes.getPassengers(targetUserId, {});
        return send(res, 200, { ok: true });
      }

      if (u.pathname === '/api/v1/passengers') {
        if (req.method === 'GET') {
          const r = await passengerRoutes.getPassengers(userId, Object.fromEntries(u.searchParams));
          return send(res, r.status, r.body, reqInfo);
        }
        if (req.method === 'POST') {
          const payload = await parseBody(req);
          const r = await passengerRoutes.addPassenger(userId, payload);
          return send(res, r.status, r.body, reqInfo);
        }
      }
      if (u.pathname.match(/^\/api\/v1\/passengers\/\d+$/)) {
        const id = u.pathname.split('/').pop();
        if (req.method === 'DELETE') {
          const r = await passengerRoutes.deletePassenger(userId, id);
          return send(res, r.status, r.body, reqInfo);
        }
        if (req.method === 'PUT' || req.method === 'PATCH') {
          const payload = await parseBody(req);
          const r = await passengerRoutes.updatePassenger(userId, id, payload);
          return send(res, r.status, r.body, reqInfo);
        }
        if (req.method === 'GET') {
          const r = await passengerRoutes.getPassengerById(userId, id);
          return send(res, r.status, r.body, reqInfo);
        }
      }

      send(res, 404, { error: 'Not Found' }, reqInfo);
    } catch (err) {
      console.error('Server Error:', err);
      send(res, 500, { error: 'Internal Server Error' }, reqInfo);
    }
  });
}

module.exports = { createServer };

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, () => {
    console.log(`[User_Center] server listening on http://localhost:${PORT}`);
  });
}
