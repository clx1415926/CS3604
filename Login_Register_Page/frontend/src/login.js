// 登录页交互逻辑：严格对齐后端接口与数据格式

// 在静态预览（http-server 8081）下，后端 Express 默认运行在 8080 或你指定的端口
function getApiBase() {
  return (window && window.API_BASE) || 'http://127.0.0.1:8082/api/v1';
}

function $(sel) { return document.querySelector(sel); }
function setText(el, text) { el.textContent = text; }
function show(el) { el.removeAttribute('hidden'); }
function hide(el) { el.setAttribute('hidden', 'hidden'); }

// Tab 切换
const tabAccountBtn = $('#tab-account-btn');
const tabQrBtn = $('#tab-qr-btn');
const tabAccount = $('#tab-account');
const tabQr = $('#tab-qr');

if (tabAccountBtn && tabQrBtn && tabAccount && tabQr) {
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
}

// 账户登录
const loginForm = $('#login-form');
const loginError = $('#login-error');
const loginStatus = $('#login-status');
// 图形验证码与“记住我”功能已移除

// 2FA 弹窗相关元素
const smsModal = /** @type {HTMLDivElement} */(document.getElementById('sms-modal'));
const smsClose = /** @type {HTMLButtonElement} */(document.getElementById('sms-close'));
const idLast4Input = /** @type {HTMLInputElement} */(document.getElementById('id-last4'));
const idVerifyBtn = /** @type {HTMLButtonElement} */(document.getElementById('id-verify'));
const smsMaskedPhone = /** @type {HTMLSpanElement} */(document.getElementById('sms-masked-phone'));
const smsCodeInput = /** @type {HTMLInputElement} */(document.getElementById('sms-code'));
const smsVerifyBtn = /** @type {HTMLButtonElement} */(document.getElementById('sms-verify'));
const smsResendBtn = /** @type {HTMLButtonElement} */(document.getElementById('sms-resend'));
const smsCountdown = /** @type {HTMLSpanElement} */(document.getElementById('sms-countdown'));
const smsErr1 = /** @type {HTMLDivElement} */(document.getElementById('sms-error'));
const smsStatus1 = /** @type {HTMLDivElement} */(document.getElementById('sms-status'));
const smsErr2 = /** @type {HTMLDivElement} */(document.getElementById('sms-error-2'));
const smsStatus2 = /** @type {HTMLDivElement} */(document.getElementById('sms-status-2'));

let currentFlowId = null;
let expireAt = 0;
let countdownTimer = null;
let resendTimer = null;
let codeBtnBaseText = (idVerifyBtn && idVerifyBtn.textContent) ? String(idVerifyBtn.textContent) : '获取验证码';

function persistLoginAndRedirect(session_id, redirect) {
  if (loginStatus) setText(loginStatus, '登录成功，正在跳转…');
  
  // 清除所有旧的乘车人缓存，确保新用户获取正确的乘车人列表
  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('TM_CONTACTS_CACHE:') || key.startsWith('TM_SELECTED_SEATS:'))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {}
  
  sessionStorage.setItem('session_id', session_id);
  try { localStorage.setItem('SESSION_ID', session_id); } catch (e) {}
  try { window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: session_id, logged_in: true } })); } catch (e) {}
  setTimeout(() => {
    const home = (window && window.HOME_URL) || 'http://localhost:8080/';
    const base = redirect || home;
    const sep = base.includes('?') ? '&' : '?';
    const next = `${base}${sep}sid=${encodeURIComponent(session_id)}`;
    window.location.href = next;
  }, 500);
}

function openSmsModal(masked, flowId) {
  currentFlowId = flowId;
  smsErr1.textContent = ''; smsStatus1.textContent = '';
  smsErr2.textContent = ''; smsStatus2.textContent = '';
  smsMaskedPhone.textContent = masked || '***********';
  smsModal.removeAttribute('hidden');
  idLast4Input.value = '';
  smsCodeInput.value = '';
  codeBtnBaseText = '获取验证码';
  if (idVerifyBtn) {
    idVerifyBtn.textContent = codeBtnBaseText;
    idVerifyBtn.disabled = false;
  }
  if (smsVerifyBtn) smsVerifyBtn.disabled = true;
  if (smsCountdown) smsCountdown.textContent = '';
  idLast4Input.focus();
}

function closeSmsModal() {
  smsModal.setAttribute('hidden', 'hidden');
  currentFlowId = null;
  if (countdownTimer) { clearInterval(countdownTimer); countdownTimer = null; }
  if (resendTimer) { clearInterval(resendTimer); resendTimer = null; }
  codeBtnBaseText = '获取验证码';
  if (idVerifyBtn) {
    idVerifyBtn.textContent = codeBtnBaseText;
    idVerifyBtn.disabled = false;
  }
}

