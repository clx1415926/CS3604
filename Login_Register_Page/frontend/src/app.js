const API_BASE = '/api/v1';

// Helpers
function qs(id) { return document.getElementById(id); }
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function setError(id, msg) { qs(id).textContent = msg || ''; }

// Step elements
const accountForm = qs('account-form');
const phoneForm = qs('phone-form');
const identityForm = qs('identity-form');
const termsForm = qs('terms-form');
const completeSection = qs('complete-section');

// Fields
const usernameInput = qs('username');
const passwordInput = qs('password');
const confirmInput = qs('confirm_password');
const nameInput = qs('name');
const idTypeSelect = qs('id_type');
const idNumberInput = qs('id_number');
const travelerTypeSelect = qs('traveler_type');
const phoneCountrySelect = qs('phone_country_code');
const phoneNumberInput = qs('phone_number');
const emailInput = qs('email');
const termsCheckbox = qs('terms');

// Password strength meter
const strengthBar = qs('strength-bar');
const strengthText = qs('strength-text');

// Code controls (SMS/Email)
const sendCodeBtn = qs('send_code');
const countdownEl = qs('countdown');
const verifyCodeBtn = qs('verify_code');
const smsCodeInput = qs('sms_code');
const codeErrorEl = qs('code-error');
const codeStatusEl = qs('code-status');

// Identity controls
const verifyIdentityBtn = qs('verify_identity');
const identityStatusEl = qs('identity-status');
const acceptTermsBtn = qs('accept_terms');

let sessionId = null;
let countdownTimer = null;

function validateUsernameLocal(u) {
  return /^[A-Za-z][A-Za-z0-9_]{5,29}$/.test(u);
}
function validateUsernameDetail(u) {
  const s = String(u || '').trim();
  if (s.length < 6) return { ok: false, message: '用户名长度必须至少6位' };
  if (s.length > 30) return { ok: false, message: '用户名长度不能超过30位' };
  if (!/^[A-Za-z]/.test(s)) return { ok: false, message: '用户名须以字母开头' };
  if (!/^[A-Za-z0-9_]+$/.test(s)) return { ok: false, message: '用户名包含非法字符，仅允许字母、数字、下划线' };
  return { ok: true, message: '' };
}
function passwordStrength(p, username) {
  const len = p.length;
  const allowedChars = /^[_A-Za-z0-9]+$/;
  const hasLetter = /[A-Za-z]/.test(p);
  const hasDigit = /\d/.test(p);
  const hasUnderscore = /_/.test(p);
  const categories = [hasLetter, hasDigit, hasUnderscore].filter(Boolean).length;
  let strength = '弱', width = 40, color = '#e74c3c';
  let ok = false;
  let message = '';
  if (len < 8) { message = '密码长度不足，需为8-20位'; }
  else if (len > 20) { message = '密码长度过长，需为8-20位'; }
  else if (!allowedChars.test(p)) { message = '密码包含非法字符，仅允许字母、数字、下划线'; }
  else if (p === username) { message = '密码不能与用户名相同'; }
  else if (categories < 2) { message = '需至少包含两种字符类型（字母、数字、下划线）'; }
  else { ok = true; }
  if (len >= 8 && categories >= 2) { strength = '中'; width = 80; color = '#f5a623'; }
  if (len >= 12 && categories === 3) { strength = '强'; width = 120; color = '#2ecc71'; }
  return { ok, strength, width, color, message };
}
function validateIdLocal(type, num) {
  if (type === '居民身份证') return /^(\d{17}[\dXx])$/.test(num);
  return /^[A-Za-z0-9]{5,20}$/.test(num);
}
function validatePhoneLocal(cc, num) {
  if (cc === '+86') return /^1[3-9]\d{9}$/.test(num);
  if (cc === '+852') return /^([5|6|8|9])\d{7}$/.test(num);
  if (cc === '+853') return /^6\d{7}$/.test(num);
  if (cc === '+886') return /^09\d{8}$/.test(num);
  return false;
}

// Live validations
usernameInput.addEventListener('blur', async () => {
  const u = usernameInput.value.trim();
  const vu = validateUsernameDetail(u);
  if (!vu.ok) { setError('username-error', vu.message); return; }
  try {
    const res = await fetch(`${API_BASE}/users/username/check?username=${encodeURIComponent(u)}`);
    const data = await res.json();
    if (!res.ok) {
      setError('username-error', data.message || '用户名校验失败');
    } else if (data.available === false) {
      setError('username-error', '该用户名已经占用，请重新选择用户名！');
    } else {
      setError('username-error', '');
    }
  } catch (e) {
    setError('username-error', '网络连接异常，请检查网络后重试');
  }
});

passwordInput.addEventListener('input', () => {
  const p = passwordInput.value;
  const u = usernameInput.value;
  const r = passwordStrength(p, u);
  strengthBar.style.setProperty('--strength-w', `${r.width}px`);
  strengthBar.style.setProperty('--strength-color', r.color);
  strengthText.textContent = r.strength;
  setError('password-error', r.ok ? '' : r.message || '密码格式不正确');
});

