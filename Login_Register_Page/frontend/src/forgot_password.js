// 找回密码页面交互逻辑
const API_BASE = '/api/v1';
function $(sel) { return document.querySelector(sel); }
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function setText(el, t) { el.textContent = t || ''; }

// Tabs
const tabPhoneBtn = $('#tab-phone-btn');
const tabEmailBtn = $('#tab-email-btn');
const tabFaceBtn = $('#tab-face-btn');
const tabPhone = $('#tab-phone');
const tabEmail = $('#tab-email');
const tabFace = $('#tab-face');

function switchTab(tab) {
  [tabPhoneBtn, tabEmailBtn, tabFaceBtn].forEach(b => b.classList.remove('active'));
  [tabPhone, tabEmail, tabFace].forEach(t => t.classList.remove('active'));
  if (tab === 'phone') { tabPhoneBtn.classList.add('active'); tabPhone.classList.add('active'); }
  if (tab === 'email') { tabEmailBtn.classList.add('active'); tabEmail.classList.add('active'); }
  if (tab === 'face') {
    tabFaceBtn.classList.add('active');
    tabFace.classList.add('active');
    startFace();
  } else {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }
}

tabPhoneBtn.addEventListener('click', () => switchTab('phone'));
tabEmailBtn.addEventListener('click', () => switchTab('email'));
tabFaceBtn.addEventListener('click', () => switchTab('face'));

// Maintenance simulation
const maintenanceTip = $('#maintenanceTip');
const MAINT_KEY = 'simulate_maintenance';
function isMaintenanceOn() { return localStorage.getItem(MAINT_KEY) === '1'; }
// 账户信息提交状态（手机找回）
let phoneAccountReady = false;
function applyMaintenanceUI() {
  const on = isMaintenanceOn();
  if (on) {
    show(maintenanceTip);
    $('#sendSms').disabled = true;
    $('#sendEmail').disabled = true;
    if ($('#submitAccount')) $('#submitAccount').disabled = true;
  } else {
    hide(maintenanceTip);
    $('#sendSms').disabled = !phoneAccountReady;
    $('#sendEmail').disabled = false;
    if ($('#submitAccount')) $('#submitAccount').disabled = false;
  }
}
applyMaintenanceUI();
// 供测试使用的模拟方法
window.maintenance_on = () => { localStorage.setItem(MAINT_KEY, '1'); applyMaintenanceUI(); };
window.maintenance_off = () => { localStorage.removeItem(MAINT_KEY); applyMaintenanceUI(); };

// Common state
let currentResetToken = null;
let faceQrId = null;

// Phone recovery elements
const phoneInput = $('#phone');
const phoneIdType = $('#phoneIdType');
const idNumberInput = $('#idNumber');
const submitAccountBtn = $('#submitAccount');
const sendSmsBtn = $('#sendSms');
const smsCountdownEl = $('#smsCountdown');
const smsCodeInput = $('#smsCode');
const verifySmsBtn = $('#verifySms');
const phoneStepsEl = document.getElementById('phoneSteps');
function setPhoneStep(step) {
  if (!phoneStepsEl) return;
  [...phoneStepsEl.querySelectorAll('li')].forEach(li => {
    li.classList.toggle('active', li.getAttribute('data-step') === String(step));
  });
}

// 提交账户信息 -> 进入步骤2
if (submitAccountBtn) {
  submitAccountBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const phone = phoneInput.value.trim();
    const idType = phoneIdType ? phoneIdType.value : '居民身份证';
    const idNo = idNumberInput.value.trim();
    const phoneOk = /^1[3-9]\d{9}$/.test(phone);
    if (!phoneOk) { setText($('#errorTip'), '手机号格式不正确'); return; }
    if (!idNo) { setText($('#errorTip'), '请输入证件号码'); return; }
    phoneAccountReady = true;
    setPhoneStep(2);
    setText($('#errorTip'), '');
    sendSmsBtn.disabled = isMaintenanceOn() ? true : false;
  });
}

