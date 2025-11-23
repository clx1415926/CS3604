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
// 图形验证码已彻底移除：不再渲染或隐藏该元素

<<<<<<< HEAD
async function fetchCaptcha() {
  const res = await fetch(`${API_BASE}/auth/captcha?type=image`);
  if (!res.ok) return;
  const data = await res.json();
  currentCaptchaId = data.captcha_id;
  captchaImg.src = data.image_url || (data.image_data ? `data:image/png;base64,${data.image_data}` : '');
  show(captchaRow);
=======
// ------ 二次验证弹窗（身份证后4位 + 短信验证码） ------
let currentChallengeId = null;
let pubKey = null;
let countdownTimer = null;

function createAuthModal() {
  let modal = document.getElementById('auth-modal');
  if (modal) return modal;
  modal = document.createElement('div');
  modal.id = 'auth-modal';
  modal.className = 'modal-overlay';
  modal.innerHTML = `
    <div class="modal">
      <button class="close" id="auth-close" aria-label="关闭">×</button>
      <h3 class="modal-title">身份验证</h3>
      <div id="auth-step-id">
        <p class="modal-tip">请输入登录账号绑定的证件号后4位</p>
        <div class="input-group"><input type="text" id="id-last4" maxlength="4" inputmode="numeric" pattern="[0-9]{4}" aria-label="身份证后4位" /></div>
        <div class="error" id="auth-error" aria-live="polite"></div>
        <div class="modal-actions">
          <button class="primary" id="auth-id-submit">确认</button>
        </div>
      </div>
      <div id="auth-step-sms" hidden>
        <p class="modal-tip">已向您的注册手机号发送6位验证码，请在5分钟内输入</p>
        <div class="input-group"><input type="text" id="sms-code" maxlength="6" inputmode="numeric" pattern="[0-9]{6}" aria-label="短信验证码" /></div>
        <div class="status" id="sms-countdown">05:00</div>
        <div class="modal-actions">
          <button class="secondary" id="resend-sms">重新发送验证码</button>
          <button class="primary" id="auth-sms-submit">验证登录</button>
        </div>
        <div class="error" id="sms-error" aria-live="polite"></div>
      </div>
    </div>`;
  document.body.appendChild(modal);
  // 确保可见并聚焦输入框（避免历史隐藏状态导致不显示）
  modal.style.display = 'flex';
  setTimeout(() => {
    const idInput = document.getElementById('id-last4');
    if (idInput) idInput.focus();
  }, 0);

  // 关闭按钮
  document.getElementById('auth-close').addEventListener('click', () => {
    stopCountdown();
    modal.remove();
    currentChallengeId = null;
  });

  // 身份证后4位提交
  document.getElementById('auth-id-submit').addEventListener('click', async () => {
    const idInput = /** @type {HTMLInputElement} */(document.getElementById('id-last4'));
    const id4 = idInput.value.trim();
    const err = document.getElementById('auth-error');
    err.textContent = '';
    if (!/^[0-9]{4}$/.test(id4)) { err.textContent = '请输入正确的后4位数字'; return; }
    try {
      if (!pubKey) pubKey = await getLoginPubKey();
      const cipherBuf = await window.crypto.subtle.encrypt({ name: 'RSA-OAEP' }, pubKey, new TextEncoder().encode(id4));
      const encrypted = toBase64(cipherBuf);
      const res = await fetch(`${API_BASE}/auth/login/id-verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: currentChallengeId, id_last4_encrypted: encrypted })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'ACCOUNT_LOCKED') err.textContent = '错误次数过多，账户已锁定30分钟';
        else if (data.error === 'ID_LAST4_INVALID') err.textContent = '身份证后4位不匹配，请重试';
        else err.textContent = data.message || '验证失败，请稍后再试';
        return;
      }
      // 进入短信验证码步骤
      showStepSms();
      startCountdown(5 * 60);
    } catch (e) {
      err.textContent = '网络或加密错误，请稍后再试';
    }
  });

  // 短信验证码提交
  document.getElementById('auth-sms-submit').addEventListener('click', async () => {
    const codeInput = /** @type {HTMLInputElement} */(document.getElementById('sms-code'));
    const code = codeInput.value.trim();
    const err = document.getElementById('sms-error');
    err.textContent = '';
    if (!/^[0-9]{6}$/.test(code)) { err.textContent = '请输入6位数字验证码'; return; }
    try {
      const res = await fetch(`${API_BASE}/auth/login/sms/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: currentChallengeId, code })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'SMS_CODE_MISMATCH') err.textContent = '验证码错误，请重试';
        else if (data.error === 'SMS_CODE_EXPIRED') err.textContent = '验证码已过期，请点击重新发送';
        else if (data.error === 'SMS_CODE_ALREADY_USED') err.textContent = '验证码已使用，请重新获取';
        else if (data.error === 'ACCOUNT_LOCKED') err.textContent = '错误次数过多，账户已锁定30分钟';
        else err.textContent = data.message || '验证失败，请稍后再试';
        return;
      }
      // 登录成功
      stopCountdown();
      const { session_id, redirect } = data;
      setText(loginStatus, '登录成功，正在跳转…');
      sessionStorage.setItem('session_id', session_id);
      document.getElementById('auth-modal').remove();
      setTimeout(() => { window.location.href = redirect || '/'; }, 500);
    } catch (e) {
      err.textContent = '网络错误，请稍后再试';
    }
  });

  // 重新发送验证码
  document.getElementById('resend-sms').addEventListener('click', async () => {
    const err = document.getElementById('sms-error');
    err.textContent = '';
    try {
      const res = await fetch(`${API_BASE}/auth/login/sms/resend`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ challenge_id: currentChallengeId })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'SMS_TOO_FREQUENT') err.textContent = '发送过于频繁，请稍后再试';
        else if (data.error === 'SMS_DAILY_LIMIT_REACHED') err.textContent = '当日次数已达上限，请稍后再试';
        else if (data.error === 'ACCOUNT_LOCKED') err.textContent = '错误次数过多，账户已锁定30分钟';
        else err.textContent = data.message || '发送失败，请稍后再试';
        return;
      }
      // 重置倒计时
      startCountdown(5 * 60);
      setText(document.getElementById('sms-countdown'), '05:00');
    } catch (e) {
      err.textContent = '网络错误，请稍后再试';
    }
  });

  return modal;
