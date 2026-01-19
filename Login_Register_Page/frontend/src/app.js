const API_BASE = '/api/v1';

// Helpers
function qs(id) { return document.getElementById(id); }
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function setError(id, msg) {
  const el = qs(id);
  if (!el) return;
  el.textContent = msg || '';
}

function setInvalid(inputEl, invalid) {
  if (!inputEl) return;
  if (invalid) inputEl.classList.add('invalid');
  else inputEl.classList.remove('invalid');
}

function setFieldError(inputEl, errorId, msg) {
  setError(errorId, msg);
  setInvalid(inputEl, !!msg);
}

function requiredMessage(label) {
  return `请填写${label}`;
}

function termsRequiredMessage() {
  return '请确认服务条款';
}

function markTouched(el) {
  if (!el) return;
  el.dataset.touched = '1';
}

function isTouched(el) {
  return !!el && el.dataset.touched === '1';
}

function isEmptyFieldValue(el) {
  if (!el) return true;
  const tag = (el.tagName || '').toLowerCase();
  const type = (el.getAttribute && el.getAttribute('type')) || '';
  if (type === 'checkbox') return !el.checked;
  if (tag === 'select') return !String(el.value || '').trim();
  return !String(el.value || '').trim();
}

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
const termsContent = qs('terms-content');
const agreeTermsFinal = qs('agree_terms_final');
const termsFinalError = qs('terms-final-error');

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
  markTouched(usernameInput);
  const u = usernameInput.value.trim();
  if (!u) {
    setFieldError(usernameInput, 'username-error', requiredMessage('用户名'));
    return;
  }
  const vu = validateUsernameDetail(u);
  if (!vu.ok) {
    setFieldError(usernameInput, 'username-error', vu.message);
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/users/username/check?username=${encodeURIComponent(u)}`);
    const data = await res.json();
    if (!res.ok) {
      setFieldError(usernameInput, 'username-error', data.message || '用户名校验失败');
    } else if (data.available === false) {
      setFieldError(usernameInput, 'username-error', '该用户名已经占用，请重新选择用户名！');
    } else {
      setFieldError(usernameInput, 'username-error', '');
    }
  } catch (e) {
    setFieldError(usernameInput, 'username-error', '网络连接异常，请检查网络后重试');
  }
});

usernameInput.addEventListener('input', () => {
  if (!isTouched(usernameInput)) return;
  const u = usernameInput.value.trim();
  if (!u) {
    setFieldError(usernameInput, 'username-error', requiredMessage('用户名'));
    return;
  }
  const existing = ((qs('username-error') || {}).textContent || '').trim();
  if (existing === requiredMessage('用户名')) {
    setFieldError(usernameInput, 'username-error', '');
  } else {
    setInvalid(usernameInput, !!existing);
  }
});

passwordInput.addEventListener('input', () => {
  if (!isTouched(passwordInput)) return;
  const p = passwordInput.value;
  const u = usernameInput.value;
  if (!p) {
    setFieldError(passwordInput, 'password-error', requiredMessage('登录密码'));
    strengthText.textContent = '弱';
    strengthBar.style.setProperty('--strength-w', `${40}px`);
    strengthBar.style.setProperty('--strength-color', '#e74c3c');
    return;
  }
  const r = passwordStrength(p, u);
  strengthBar.style.setProperty('--strength-w', `${r.width}px`);
  strengthBar.style.setProperty('--strength-color', r.color);
  strengthText.textContent = r.strength;
  setFieldError(passwordInput, 'password-error', r.ok ? '' : r.message || '密码格式不正确');
});

passwordInput.addEventListener('blur', () => {
  markTouched(passwordInput);
  const p = passwordInput.value;
  const u = usernameInput.value;
  if (!p) {
    setFieldError(passwordInput, 'password-error', requiredMessage('登录密码'));
    return;
  }
  const r = passwordStrength(p, u);
  setFieldError(passwordInput, 'password-error', r.ok ? '' : r.message || '密码格式不正确');
});

confirmInput.addEventListener('input', () => {
  if (!isTouched(confirmInput)) return;
  const v = confirmInput.value;
  if (!v) {
    setFieldError(confirmInput, 'confirm-error', requiredMessage('确认密码'));
    return;
  }
  if (confirmInput.value !== passwordInput.value) setFieldError(confirmInput, 'confirm-error', '确认密码与密码不同！');
  else setFieldError(confirmInput, 'confirm-error', '');
});

confirmInput.addEventListener('blur', () => {
  markTouched(confirmInput);
  const v = confirmInput.value;
  if (!v) {
    setFieldError(confirmInput, 'confirm-error', requiredMessage('确认密码'));
    return;
  }
  if (confirmInput.value !== passwordInput.value) setFieldError(confirmInput, 'confirm-error', '确认密码与密码不同！');
  else setFieldError(confirmInput, 'confirm-error', '');
});

nameInput.addEventListener('blur', () => {
  markTouched(nameInput);
  if (!nameInput.value.trim()) setFieldError(nameInput, 'name-error', requiredMessage('姓名'));
  else setFieldError(nameInput, 'name-error', '');
});

nameInput.addEventListener('input', () => {
  if (!isTouched(nameInput)) return;
  if (!nameInput.value.trim()) setFieldError(nameInput, 'name-error', requiredMessage('姓名'));
  else setFieldError(nameInput, 'name-error', '');
});

idTypeSelect.addEventListener('change', () => {
  markTouched(idTypeSelect);
  if (isTouched(idNumberInput)) idNumberInput.dispatchEvent(new Event('blur'));
});

travelerTypeSelect.addEventListener('change', () => {
  markTouched(travelerTypeSelect);
  if (isEmptyFieldValue(travelerTypeSelect)) setFieldError(travelerTypeSelect, 'traveler-type-error', requiredMessage('优惠（待）类型'));
  else setFieldError(travelerTypeSelect, 'traveler-type-error', '');
});

idNumberInput.addEventListener('blur', () => {
  markTouched(idNumberInput);
  const v = idNumberInput.value.trim();
  if (!v) {
    setFieldError(idNumberInput, 'id-error', requiredMessage('证件号码'));
    return;
  }
  const ok = validateIdLocal(idTypeSelect.value, v);
  setFieldError(idNumberInput, 'id-error', ok ? '' : '请输入正确的身份证号码格式');
});

idNumberInput.addEventListener('input', () => {
  if (!isTouched(idNumberInput)) return;
  const v = idNumberInput.value.trim();
  if (!v) setFieldError(idNumberInput, 'id-error', requiredMessage('证件号码'));
  else setFieldError(idNumberInput, 'id-error', '');
});

phoneNumberInput.addEventListener('blur', async () => {
  markTouched(phoneNumberInput);
  const cc = phoneCountrySelect.value, num = phoneNumberInput.value.trim();
  if (!num) {
    setFieldError(phoneNumberInput, 'phone-error', requiredMessage('手机号码'));
    return;
  }
  if (!validatePhoneLocal(cc, num)) { setFieldError(phoneNumberInput, 'phone-error', '请输入正确的手机号'); return; }
  try {
    const url = `${API_BASE}/users/phone/check?phone_country_code=${encodeURIComponent(cc)}&phone_number=${encodeURIComponent(num)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!res.ok) setFieldError(phoneNumberInput, 'phone-error', data.message || '手机号校验失败');
    else if (data.available === false) setFieldError(phoneNumberInput, 'phone-error', '该手机号已被注册，请尝试找回账户或联系客服');
    else setFieldError(phoneNumberInput, 'phone-error', '');
  } catch (e) { setFieldError(phoneNumberInput, 'phone-error', '网络连接异常，请检查网络后重试'); }
});