sendSmsBtn.addEventListener('click', async () => {
  if (!phoneAccountReady) { setText($('#errorTip'), '请先提交账户信息'); return; }
  const phone_number = phoneInput.value.trim();
  const id_type = phoneIdType ? phoneIdType.value : '居民身份证';
  const id_number = idNumberInput.value.trim();
  try {
    const res = await fetch(`${API_BASE}/auth/password/phone/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(isMaintenanceOn() ? { 'x-simulate-maintenance': '1' } : {}) },
      body: JSON.stringify({ phone_number, id_type, id_number })
    });
    const data = await res.json();
    if (!res.ok) {
      setText($('#errorTip'), data.message || '短信发送失败');
      return;
    }
    // 启动倒计时（简单展示）
    setText(smsCountdownEl, '(05:00)');
    setText($('#errorTip'), '');
    setPhoneStep(2);
  } catch (e) { setText($('#errorTip'), '网络错误，请稍后重试'); }
});

verifySmsBtn.addEventListener('click', async () => {
  const phone_number = phoneInput.value.trim();
  const code = smsCodeInput.value.trim();
  try {
    const res = await fetch(`${API_BASE}/auth/password/phone/verify`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone_number, code })
    });
    const data = await res.json();
    if (!res.ok) { setText($('#errorTip'), data.message || '验证码错误'); return; }
    currentResetToken = data.reset_token;
    show($('#newPasswordForm'));
    setText($('#errorTip'), ''); setText($('#successTip'), '');
    setPhoneStep(3);
  } catch (e) { setText($('#errorTip'), '网络错误，请稍后重试'); }
});

// Email recovery
const emailInput = $('#email');
const sendEmailBtn = $('#sendEmail');
const emailSentTip = $('#emailSentTip');
const emailIdType = $('#emailIdType');
const emailIdNumber = $('#emailIdNumber');

sendEmailBtn.addEventListener('click', async () => {
  const email = emailInput.value.trim();
  // 前端格式校验，避免无效请求并使交互更快地显示错误
  const emailOk = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
  if (!emailOk) {
    setText($('#errorTip'), '邮箱格式不正确');
    setText(emailSentTip, '');
    return;
  }
  const id_type = emailIdType ? emailIdType.value : '居民身份证';
  const id_number = emailIdNumber ? emailIdNumber.value.trim() : '';
  if (!id_number) {
    setText($('#errorTip'), '请输入证件号码');
    setText(emailSentTip, '');
    return;
  }
  try {
    const res = await fetch(`${API_BASE}/auth/password/email/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(isMaintenanceOn() ? { 'x-simulate-maintenance': '1' } : {}) },
      body: JSON.stringify({ email, id_type, id_number })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === 'EMAIL_INVALID_FORMAT') setText($('#errorTip'), '邮箱格式不正确');
      else setText($('#errorTip'), data.message || '邮件发送失败');
      setText(emailSentTip, '');
      return;
    }
    setText($('#errorTip'), '');
    setText(emailSentTip, '邮件已发送');
  } catch (e) { setText($('#errorTip'), '网络错误，请稍后重试'); }
});

// Face recovery
const qrImage = $('#qrcode');
const qrStatus = $('#qrStatus');
const mockScan = $('#face-mock-scan');
const mockConfirm = $('#face-mock-confirm');
const mockExpire = $('#face-mock-expire');
let pollTimer = null;

async function startFace() {
  try {
    const res = await fetch(`${API_BASE}/auth/password/face/start`);
    const data = await res.json();
    if (!res.ok) { setText($('#errorTip'), data.message || '二维码生成失败'); return; }
    faceQrId = data.qrcode_id;
    qrImage.src = `data:image/png;base64,${data.image_data}`;
    setText(qrStatus, '未扫码');
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = setInterval(pollFaceStatus, (data.poll_interval_seconds || 2) * 1000);
  } catch (e) { setText($('#errorTip'), '网络错误，请稍后重试'); }
}

