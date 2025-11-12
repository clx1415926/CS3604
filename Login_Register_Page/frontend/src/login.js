// 登录页交互逻辑：严格对齐后端接口与数据格式

const API_BASE = '/api/v1';

function $(sel) { return document.querySelector(sel); }
function setText(el, text) { el.textContent = text; }
function show(el) { el.removeAttribute('hidden'); }
function hide(el) { el.setAttribute('hidden', 'hidden'); }

// Tab 切换
const tabAccountBtn = $('#tab-account-btn');
const tabQrBtn = $('#tab-qr-btn');
const tabAccount = $('#tab-account');
const tabQr = $('#tab-qr');

tabAccountBtn.addEventListener('click', () => {
  tabAccountBtn.classList.add('active');
  tabQrBtn.classList.remove('active');
  tabAccount.classList.add('active');
  tabQr.classList.remove('active');
});
tabQrBtn.addEventListener('click', () => {
  tabQrBtn.classList.add('active');
  tabAccountBtn.classList.remove('active');
  tabQr.classList.add('active');
  tabAccount.classList.remove('active');
});

// 账户登录
const loginForm = $('#login-form');
const loginError = $('#login-error');
const loginStatus = $('#login-status');
const captchaRow = $('#captcha-row');
const captchaImg = $('#captcha-image');
const captchaRefresh = $('#captcha-refresh');
let currentCaptchaId = null;

async function fetchCaptcha() {
  const res = await fetch(`${API_BASE}/auth/captcha?type=image`);
  if (!res.ok) return;
  const data = await res.json();
  currentCaptchaId = data.captcha_id;
  captchaImg.src = `data:image/png;base64,${data.image_data}`;
  show(captchaRow);
}

captchaRefresh.addEventListener('click', fetchCaptcha);

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginStatus.textContent = '';
  const identifier = /** @type {HTMLInputElement} */(document.getElementById('identifier')).value.trim();
  const password = /** @type {HTMLInputElement} */(document.getElementById('password')).value;
  const remember_me = /** @type {HTMLInputElement} */(document.getElementById('remember_me')).checked;
  const captcha_code = /** @type {HTMLInputElement} */(document.getElementById('captcha_code')).value.trim();

  const payload = { identifier, password, remember_me };
  if (currentCaptchaId) {
    Object.assign(payload, { captcha_id: currentCaptchaId, captcha_code });
  }
  const btn = /** @type {HTMLButtonElement} */(document.getElementById('login-btn'));
  btn.disabled = true;
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      // 错误处理与验证码逻辑
      if (data.error === 'CAPTCHA_REQUIRED') {
        setText(loginError, '需要图形验证码，请输入验证码后重试');
        if (!currentCaptchaId) await fetchCaptcha();
      } else if (data.error === 'INVALID_CREDENTIALS') {
        setText(loginError, '用户名或密码错误');
      } else if (data.error === 'LOGIN_IDENTIFIER_INVALID_FORMAT') {
        setText(loginError, '请输入正确的用户名/手机号/邮箱格式');
      } else if (data.error === 'ACCOUNT_LOCKED') {
        setText(loginError, '账户已被锁定，请稍后再试或联系客服');
      } else if (data.error === 'MAINTENANCE_WINDOW') {
        setText(loginError, '当前为维护窗口，暂不可登录');
      } else if (data.error === 'PASSWORD_REQUIRED') {
        setText(loginError, '请输入密码');
      } else {
        setText(loginError, data.message || '登录失败，请稍后再试');
      }
      return;
    }
    // 登录成功
    const { session_id, redirect } = data;
    setText(loginStatus, '登录成功，正在跳转…');
    // 简单存储 session_id 用于后续接口（演示）
    sessionStorage.setItem('session_id', session_id);
    setTimeout(() => {
      // 对接后端静态页面，此处跳转至主页或模拟个人中心
      window.location.href = redirect || '/';
    }, 500);
  } catch (err) {
    setText(loginError, '网络错误，请稍后再试');
  } finally {
    btn.disabled = false;
  }
});

// 扫码登录
const qrImage = $('#qr-image');
const qrStatus = $('#qr-status');
const qrGenerate = $('#qr-generate');
const qrRefresh = $('#qr-refresh');
const qrMockScan = $('#qr-mock-scan');
const qrMockConfirm = $('#qr-mock-confirm');

let currentQrId = null;
let pollTimer = null;

async function pollQr() {
  if (!currentQrId) return;
  try {
    const res = await fetch(`${API_BASE}/auth/qrcode/${currentQrId}/status`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '二维码状态错误');
    setText(qrStatus, data.status === 'unscanned' ? '请使用铁路12306APP扫码登录' : data.status === 'scanned' ? '已扫码，请在手机确认' : data.status === 'confirmed' ? '已确认，正在登录…' : '二维码已过期');
    if (data.status === 'confirmed' && data.session_id) {
      sessionStorage.setItem('session_id', data.session_id);
      setTimeout(() => window.location.href = '/profile', 500);
      clearInterval(pollTimer); pollTimer = null;
    }
    if (data.status === 'expired') {
      clearInterval(pollTimer); pollTimer = null;
      qrRefresh.disabled = false;
    }
  } catch (e) {
    // 忽略偶发错误
  }
}

qrGenerate.addEventListener('click', async (e) => {
  e.preventDefault();
  const res = await fetch(`${API_BASE}/auth/qrcode`);
  const data = await res.json();
  currentQrId = data.qrcode_id;
  qrImage.src = `data:image/png;base64,${data.image_data}`;
  setText(qrStatus, '请使用铁路12306APP扫码登录');
  qrRefresh.disabled = false;
  qrMockScan.disabled = false;
  qrMockConfirm.disabled = false;
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollQr, (data.poll_interval_seconds || 2) * 1000);
});

qrRefresh.addEventListener('click', async (e) => {
  e.preventDefault();
  if (!currentQrId) return;
  const res = await fetch(`${API_BASE}/auth/qrcode/${currentQrId}/refresh`, { method: 'POST' });
  const data = await res.json();
  qrImage.src = `data:image/png;base64,${data.image_data}`;
  setText(qrStatus, '二维码已刷新，请重新扫码');
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollQr, (data.poll_interval_seconds || 2) * 1000);
});

// 开发辅助：模拟扫码/确认（使用后端的开发 header）
qrMockScan.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentQrId) return;
  await fetch(`${API_BASE}/auth/qrcode/${currentQrId}/status`, { headers: { 'x-dev-scan': '1' } });
});
qrMockConfirm.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentQrId) return;
  await fetch(`${API_BASE}/auth/qrcode/${currentQrId}/status`, { headers: { 'x-dev-confirm': '1' } });
});

// 忘记密码跳转
const forgotPwdLink = document.getElementById('forgot-password');
if (forgotPwdLink) {
  forgotPwdLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/forgot-password.html';
  });
}