phoneNumberInput.addEventListener('input', () => {
  if (!isTouched(phoneNumberInput)) return;
  const num = phoneNumberInput.value.trim();
  if (!num) setFieldError(phoneNumberInput, 'phone-error', requiredMessage('手机号码'));
  else setFieldError(phoneNumberInput, 'phone-error', '');
});

termsCheckbox.addEventListener('change', () => {
  markTouched(termsCheckbox);
  if (!termsCheckbox.checked) setFieldError(termsCheckbox, 'terms-error', termsRequiredMessage());
  else setFieldError(termsCheckbox, 'terms-error', '');
});

function validateAccountForm() {
  const validators = [
    () => {
      const u = usernameInput.value.trim();
      if (!u) { setFieldError(usernameInput, 'username-error', requiredMessage('用户名')); return false; }
      const v = validateUsernameDetail(u);
      if (!v.ok) { setFieldError(usernameInput, 'username-error', v.message); return false; }
      setFieldError(usernameInput, 'username-error', '');
      return true;
    },
    () => {
      const p = passwordInput.value;
      if (!p) { setFieldError(passwordInput, 'password-error', requiredMessage('登录密码')); return false; }
      const u = usernameInput.value;
      const r = passwordStrength(p, u);
      setFieldError(passwordInput, 'password-error', r.ok ? '' : r.message || '密码格式不正确');
      return r.ok;
    },
    () => {
      const c = confirmInput.value;
      if (!c) { setFieldError(confirmInput, 'confirm-error', requiredMessage('确认密码')); return false; }
      if (c !== passwordInput.value) { setFieldError(confirmInput, 'confirm-error', '确认密码与密码不同！'); return false; }
      setFieldError(confirmInput, 'confirm-error', '');
      return true;
    },
    () => {
      const n = nameInput.value.trim();
      if (!n) { setFieldError(nameInput, 'name-error', requiredMessage('姓名')); return false; }
      setFieldError(nameInput, 'name-error', '');
      return true;
    },
    () => {
      if (isEmptyFieldValue(idTypeSelect)) { setFieldError(idTypeSelect, 'id-type-error', requiredMessage('证件类型')); return false; }
      setFieldError(idTypeSelect, 'id-type-error', '');
      return true;
    },
    () => {
      const v = idNumberInput.value.trim();
      if (!v) { setFieldError(idNumberInput, 'id-error', requiredMessage('证件号码')); return false; }
      const ok = validateIdLocal(idTypeSelect.value, v);
      setFieldError(idNumberInput, 'id-error', ok ? '' : '请输入正确的身份证号码格式');
      return ok;
    },
    () => {
      if (isEmptyFieldValue(travelerTypeSelect)) { setFieldError(travelerTypeSelect, 'traveler-type-error', requiredMessage('优惠（待）类型')); return false; }
      setFieldError(travelerTypeSelect, 'traveler-type-error', '');
      return true;
    },
    () => {
      const num = phoneNumberInput.value.trim();
      const cc = phoneCountrySelect.value;
      if (!num) { setFieldError(phoneNumberInput, 'phone-error', requiredMessage('手机号码')); return false; }
      if (!validatePhoneLocal(cc, num)) { setFieldError(phoneNumberInput, 'phone-error', '请输入正确的手机号'); return false; }
      setFieldError(phoneNumberInput, 'phone-error', '');
      return true;
    },
    () => {
      if (!termsCheckbox.checked) { setFieldError(termsCheckbox, 'terms-error', termsRequiredMessage()); return false; }
      setFieldError(termsCheckbox, 'terms-error', '');
      return true;
    },
  ];

  usernameInput && markTouched(usernameInput);
  passwordInput && markTouched(passwordInput);
  confirmInput && markTouched(confirmInput);
  nameInput && markTouched(nameInput);
  idTypeSelect && markTouched(idTypeSelect);
  idNumberInput && markTouched(idNumberInput);
  travelerTypeSelect && markTouched(travelerTypeSelect);
  phoneNumberInput && markTouched(phoneNumberInput);
  termsCheckbox && markTouched(termsCheckbox);

  let ok = true;
  for (const v of validators) {
    const r = v();
    ok = r && ok;
  }
  return ok;
}