async function pollFaceStatus() {
  if (!faceQrId) return;
  try {
    const res = await fetch(`${API_BASE}/auth/password/face/status?qrcode_id=${encodeURIComponent(faceQrId)}`);
    const data = await res.json();
    if (!res.ok) { setText($('#errorTip'), data.message || '状态轮询失败'); return; }
    setText(qrStatus, data.status === 'unscanned' ? '未扫码' : data.status === 'scanned' ? '已扫码' : data.status === 'confirmed' ? '已确认' : '二维码已过期');
    if (data.status === 'expired') { clearInterval(pollTimer); pollTimer = null; }
    if (data.status === 'confirmed') {
      clearInterval(pollTimer); pollTimer = null;
      // 获取重置令牌
      const cRes = await fetch(`${API_BASE}/auth/password/face/confirm`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ qrcode_id: faceQrId })
      });
      const cData = await cRes.json();
      if (cRes.ok) { currentResetToken = cData.reset_token; show($('#newPasswordForm')); }
    }
  } catch (e) { /* ignore transient errors */ }
}



mockScan.addEventListener('click', async () => {
  if (!faceQrId) return;
  await fetch(`${API_BASE}/auth/password/face/${encodeURIComponent(faceQrId)}/status`, { headers: { 'x-dev-scan': '1' } });
  await pollFaceStatus();
});
mockConfirm.addEventListener('click', async () => {
  if (!faceQrId) return;
  await fetch(`${API_BASE}/auth/password/face/${encodeURIComponent(faceQrId)}/status`, { headers: { 'x-dev-confirm': '1' } });
  await pollFaceStatus();
});
mockExpire.addEventListener('click', async () => {
  if (!faceQrId) return;
  await fetch(`${API_BASE}/auth/password/face/${encodeURIComponent(faceQrId)}/status`, { headers: { 'x-dev-expired': '1' } });
  await pollFaceStatus();
});

// New password strength & submit
const newPasswordInput = $('#newPassword');
const strengthMeter = $('#strengthMeter');
const submitNewPasswordBtn = $('#submitNewPassword');

function updateStrength() {
  const p = newPasswordInput.value || '';
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasDigit = /\d/.test(p);
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};:,.?/\\|]/.test(p);
  strengthMeter.classList.remove('weak', 'medium', 'strong');
  let cls = 'weak';
  if (p.length >= 8 && ((hasUpper && hasLower && hasDigit) || (hasUpper && hasDigit) || (hasLower && hasDigit))) cls = 'medium';
  if (p.length >= 12 && hasUpper && hasLower && hasDigit && hasSpecial) cls = 'strong';
  strengthMeter.classList.add(cls);
}

newPasswordInput.addEventListener('input', updateStrength);

submitNewPasswordBtn.addEventListener('click', async () => {
  const new_password = newPasswordInput.value.trim();
  if (!currentResetToken) { setText($('#errorTip'), '缺少重置令牌，请先完成验证'); return; }
  try {
    const res = await fetch(`${API_BASE}/auth/password/reset`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...(isMaintenanceOn() ? { 'x-simulate-maintenance': '1' } : {}) }, body: JSON.stringify({ reset_token: currentResetToken, new_password })
    });
    const data = await res.json();
    if (!res.ok) {
      if (data.error === 'PASSWORD_WEAK') setText($('#errorTip'), '密码强度不足');
      else setText($('#errorTip'), data.message || '设置新密码失败');
      setText($('#successTip'), '');
      return;
    }
    setText($('#errorTip'), '');
    setText($('#successTip'), '密码已重置，请使用新密码登录');
    setPhoneStep(4);
  } catch (e) { setText($('#errorTip'), '网络错误，请稍后重试'); }
});