smsClose && smsClose.addEventListener('click', (e) => { e.preventDefault(); closeSmsModal(); });

function startCountdown(minutes) {
  expireAt = Date.now() + (minutes * 60 * 1000);
  if (countdownTimer) clearInterval(countdownTimer);
  function tick() {
    const remainMs = expireAt - Date.now();
    if (remainMs <= 0) { smsCountdown.textContent = '验证码已过期'; clearInterval(countdownTimer); countdownTimer = null; return; }
    const m = Math.floor(remainMs / 60000);
    const s = Math.floor((remainMs % 60000) / 1000);
    smsCountdown.textContent = `剩余 ${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  }
  tick();
  countdownTimer = setInterval(tick, 1000);
}

function startResendCountdown(seconds, baseText = undefined) {
  let left = seconds;
  const btn = idVerifyBtn;
  if (!btn) return;
  const text = typeof baseText === 'string' && baseText.length ? baseText : (btn.textContent || '重新发送');
  codeBtnBaseText = text;
  btn.disabled = true;
  if (resendTimer) clearInterval(resendTimer);
  btn.textContent = `${text}(${left}s)`;
  resendTimer = setInterval(() => {
    left -= 1;
    if (left <= 0) {
      clearInterval(resendTimer);
      resendTimer = null;
      btn.disabled = false;
      btn.textContent = text;
      return;
    }
    btn.textContent = `${text}(${left}s)`;
  }, 1000);
}

if (loginForm) loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.textContent = '';
  loginStatus.textContent = '';
  const identifier = /** @type {HTMLInputElement} */(document.getElementById('identifier')).value.trim();
  const password = /** @type {HTMLInputElement} */(document.getElementById('password')).value;
  const payload = { identifier, password };
  const btn = /** @type {HTMLButtonElement} */(document.getElementById('login-btn'));
  btn.disabled = true;
  try {
    const res = await fetch(`${getApiBase()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-dev-2fa': '1' },
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
    // 若后端要求短信验证，进入弹窗流程
    if (data.need_sms_verification) {
      openSmsModal(data.masked_phone, data.flow_id);
      return; // 后续流程由弹窗完成
    }
    // 否则直接登录成功
    const { session_id, redirect } = data;
    persistLoginAndRedirect(session_id, redirect);
  } catch (err) {
    setText(loginError, '网络错误，请稍后再试');
  } finally {
    btn.disabled = false;
  }
});

// 身份证后4位校验（通过后自动发送短信）
idVerifyBtn && idVerifyBtn.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentFlowId) return;
  smsErr1.textContent = ''; smsStatus1.textContent = '';
  const last4 = idLast4Input.value.trim();
  if (!/^[0-9Xx]{4}$/.test(last4)) { smsErr1.textContent = '请输入4位数字或X'; return; }
  idVerifyBtn.disabled = true;
  try {
    // 加密传输：使用 SHA-256 对后4位进行哈希
    async function sha256Hex(text) {
      const buf = new TextEncoder().encode(text);
      const hash = await crypto.subtle.digest('SHA-256', buf);
      return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    const hashLast4 = await sha256Hex(last4.toUpperCase());
    const res = await fetch(`${getApiBase()}/auth/login/2fa/id-check`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-dev-debug': '1' },
      body: JSON.stringify({ flow_id: currentFlowId, id_last4_hash: hashLast4 })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'ID_LAST4_MISMATCH') smsErr1.textContent = '身份证后4位不匹配';
      else if (data.error === 'ACCOUNT_LOCKED') smsErr1.textContent = '错误次数过多，账户已锁定30分钟';
      else if (data.error === 'SMS_TOO_FREQUENT') smsErr1.textContent = '短信发送过于频繁，请稍后再试';
      else if (data.error === 'SMS_DAILY_LIMIT_REACHED') smsErr1.textContent = '短信发送次数已达上限，请稍后再试';
      else smsErr1.textContent = data.message || '验证失败';
      return;
    }
    codeBtnBaseText = '重新发送';
    if (idVerifyBtn) idVerifyBtn.textContent = codeBtnBaseText;
    smsStatus2.textContent = data.sent === false ? '验证码仍在有效期内' : '验证码已发送，请查收';
    if (data.dev_code) smsStatus2.textContent += `（开发联调验证码：${data.dev_code}）`;
    if (smsVerifyBtn) smsVerifyBtn.disabled = false;
    startCountdown((data.ttl_minutes || 5));
    startResendCountdown((data.countdown_seconds || 60), '重新发送');
    smsCodeInput.focus();
  } catch (err) {
    smsErr1.textContent = '网络错误，请稍后再试';
  } finally {
    if (idVerifyBtn && !resendTimer) idVerifyBtn.disabled = false;
  }
});