// Submit account info
accountForm.addEventListener('submit', async (evt) => {
  evt.preventDefault();
  if (!validateAccountForm()) return;

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
  markTouched(smsCodeInput);
  if (!code) {
    setFieldError(smsCodeInput, 'code-error', requiredMessage('验证码'));
    return;
  }
  setFieldError(smsCodeInput, 'code-error', '');
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
    // 加载服务条款内容
    loadTermsContent();
  } catch (e) { setError('identity-error', '网络连接异常，请检查网络后重试'); identityStatusEl.textContent = ''; }
}

async function loadTermsContent() {
  if (!termsContent) return;
  termsContent.textContent = '正在加载服务条款...';
  try {
    // 尝试加载根目录下的 terms_of_service.txt
    const res = await fetch('/terms_of_service.txt');
    if (res.ok) {
      const text = await res.text();
      termsContent.textContent = text;
    } else {
      termsContent.textContent = '无法加载服务条款内容，请联系管理员。';
    }
  } catch (e) {
    termsContent.textContent = '加载服务条款失败，请检查网络连接。';
  }
}

verifyIdentityBtn.addEventListener('click', verifyIdentity);

// Accept terms -> complete registration
acceptTermsBtn.addEventListener('click', async () => {
  if (!sessionId) return alert('会话未创建');
  
  if (agreeTermsFinal && !agreeTermsFinal.checked) {
    setFieldError(agreeTermsFinal, 'terms-final-error', termsRequiredMessage());
    return;
  }
  if (agreeTermsFinal) setFieldError(agreeTermsFinal, 'terms-final-error', '');

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
  if (!id) return;
  if (type === '居民身份证' && !isValidChineseID(id)) {
    setFieldError(idNumberInput, 'id-error', '身份证格式错误或校验位不正确');
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
