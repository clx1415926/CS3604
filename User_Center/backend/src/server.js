const http = require('http');
const { URL } = require('url');
const routes = require('./routes/profile');

const PORT = process.env.PORT || 8083;

function send(res, status, data) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PATCH,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(data));
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

const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'OPTIONS') return send(res, 200, {});

  try {
    if (req.method === 'GET' && u.pathname === '/api/v1/user/profile') {
      const r = await routes.getUserProfile();
      return send(res, r.status, r.body);
    }
    if (req.method === 'PATCH' && u.pathname === '/api/v1/user/profile/traveler-type') {
      const payload = await parseBody(req);
      const r = await routes.patchTravelerType(payload);
      return send(res, r.status, r.body || {});
    }
    if (req.method === 'GET' && u.pathname === '/api/v1/user/security/phone/context') {
      const r = await routes.getPhoneVerificationContext();
      return send(res, r.status, r.body || {});
    }
    if (req.method === 'POST' && u.pathname === '/api/v1/user/security/phone/change') {
      const payload = await parseBody(req);
      const r = await routes.postPhoneChange(payload);
      const data = r.body || {};
      if (r.redirect_to) data.redirect_to = r.redirect_to;
      return send(res, r.status, data);
    }
    if (req.method === 'GET' && u.pathname === '/api/v1/metadata/country-codes') {
      const r = await routes.getCountryCodes();
      return send(res, r.status, r.body || {});
    }
    return send(res, 404, { error: 'NOT_FOUND' });
  } catch (e) {
    return send(res, 500, { error: 'INTERNAL_ERROR' });
  }
});

server.listen(PORT, () => {
  console.log(`[User_Center] server listening on http://localhost:${PORT}`);
});