confirmInput.addEventListener('input', () => {
  if (confirmInput.value !== passwordInput.value) setError('confirm-error', '确认密码与密码不同！');
  else setError('confirm-error', '');
});

idNumberInput.addEventListener('blur', () => {
  const ok = validateIdLocal(idTypeSelect.value, idNumberInput.value.trim());
  setError('id-error', ok ? '' : '请输入正确的身份证号码格式');
});

phoneNumberInput.addEventListener('blur', async () => {
  const cc = phoneCountrySelect.value, num = phoneNumberInput.value.trim();
  if (!validatePhoneLocal(cc, num)) { setError('phone-error', '请输入正确的手机号'); return; }
  try {
    const url = `${API_BASE}/users/phone/check?phone_country_code=${encodeURIComponent(cc)}&phone_number=${encodeURIComponent(num)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) setError('phone-error', data.message || '手机号校验失败');
    else if (data.available === false) setError('phone-error', '该手机号已被注册，请尝试找回账户或联系客服');
    else setError('phone-error', '');
  } catch (e) { setError('phone-error', '网络连接异常，请检查网络后重试'); }
});

// Submit account info
accountForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  // basic checks
  if (!termsCheckbox.checked) { setError('terms-error', '请勾选同意12306服务条款与隐私权政策'); return; }

  const username = usernameInput.value.trim();
  const password = passwordInput.value;
  const confirm = confirmInput.value;
  const name = nameInput.value.trim();
  const id_type = idTypeSelect.value;
  const id_number = idNumberInput.value.trim();
  const phone_country_code = phoneCountrySelect.value;
  const phone_number = phoneNumberInput.value.trim();
  const email = emailInput.value.trim();
  const traveler_type = travelerTypeSelect.value;

  {
    const v = validateUsernameDetail(username);
    if (!v.ok) { setError('username-error', v.message); return; }
  }
  const pw = passwordStrength(password, username);
  if (!pw.ok) { setError('password-error', pw.message || '密码格式不正确'); return; }
  if (confirm !== password) { setError('confirm-error', '确认密码与密码不同！'); return; }
  const okId = validateIdLocal(id_type, id_number);
  if (!okId) { setError('id-error', '请输入正确的身份证号码格式'); return; }
  if (!validatePhoneLocal(phone_country_code, phone_number)) { setError('phone-error', '请输入正确的手机号'); return; }

  try {
    const sres = await fetch(`${API_BASE}/registration/sessions`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const sdata = await sres.json();
    if (sres.status !== 201) { alert('创建会话失败'); return; }
    sessionId = sdata.session_id;

    const ares = await fetch(`${API_BASE}/registration/sessions/${sessionId}/account`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, name, id_type, id_number, phone_country_code, phone_number, email, traveler_type })
    });
    const adata = await ares.json();
    if (!ares.ok) {
      alert(adata.message || '提交账户信息失败');
      return;
    }
    hide(accountForm); show(phoneForm);
    document.querySelector('.step.active').classList.remove('active');
    document.querySelector('.step[data-step="phone"]').classList.add('active');
  } catch (e) { alert('网络连接异常，请检查网络后重试'); }
});

function currentChannel() {
  const radios = document.querySelectorAll('input[name="code_channel"]');
  for (const r of radios) if (r.checked) return r.value;
  return 'sms';
}

// Send verification code (SMS/Email)
sendCodeBtn.addEventListener('click', async () => {
  if (!sessionId) return alert('会话未创建');
  const channel = currentChannel();
  const cc = phoneCountrySelect.value, num = phoneNumberInput.value.trim();
  const email = emailInput.value.trim();
  try {
    let url = `${API_BASE}/registration/sessions/${sessionId}/sms/send`;
    let payload = { phone_country_code: cc, phone_number: num };
    if (channel === 'email') {
      url = `${API_BASE}/registration/sessions/${sessionId}/email/send`;
      payload = { email };
      if (!validateEmailLocal(email)) { setError('code-error', '邮箱格式不正确'); return; }
    } else {
      if (!validatePhoneLocal(cc, num)) { setError('code-error', '请输入正确的手机号'); return; }
    }
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    const data = await res.json();
    if (!res.ok) { setError('code-error', data.message || '发送失败'); codeStatusEl.textContent = ''; return; }
    setError('code-error', '');
    codeStatusEl.textContent = channel === 'email' ? '验证码已发送到您的邮箱' : '验证码已发送到您的手机';
    let remain = data.countdown_seconds || 60;
    sendCodeBtn.disabled = true; countdownEl.textContent = `${remain}s`;
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
      remain -= 1; countdownEl.textContent = `${remain}s`;
      if (remain <= 0) { clearInterval(countdownTimer); sendCodeBtn.disabled = false; countdownEl.textContent = ''; }
    }, 1000);
  } catch (e) { setError('code-error', '网络连接异常，请检查网络后重试'); codeStatusEl.textContent = ''; }
});

// Verify code (SMS/Email)
verifyCodeBtn.addEventListener('click', async () => {
  if (!sessionId) return alert('会话未创建');
  const code = smsCodeInput.value.trim();
  const channel = currentChannel();
  try {
    const url = channel === 'email'
      ? `${API_BASE}/registration/sessions/${sessionId}/email/verify`
      : `${API_BASE}/registration/sessions/${sessionId}/sms/verify`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) });
    const data = await res.json();
    if (!res.ok) { setError('code-error', data.message || '验证码错误'); return; }
    hide(phoneForm); show(identityForm);
    document.querySelector('.step.active').classList.remove('active');
    document.querySelector('.step[data-step="identity"]').classList.add('active');
    // 自动触发身份核验
    await verifyIdentity();
  } catch (e) { setError('code-error', '网络连接异常，请检查网络后重试'); }
});

// Identity verify
async function verifyIdentity() {
  if (!sessionId) return alert('会话未创建');
  try {
    const res = await fetch(`${API_BASE}/registration/sessions/${sessionId}/identity/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id_type: idTypeSelect.value, id_number: idNumberInput.value.trim(), name: nameInput.value.trim() })
    });
    const data = await res.json();
    if (!res.ok) { setError('identity-error', data.message || '核验失败'); identityStatusEl.textContent = ''; return; }
    identityStatusEl.textContent = '身份信息验证通过';
    hide(identityForm); show(termsForm);
    document.querySelector('.step.active').classList.remove('active');
    document.querySelector('.step[data-step="terms"]').classList.add('active');
  } catch (e) { setError('identity-error', '网络连接异常，请检查网络后重试'); identityStatusEl.textContent = ''; }
}