// 重新发送验证码
smsResendBtn && smsResendBtn.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentFlowId) return;
  smsErr2.textContent = ''; smsStatus2.textContent = '';
  smsResendBtn.disabled = true;
  try {
    const res = await fetch(`${getApiBase()}/auth/login/2fa/resend`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-dev-debug': '1' },
      body: JSON.stringify({ flow_id: currentFlowId })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'SMS_TOO_FREQUENT') smsErr2.textContent = '短信发送过于频繁，请稍后再试';
      else if (data.error === 'SMS_DAILY_LIMIT_REACHED') smsErr2.textContent = '短信发送次数已达上限，请稍后再试';
      else smsErr2.textContent = data.message || '发送失败';
      return;
    }
    smsStatus2.textContent = '验证码已重新发送';
    if (data.dev_code) smsStatus2.textContent += `（开发联调验证码：${data.dev_code}）`;
    startCountdown((data.ttl_minutes || 5));
    startResendCountdown((data.countdown_seconds || 60));
  } catch (err) {
    smsErr2.textContent = '网络错误，请稍后再试';
  } finally {
    smsResendBtn.disabled = false;
  }
});

// 校验验证码并完成登录
smsVerifyBtn && smsVerifyBtn.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentFlowId) return;
  smsErr2.textContent = ''; smsStatus2.textContent = '';
  const code = smsCodeInput.value.trim();
  if (!/^\d{6}$/.test(code)) { smsErr2.textContent = '请输入6位数字验证码'; return; }
  smsVerifyBtn.disabled = true;
  try {
    const res = await fetch(`${getApiBase()}/auth/login/2fa/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ flow_id: currentFlowId, code })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (data.error === 'SMS_CODE_EXPIRED') smsErr2.textContent = '验证码已过期，请重新获取';
      else if (data.error === 'SMS_CODE_MISMATCH') smsErr2.textContent = '验证码错误，请重新输入';
      else if (data.error === 'ACCOUNT_LOCKED') smsErr2.textContent = '错误次数过多，账户已锁定30分钟';
      else smsErr2.textContent = data.message || '验证失败';
      return;
    }
    // 登录成功
    const { session_id, redirect } = data;
    closeSmsModal();
    persistLoginAndRedirect(session_id, redirect);
  } catch (err) {
    smsErr2.textContent = '网络错误，请稍后再试';
  } finally {
    smsVerifyBtn.disabled = false;
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
    const res = await fetch(`${getApiBase()}/auth/qrcode/${currentQrId}/status`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '二维码状态错误');
    setText(qrStatus, data.status === 'unscanned' ? '请使用铁路12306APP扫码登录' : data.status === 'scanned' ? '已扫码，请在手机确认' : data.status === 'confirmed' ? '已确认，正在登录…' : '二维码已过期');
    if (data.status === 'confirmed' && data.session_id) {
      sessionStorage.setItem('session_id', data.session_id);
      try { localStorage.setItem('SESSION_ID', data.session_id); } catch (e) {}
      try { window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: data.session_id, logged_in: true } })); } catch (e) {}
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
  const res = await fetch(`${getApiBase()}/auth/qrcode`);
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
  const res = await fetch(`${getApiBase()}/auth/qrcode/${currentQrId}/refresh`, { method: 'POST' });
  const data = await res.json();
  qrImage.src = `data:image/png;base64,${data.image_data}`;
  setText(qrStatus, '二维码已刷新，请重新扫码');
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(pollQr, (data.poll_interval_seconds || 2) * 1000);
});

// 开发辅助：模拟扫码/确认（使用后端的开发 header）
qrMockScan.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentQrId) return;
  await fetch(`${getApiBase()}/auth/qrcode/${currentQrId}/status`, { headers: { 'x-dev-scan': '1' } });
});
qrMockConfirm.addEventListener('click', async (e) => {
  e.preventDefault(); if (!currentQrId) return;
  await fetch(`${getApiBase()}/auth/qrcode/${currentQrId}/status`, { headers: { 'x-dev-confirm': '1' } });
});

// 忘记密码跳转
const forgotPwdLink = document.getElementById('forgot-password');
if (forgotPwdLink) {
  forgotPwdLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.location.href = '/forgot-password.html';
  });
}
