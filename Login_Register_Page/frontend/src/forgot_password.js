// 找回密码页面交互逻辑
const API_BASE = '/api/v1';
function $(sel) { return document.querySelector(sel); }
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function setText(el, t) { el.textContent = t || ''; }

// --- 全局状态 ---
const state = {
  phone: '',
  idType: '',
  idNumber: '',
  phone_country_code: '+86',
  reset_token: '',
};

// --- Tab 切换逻辑 ---
const tabButtons = document.querySelectorAll('.tab[role="tab"]');
const tabContents = document.querySelectorAll('.tab-content[role="tabpanel"]');

function switchTab(newTabId) {
  tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('aria-controls') === newTabId);
  });
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === newTabId);
  });
  stopQrSimulation();
}

tabButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const tabId = btn.getAttribute('aria-controls');
    switchTab(tabId);
  });
});

// --- 手机找回多步骤逻辑 ---
const phoneStepsIndicator = $('#phoneSteps');
const phoneStepPanels = {
  1: $('#phone-step-1'),
  2: $('#phone-step-2'),
  3: $('#phone-step-3'),
  4: $('#phone-step-4'),
};

function goToPhoneStep(step) {
  phoneStepsIndicator.querySelectorAll('li').forEach(li => {
    li.classList.toggle('active', li.dataset.step === String(step));
  });
  for (const stepNum in phoneStepPanels) {
    if (phoneStepPanels[stepNum]) {
      phoneStepPanels[stepNum].classList.toggle('hidden', stepNum !== String(step));
    }
  }
  setText($('#errorTip'), '');
  setText($('#successTip'), '');
}

// --- API 调用封装 ---
async function apiCall(endpoint, { method = 'POST', body = null, button = null } = {}) {
  const originalButtonText = button ? button.textContent : '';
  if (button) {
    button.disabled = true;
    button.textContent = '处理中...';
  }
  setText($('#errorTip'), '');
  setText($('#successTip'), '');

  try {
    const headers = { 'Content-Type': 'application/json' };
    const options = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(API_BASE + endpoint, options);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || '请求失败');
    }
    return data;
  } catch (err) {
    setText($('#errorTip'), err.message);
    return null;
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalButtonText;
    }
  }
}

// --- 步骤 1: 填写账户信息并请求验证码 ---
async function requestPhoneCode(button) {
  state.phone = $('#phone').value.trim();
  state.idType = $('#phoneIdType').value;
  state.idNumber = $('#idNumber').value.trim();

  if (!/^1[3-9]\d{9}$/.test(state.phone)) {
    setText($('#errorTip'), '手机号格式不正确');
    return;
  }
  if (!state.idNumber) {
    setText($('#errorTip'), '请输入证件号码');
    return;
  }

  const data = await apiCall('/auth/password/phone/request', {
    body: {
      phone_country_code: state.phone_country_code,
      phone_number: state.phone,
      id_type: state.idType,
      id_number: state.idNumber,
    },
    button,
  });

  if (data && data.status === 'sent') {
    setText($('#successTip'), '验证码已发送，请注意查收。');
    $('#phone-display').value = `(+86) ${state.phone}`;
    if (button.id === 'submitAccount') {
        goToPhoneStep(2);
    }
    // 启动或重置倒计时
    startSmsCountdown($('#get-phone-code-btn'));
    // 在开发模式下，如果API返回了验证码，则自动填充
    if (data.dev_code) {
        $('#phone-verification-code').value = data.dev_code;
    }
  }
}

$('#submitAccount').addEventListener('click', (e) => requestPhoneCode(e.target));

// --- 步骤 2: 验证手机验证码 ---
function startSmsCountdown(btn) {
    let seconds = 60;
    btn.disabled = true;
    const countdown = setInterval(() => {
        seconds--;
        btn.textContent = `${seconds}秒后可重发`;
        if (seconds <= 0) {
            clearInterval(countdown);
            btn.textContent = '获取手机验证码';
            btn.disabled = false;
        }
    }, 1000);
}

$('#get-phone-code-btn').addEventListener('click', (e) => requestPhoneCode(e.target));

$('#submit-phone-code').addEventListener('click', async (e) => {
  const code = $('#phone-verification-code').value.trim();
  if (!/\d{6}/.test(code)) {
    setText($('#errorTip'), '请输入6位数字验证码');
    return;
  }

  const data = await apiCall('/auth/password/phone/verify', {
    body: {
      phone_country_code: state.phone_country_code,
      phone_number: state.phone,
      code: code,
    },
    button: e.target,
  });

  if (data && data.reset_token) {
    state.reset_token = data.reset_token;
    goToPhoneStep(3);
  }
});

// --- 步骤 3: 设置新密码 ---
$('#submit-new-password').addEventListener('click', async (e) => {
  const newPassword = $('#new-password').value;
  const confirmPassword = $('#confirm-new-password').value;

  if (newPassword.length < 6) {
    setText($('#errorTip'), '密码长度不能少于6位');
    return;
  }
  if (newPassword !== confirmPassword) {
    setText($('#errorTip'), '两次输入的密码不一致');
    return;
  }

  const data = await apiCall('/auth/password/reset', {
    body: {
      reset_token: state.reset_token,
      new_password: newPassword,
    },
    button: e.target,
  });

  if (data && data.success) {
    goToPhoneStep(4);
  }
});

// --- 邮箱找回逻辑 ---
$('#sendEmail').addEventListener('click', async (e) => {
  const email = $('#email').value.trim();
  const idNumber = $('#emailIdNumber').value.trim();
  if (!email.includes('@')) {
    setText($('#errorTip'), '邮箱格式不正确');
    return;
  }
   if (!idNumber) {
    setText($('#errorTip'), '请输入证件号码');
    return;
  }

  const data = await apiCall('/auth/password/email/request', {
      body: {
          email: email,
          id_type: $('#emailIdType').value,
          id_number: idNumber,
      },
      button: e.target
  });

  if (data && data.status === 'sent') {
    setText($('#successTip'), '密码重置邮件已发送，请登录邮箱查看。');
  }
});

// --- 人脸识别模拟 ---
const qrStatusEl = $('#qrStatus');
let qrInterval;

function startQrSimulation() {
  if (qrInterval) clearInterval(qrInterval);
  let dots = 1;
  qrStatusEl.textContent = '等待扫描.';
  qrInterval = setInterval(() => {
    qrStatusEl.textContent = `等待扫描${'.'.repeat(dots)}`;
    dots = (dots % 3) + 1;
  }, 500);
}

function stopQrSimulation() {
  if (qrInterval) {
    clearInterval(qrInterval);
    qrStatusEl.textContent = '等待扫描...';
  }
}

$('#tab-face-btn').addEventListener('click', startQrSimulation);

// --- 初始化 ---
switchTab('tab-phone');
goToPhoneStep(1);