verifyIdentityBtn.addEventListener('click', verifyIdentity);

// Accept terms -> complete registration
acceptTermsBtn.addEventListener('click', async () => {
  if (!sessionId) return alert('会话未创建');
  try {
    const tres = await fetch(`${API_BASE}/registration/sessions/${sessionId}/terms`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ terms_version: 'v2025.11_服务条款', privacy_version: 'v2025.11_隐私权政策', accepted: true })
    });
    const tdata = await tres.json();
    if (!tres.ok) { alert(tdata.message || '条款确认失败'); return; }

    const cres = await fetch(`${API_BASE}/registration/sessions/${sessionId}/complete`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    const cdata = await cres.json();
    if (cres.status === 201) {
      hide(termsForm); show(completeSection);
      document.querySelector('.step.active').classList.remove('active');
      document.querySelector('.step[data-step="complete"]').classList.add('active');
      // 1秒内自动跳转
      setTimeout(() => { window.location.href = '/login.html'; }, 800);
    } else {
      alert(cdata.message || '完成注册失败');
    }
  } catch (e) { alert('网络连接异常，请检查网络后重试'); }
});

// Go to login
qs('goto_login').addEventListener('click', () => {
  window.location.href = '/login.html';
});

// 邮箱校验（前端）
function validateEmailLocal(email) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}

// 严格身份证校验（前端提示，不影响后端测试）
function isValidChineseID(id) {
  if (!/^\d{17}[\dXx]$/.test(id)) return false;
  const weights = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];
  const codes = ['1','0','X','9','8','7','6','5','4','3','2'];
  const digits = id.substring(0,17).split('').map(d => parseInt(d,10));
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  const last = codes[sum % 11];
  if (last !== id[17].toUpperCase()) return false;
  const y = parseInt(id.substring(6,10),10);
  const m = parseInt(id.substring(10,12),10);
  const day = parseInt(id.substring(12,14),10);
  const date = new Date(y, m-1, day);
  const now = new Date();
  if (date.getFullYear() !== y || date.getMonth() !== m-1 || date.getDate() !== day) return false;
  if (y < 1900 || date > now) return false;
  return true;
}

idNumberInput.addEventListener('blur', () => {
  const id = idNumberInput.value.trim();
  const type = idTypeSelect.value;
  if (type === '居民身份证' && !isValidChineseID(id)) {
    setError('id-error', '身份证格式错误或校验位不正确');
  }
});

const linkTerms = document.getElementById('link-terms');
const linkPrivacy = document.getElementById('link-privacy');
function recordClick(kind, url) {
  try {
    const key = 'LINK_CLICK_EVENTS';
    const prev = JSON.parse(localStorage.getItem(key) || '[]');
    prev.push({ kind, url, ts: Date.now() });
    localStorage.setItem(key, JSON.stringify(prev.slice(-100)));
  } catch (e) {}
}
function handleDocLink(e) {
  e.preventDefault();
  const a = e.currentTarget;
  const url = a.getAttribute('href');
  const kind = a.id === 'link-terms' ? 'terms' : 'privacy';
  recordClick(kind, url);
  setError('terms-error', '');
  fetch(url, { method: 'HEAD' })
    .then(res => { if (res.ok) { window.open(url, '_blank', 'noopener'); } else { setError('terms-error', '链接不可用，请稍后重试'); } })
    .catch(() => { setError('terms-error', '链接不可用，请稍后重试'); });
}
if (linkTerms) linkTerms.addEventListener('click', handleDocLink);
if (linkPrivacy) linkPrivacy.addEventListener('click', handleDocLink);