>>>>>>> 7a2b9870 (fix three bugs on login page)
}

function showStepSms() {
  const stepId = document.getElementById('auth-step-id');
  const stepSms = document.getElementById('auth-step-sms');
  hide(stepId); show(stepSms);
}

function startCountdown(seconds) {
  stopCountdown();
  const el = document.getElementById('sms-countdown');
  let remaining = seconds;
  function format(s) {
    const m = Math.floor(s / 60); const sec = s % 60;
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  }
  setText(el, format(remaining));
  countdownTimer = setInterval(() => {
    remaining -= 1;
    if (remaining <= 0) { setText(el, '00:00'); stopCountdown(); return; }
    setText(el, format(remaining));
  }, 1000);
}

function stopCountdown() { if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; } }

// 公钥获取与加密工具
async function getLoginPubKey() {
  const res = await fetch(`${API_BASE}/auth/login/pubkey`);
  const data = await res.json();
  const keyData = pemToArrayBuffer(data.public_key_pem);
  return await window.crypto.subtle.importKey('spki', keyData, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
}

function pemToArrayBuffer(pem) {
  const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
  const raw = atob(b64); const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr.buffer;
}

function toBase64(buf) {
  const bytes = new Uint8Array(buf); let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginStatus.textContent = '';
  const identifier = /** @type {HTMLInputElement} */(document.getElementById('identifier')).value.trim();
  const password = /** @type {HTMLInputElement} */(document.getElementById('password')).value;
  const payload = { identifier, password };
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
      // 错误处理
      if (data.error === 'INVALID_CREDENTIALS') {
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
<<<<<<< HEAD
    // 登录成功
    const { session_id, redirect } = data;
    setText(loginStatus, '登录成功，正在跳转…');
    // 简单存储 session_id 用于后续接口（演示）
    sessionStorage.setItem('session_id', session_id);
    setTimeout(() => {
      const home = (window && window.HOME_URL) || 'http://localhost:8080/';
      const base = redirect || home;
      const sep = base.includes('?') ? '&' : '?';
      const next = `${base}${sep}sid=${encodeURIComponent(session_id)}`;
      window.location.href = next;
    }, 500);
=======
    // 启动二次验证弹窗
    currentChallengeId = data.challenge_id;
    const modal = createAuthModal();
    show(modal);
    setText(loginStatus, '请进行身份验证：先输入证件号后4位，再输入短信验证码');
>>>>>>> 7a2b9870 (fix three bugs on login page)
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