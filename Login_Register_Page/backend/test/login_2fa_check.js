// E2E check for new two-factor login flow (ID last4 + SMS)
// Uses Node built-in http and crypto modules, no extra dependencies.

const http = require('http');
const crypto = require('crypto');

const BASE = 'http://localhost:8081';

function request(method, path, body, headers = {}) {
  return new Promise((resolve, reject) => {
  const url = new URL(path, BASE);
    const data = body ? Buffer.from(JSON.stringify(body)) : null;
    const opts = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data ? data.length : 0,
        ...headers,
      },
    };
    const req = http.request(opts, (res) => {
      let buf = '';
      res.on('data', (chunk) => (buf += chunk));
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(buf || '{}'); } catch (e) {}
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, data: json });
        } else {
          const err = new Error(`HTTP ${res.statusCode}`);
          err.response = { status: res.statusCode, data: json };
          reject(err);
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

async function main() {
  console.log('Step 1: GET /auth/login/pubkey');
  const pub = await request('GET', '/api/v1/auth/login/pubkey');
  const pem = pub.data.public_key_pem;
  if (!pem) throw new Error('No public key');
  const pubKey = crypto.createPublicKey(pem);

  console.log('Step 2: POST /auth/login (username/password)');
  const login = await request('POST', '/api/v1/auth/login', {
    identifier: 'superadmin',
    password: 'Admin12345_',
    remember_me: true,
  });
  const challenge_id = login.data.challenge_id;
  if (!challenge_id) throw new Error('No challenge_id returned');
  console.log('Challenge ID:', challenge_id);

  console.log('Step 3: POST /auth/login/id-verify (encrypt id last4)');
  const id4 = '1234'; // matches seeded superadmin id_number tail
  const encryptedBuf = crypto.publicEncrypt({ key: pubKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, oaepHash: 'sha256' }, Buffer.from(id4, 'utf8'));
  const encryptedB64 = encryptedBuf.toString('base64');
  const idv = await request('POST', '/api/v1/auth/login/id-verify', { challenge_id, id_last4_encrypted: encryptedB64 }, { 'x-dev-debug': '1' });
  console.log('ID verify response:', idv.data);
  const code = idv.data.dev_code;
  if (!code) throw new Error('No dev_code returned; set x-dev-debug: 1 to leak in dev');
  console.log('Dev leaked SMS code:', code);

  console.log('Step 4: POST /auth/login/sms/verify');
  const v = await request('POST', '/api/v1/auth/login/sms/verify', { challenge_id, code });
  console.log('Login success:', v.data);
}

main().catch((err) => {
  console.error('E2E failed:', err && err.message);
  if (err && err.response) {
    console.error('Response:', err.response);
  }
  process.exit(1);
});