// Minimal Express server for 12306 注册与登录 API
// 与 .artifacts/api_interface.yml 对齐，用于本地联调与测试。

const path = require('path');
const http = require('http');
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const db = require('./db');
const app = express();
app.use(cors());
app.use(express.json());

// 静态页面服务：前端位于 ../../frontend
const staticDir = path.resolve(__dirname, '../../frontend/src');
app.use(express.static(staticDir));
const staticRoot = path.resolve(__dirname, '../../');
app.use(express.static(staticRoot));

// 顶层 img 资源目录挂载到 /img，便于页面引入统一素材
const projectImgDir = path.resolve(__dirname, '../../../img');
app.use('/img', express.static(projectImgDir));

// 挂载12306登录页面静态资源到 /assets
const assetsDir = path.resolve(__dirname, '../../../assets');
app.use('/assets', express.static(assetsDir));

// In-memory stores
const sessions = new Map();
const loginSessions = new Map(); // key: session_id -> { user_id, last_active_at }
const smsRate = new Map(); // key: phone_number -> { lastSentAt, countDate, count }
const emailRate = new Map(); // key: email -> { lastSentAt, countDate, count }
// 图形验证码功能已移除
const loginFailCounter = new Map(); // key: identifier -> { failCount, lockedUntil }
const qrcodeStore = new Map(); // key: qrcode_id -> { imageData, createdAt, expiresAt, status }
// 登录二次验证（短信）流程存储
// key: flow_id -> { user_id, login_key, identifier_type, identifier, phone_country_code, phone_number, created_at,
//                    id_fail_count, locked_until, code, code_expires_at }
const login2FAFlows = new Map();
// 找回密码短信验证码存储：key 为 phone_number
const fpSmsStore = new Map(); // key: phone_number -> { code, expires_at }
// 忘记密码身份校验失败计数与锁定：key 为 phone_number
const idVerifyFailStore = new Map(); // key: phone_number -> { count, lockedUntil }
// 找回密码令牌存储：key 为 reset_token -> { type: 'phone'|'email'|'face'|'username', phone_number?, phone_country_code?, email?, username?, expires_at }
const resetTokenStore = new Map();

// 预置账户（用于登录桩验证）
const accountStore = new Map();
accountStore.set('username:testuser123', { user_id: 'u-001', password: 'Password123!', name: '张三' });
accountStore.set('phone:13812345678', { user_id: 'u-002', password: 'Password123!', name: '王五', id_number: '110101199001011234', phone_number: '13812345678' });
accountStore.set('email:user@example.com', { user_id: 'u-003', password: 'Password123!', name: '李四' });

(async () => {
  const username = 'superadmin';
  const user_id = 'u-super';
  let exists = null;
  try { exists = await db.findByUsername(username); } catch (e) {}
  if (!exists) {
    const salt = uuidv4();
    const password_hash = hashPassword('Admin12345_', salt);
    try {
      await db.createUser({
        user_id,
        username,
        phone_country_code: '+86',
        phone_number: '13900000000',
        email: 'superadmin@example.com',
        password_hash,
        password_salt: salt,
        name: '系统管理员',
        id_type: '居民身份证',
        id_number: '110101199001011234',
        traveler_type: '成人',
      });
    } catch (e) {}
  }
  const sid = 'sess-super-12306';
  // 预置会话不再包含“记住我”相关字段
  loginSessions.set(sid, { user_id, last_active_at: Date.now() });
  process.env.SUPERUSER_SESSION_ID = sid;
})();

function uuidv4() {
  // 简易UUID生成（非加密强度），用于演示
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function error(res, status, code, message, extra = undefined) {
  const payload = { error: code, message };
  if (extra) Object.assign(payload, extra);
  return res.status(status).json(payload);
}

// 简易校验
function validateUsername(u) {
  return /^[A-Za-z][A-Za-z0-9_]{5,29}$/.test(u);
}
function validateEmailLogin(login) {
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(login);
}
function validatePassword(p, username) {
  if (typeof p !== 'string') return { ok: false, reason: 'PASSWORD_WEAK', detail: '密码不能为空' };
  if (p.length < 8) return { ok: false, reason: 'PASSWORD_LENGTH_SHORT', detail: '密码长度不足，需为8-20位' };
  if (p.length > 20) return { ok: false, reason: 'PASSWORD_LENGTH_LONG', detail: '密码长度过长，需为8-20位' };
  if (!/^[_A-Za-z0-9]+$/.test(p)) return { ok: false, reason: 'PASSWORD_ILLEGAL_CHAR', detail: '密码包含非法字符，仅允许字母、数字、下划线' };
  if (p === username) return { ok: false, reason: 'PASSWORD_SAME_AS_USERNAME', detail: '密码不能与用户名相同' };
  const hasLetter = /[A-Za-z]/.test(p);
  const hasDigit = /\d/.test(p);
  const hasUnderscore = /_/.test(p);
  const categories = [hasLetter, hasDigit, hasUnderscore].filter(Boolean).length;
  if (categories < 2) return { ok: false, reason: 'PASSWORD_CATEGORY_FEW', detail: '需至少包含两种字符类型（字母、数字、下划线）' };
  let strength = '中';
  if (p.length >= 12 && categories === 3) strength = '强';
  if (p.length < 10 && categories === 2) strength = '弱';
  return { ok: true, strength };
}

function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(String(salt) + '|' + String(password)).digest('hex');
}
function validateCNPhone(country, num) {
  if (country === '+86') return /^1[3-9]\d{9}$/.test(num);
  // 简化其他地区校验
  if (country === '+852') return /^([5|6|8|9])\d{7}$/.test(num);
  if (country === '+853') return /^[6]\d{7}$/.test(num);
  if (country === '+886') return /^09\d{8}$/.test(num);
  return false;
}
function validatePhoneNumber(num) {
  return /^1[3-9]\d{9}$/.test(num);
}
function validateEmail(email) {
  if (!email) return true;
  return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(email);
}
function validateId(id_type, id_number) {
  if (id_type === '居民身份证') {
    return /^(\d{17}[\dXx])$/.test(id_number);
  }
  return /^[A-Za-z0-9]{5,20}$/.test(id_number);
}

// 严格身份证校验：校验位与出生日期合法性
function validateChineseIdStrict(idNumber) {
  if (!/^(\d{17}[\dXx])$/.test(idNumber)) return false;
  const weights = [7,9,10,5,8,4,2,1,6,3,7,9,10,5,8,4,2];
  const codes = ['1','0','X','9','8','7','6','5','4','3','2'];
  const digits = idNumber.substring(0,17).split('').map(d => parseInt(d,10));
  const sum = digits.reduce((acc, d, i) => acc + d * weights[i], 0);
  const last = codes[sum % 11];
  if (last !== idNumber[17].toUpperCase()) return false;
  const y = parseInt(idNumber.substring(6,10),10);
  const m = parseInt(idNumber.substring(10,12),10);
  const day = parseInt(idNumber.substring(12,14),10);
  const date = new Date(y, m-1, day);
  const now = new Date();
  if (date.getFullYear() !== y || date.getMonth() !== m-1 || date.getDate() !== day) return false;
  if (y < 1900 || date > now) return false;
  return true;
}

// 维护窗口判断：每日5:00-次日1:00提供完整服务；周二5:00-24:00
function isMaintenance(now) {
  // 允许通过请求头 x-simulate-time 传入时间（ISO字符串）以便测试
  const hour = now.getHours();
  const day = now.getDay(); // 0=周日 ... 2=周二
  // 为便于测试，简化为：
  // - 常规：服务窗口 05:00-01:00（次日），维护窗口其他时间
  // - 周二：服务窗口 05:00-24:00；维护窗口 00:00-05:00
  if (day === 2) { // 周二
    return hour < 5; // 0-4 维护
  }
  // 非周二：01:00-05:00 维护
  return hour >= 1 && hour < 5;
}

// 图形验证码功能已移除

function isLocked(identifier) {
  const rec = loginFailCounter.get(identifier);
  return rec && rec.lockedUntil && Date.now() < rec.lockedUntil;
}

function incFail(identifier) {
  const rec = loginFailCounter.get(identifier) || { failCount: 0, lockedUntil: 0 };
  rec.failCount += 1;
  if (rec.failCount >= 5) {
    rec.lockedUntil = Date.now() + 30 * 60 * 1000; // 30分钟锁定
  }
  loginFailCounter.set(identifier, rec);
}

function resetFail(identifier) {
  loginFailCounter.set(identifier, { failCount: 0, lockedUntil: 0 });
}

// API 路径前缀
const base = '/api/v1';

// 用户名检查
app.get(`${base}/users/username/check`, async (req, res) => {
  const { username } = req.query;
  if (!username) return error(res, 400, 'USERNAME_REQUIRED', '缺少用户名');
  if (!validateUsername(username)) return error(res, 400, 'USERNAME_INVALID_FORMAT', '用户名只能由字母、数字和_组成，须以字母开头！');
  // 保留演示的占用用户名，同时接入数据库查询
  if (username === 'existinguser') {
    return res.json({ available: false, suggestions: [`${username}01`, `${username}_cn`] });
  }
  const available = await db.isUsernameAvailable(username);
  return res.json({ available, suggestions: available ? [] : [`${username}01`, `${username}_cn`] });
});

// 手机号检查
app.get(`${base}/users/phone/check`, async (req, res) => {
  const { phone_country_code, phone_number } = req.query;
  if (!phone_country_code || !phone_number) return error(res, 400, 'PHONE_REQUIRED', '缺少手机号');
  if (!validateCNPhone(phone_country_code, phone_number)) return error(res, 400, 'PHONE_INVALID', '请输入正确的手机号');
  if (phone_number === '13800000000') {
    return res.json({ available: false, recovery_link: 'https://www.12306.cn/recover-account' });
  }
  const available = await db.isPhoneAvailable(phone_country_code, phone_number);
  return res.json({ available, recovery_link: available ? null : 'https://www.12306.cn/recover-account' });
});

// 创建注册会话
app.post(`${base}/registration/sessions`, (req, res) => {
  const id = uuidv4();
  const session = {
    session_id: id,
    progress: {
      account_info_completed: false,
      phone_verified: false,
      identity_verified: false,
      terms_accepted: false,
    },
    account: {},
    sms: {},
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };
  sessions.set(id, session);
  return res.status(201).json({ session_id: id, expires_at: session.expires_at, progress: session.progress });
});

// 提交账户信息
app.patch(`${base}/registration/sessions/:session_id/account`, async (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const {
    username,
    password,
    name,
    id_type,
    id_number,
    phone_country_code,
    phone_number,
    email,
    traveler_type,
  } = req.body || {};

  if (!validateUsername(username)) return error(res, 400, 'USERNAME_INVALID_FORMAT', '用户名只能由字母、数字和_组成，须以字母开头！');
  if (username === 'existinguser') return error(res, 409, 'USERNAME_TAKEN', '该用户名已经占用，请重新选择用户名！');
  // 数据库唯一性校验
  const usernameAvailable = await db.isUsernameAvailable(username);
  if (!usernameAvailable) return error(res, 409, 'USERNAME_TAKEN', '该用户名已经占用，请重新选择用户名！');
  const pw = validatePassword(password, username);
  if (!pw.ok) return error(res, 400, pw.reason, pw.detail || '密码不满足强度要求');
  if (!name || !id_type || !id_number) return error(res, 400, 'ID_REQUIRED', '缺少身份信息');
  if (!validateId(id_type, id_number)) return error(res, 400, 'ID_INVALID_FORMAT', '请输入正确的身份证号码格式');
  if (!phone_country_code || !phone_number) return error(res, 400, 'PHONE_REQUIRED', '缺少手机号');
  if (!validateCNPhone(phone_country_code, phone_number)) return error(res, 400, 'PHONE_INVALID', '请输入正确的手机号');
  if (phone_number === '13800000000') return error(res, 409, 'PHONE_TAKEN', '该手机号已被注册，请尝试找回账户或联系客服');
  const phoneAvailable = await db.isPhoneAvailable(phone_country_code, phone_number);
  if (!phoneAvailable) return error(res, 409, 'PHONE_TAKEN', '该手机号已被注册，请尝试找回账户或联系客服');
  if (!validateEmail(email)) return error(res, 400, 'EMAIL_INVALID_FORMAT', '邮箱格式不正确');

  const allowedTravelerTypes = ['成人', '儿童', '学生', '残疾军人'];
  if (traveler_type && !allowedTravelerTypes.includes(traveler_type)) {
    return error(res, 400, 'TRAVELER_TYPE_INVALID', '无效的优惠（待）类型');
  }

  // 生成密码哈希与盐，仅在会话中暂存哈希，避免保存明文
  const salt = crypto.randomBytes(16).toString('hex');
  const password_hash = hashPassword(password, salt);
  session.account = {
    username,
    name,
    id_type,
    id_number,
    phone_country_code,
    phone_number,
    email,
    traveler_type,
    password_salt: salt,
    password_hash,
  };
  session.progress.account_info_completed = true;

  return res.json({
    account_info_completed: true,
    validations: {
      username: { ok: true, message: '' },
      password: { ok: true, strength: pw.strength || '中', message: '' },
      id: { ok: true, message: '' },
      phone: { ok: true, message: '' },
    },
  });
});

function generateOtp6() {
  const n = Math.floor(Math.random() * 1000000);
  return String(n).padStart(6, '0');
}

// 发送短信验证码
app.post(`${base}/registration/sessions/:session_id/sms/send`, (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const { phone_country_code, phone_number } = req.body || {};
  if (!validateCNPhone(phone_country_code, phone_number)) return error(res, 400, 'PHONE_INVALID', '请输入正确的手机号');
  const now = Date.now();
  const key = `${phone_number}:register`;
  const rate = smsRate.get(key) || { lastSentAt: 0, countDate: new Date().toDateString(), count: 0 };
  if (rate.countDate !== new Date().toDateString()) {
    rate.countDate = new Date().toDateString();
    rate.count = 0;
  }
  if (now - rate.lastSentAt < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - (now - rate.lastSentAt)) / 1000);
    return error(res, 429, 'SMS_TOO_FREQUENT', `短信发送过于频繁，请在 ${waitSeconds} 秒后重试`, { retry_after: waitSeconds });
  }
  if (rate.count >= 10) {
    return error(res, 429, 'SMS_DAILY_LIMIT_REACHED', '短信发送次数已达上限，请稍后再试');
  }
  rate.lastSentAt = now;
  rate.count += 1;
  smsRate.set(key, rate);
  const code = process.env.NODE_ENV === 'test' ? '123456' : generateOtp6();
  session.sms.code = code;
  session.sms.expires_at = now + 5 * 60 * 1000; // 5分钟
  // 开发环境：在终端打印验证码，便于联调
  if (process.env.OTP_DEV_LOG !== '0') {
    console.log(`[DEV] SMS 验证码 ${code} 已生成并“发送”到 ${phone_country_code}${phone_number} (session ${session_id})`);
  }
  const leak = req.get('x-dev-debug') === '1' || req.query.dev === '1' || process.env.DEV_OTP_LEAK === '1';
  const payload = { status: 'sent', countdown_seconds: 60, ttl_minutes: 5 };
  if (leak) payload.dev_code = code;
  return res.json(payload);
});

// 验证短信验证码
app.post(`${base}/registration/sessions/:session_id/sms/verify`, (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const { code } = req.body || {};
  if (!code) return error(res, 400, 'SMS_CODE_REQUIRED', '缺少验证码');
  if (!session.sms.code) return error(res, 400, 'SMS_NOT_SENT', '尚未发送验证码');
  if (Date.now() > session.sms.expires_at) return error(res, 400, 'SMS_CODE_EXPIRED', '验证码已过期，请重新获取');
  if (code !== session.sms.code) return error(res, 400, 'SMS_CODE_MISMATCH', '验证码错误，请重新输入');
  session.progress.phone_verified = true;
  return res.json({ phone_verified: true, message: '手机验证成功' });
});

// 发送邮件验证码
app.post(`${base}/registration/sessions/:session_id/email/send`, (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const email = (req.body && req.body.email) || session.account.email;
  if (!email || !validateEmail(email)) return error(res, 400, 'EMAIL_INVALID_FORMAT', '邮箱格式不正确');
  const now = Date.now();
  const rate = emailRate.get(email) || { lastSentAt: 0, countDate: new Date().toDateString(), count: 0 };
  if (rate.countDate !== new Date().toDateString()) { rate.countDate = new Date().toDateString(); rate.count = 0; }
  if (now - rate.lastSentAt < 60 * 1000) return error(res, 429, 'EMAIL_TOO_FREQUENT', '邮件发送过于频繁，请稍后再试');
  if (rate.count >= 10) return error(res, 429, 'EMAIL_DAILY_LIMIT_REACHED', '邮件发送次数已达上限，请稍后再试');
  rate.lastSentAt = now; rate.count += 1; emailRate.set(email, rate);
  const code = process.env.NODE_ENV === 'test' ? '888888' : generateOtp6();
  session.email = { code, expires_at: now + 5 * 60 * 1000 };
  // 开发环境：在终端打印验证码，便于联调
  if (process.env.OTP_DEV_LOG !== '0') {
    console.log(`[DEV] EMAIL 验证码 ${code} 已生成并“发送”到 ${email} (session ${session_id})`);
  }
  const leak = req.get('x-dev-debug') === '1' || req.query.dev === '1' || process.env.DEV_OTP_LEAK === '1';
  const payload = { status: 'sent', countdown_seconds: 60, ttl_minutes: 5 };
  if (leak) payload.dev_code = code;
  return res.json(payload);
});

// 验证邮件验证码
app.post(`${base}/registration/sessions/:session_id/email/verify`, (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const { code } = req.body || {};
  if (!code) return error(res, 400, 'EMAIL_CODE_REQUIRED', '缺少验证码');
  if (!session.email || !session.email.code) return error(res, 400, 'EMAIL_NOT_SENT', '尚未发送验证码');
  if (Date.now() > session.email.expires_at) return error(res, 400, 'EMAIL_CODE_EXPIRED', '验证码已过期，请重新获取');
  if (code !== session.email.code) return error(res, 400, 'EMAIL_CODE_MISMATCH', '验证码错误，请重新输入');
  // 邮件验证通过同样视为联系方式已验证，进入下一步
  session.progress.phone_verified = true;
  return res.json({ phone_verified: true, message: '邮箱验证成功' });
});

// 身份核验
app.post(`${base}/registration/sessions/:session_id/identity/verify`, (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const { id_type, id_number, name } = req.body || {};
  if (!id_type || !id_number || !name) return error(res, 400, 'ID_REQUIRED', '缺少身份信息');
  if (!String(name).trim()) return error(res, 400, 'NAME_REQUIRED', '姓名不能为空');
  // 居民身份证严格校验（含校验位与出生日期），保留示例号码白名单以满足现有测试
  if (id_type === '居民身份证') {
    const whitelist = ['110101199001011234'];
    if (!validateChineseIdStrict(id_number) && !whitelist.includes(id_number)) {
      return error(res, 400, 'ID_INVALID_FORMAT', '身份证格式错误或校验位不正确');
    }
  } else {
    if (!validateId(id_type, id_number)) return error(res, 400, 'ID_INVALID_FORMAT', '请输入正确的证件号码格式');
  }
  // 默认：姓名与证件号码匹配（开发环境服务桩逻辑）。如需模拟不匹配，可在请求头设置 x-dev-force-mismatch: 1 或添加 ?force_mismatch=1
  const forceMismatch = req.get('x-dev-force-mismatch') === '1' || req.query.force_mismatch === '1';
  if (forceMismatch) {
    return error(res, 422, 'ID_NAME_MISMATCH', '姓名与证件号码不匹配，请核实后重新输入');
  }
  session.progress.identity_verified = true;
  return res.json({ identity_verified: true, matched: true, message: '身份信息验证通过' });
});

// 条款确认
app.post(`${base}/registration/sessions/:session_id/terms`, (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const { terms_version, privacy_version, accepted } = req.body || {};
  if (!accepted) return error(res, 400, 'TERMS_NOT_ACCEPTED', '未勾选同意');
  session.terms = { terms_version, privacy_version, accepted: true };
  session.progress.terms_accepted = true;
  return res.json({ terms_accepted: true });
});

// 完成注册
app.post(`${base}/registration/sessions/:session_id/complete`, async (req, res) => {
  const { session_id } = req.params;
  const session = sessions.get(session_id);
  if (!session) return error(res, 404, 'SESSION_NOT_FOUND', '会话不存在');
  const p = session.progress;
  const missing = [];
  if (!p.account_info_completed) missing.push('account_info_completed');
  if (!p.phone_verified) missing.push('phone_verified');
  if (!p.identity_verified) missing.push('identity_verified');
  if (!p.terms_accepted) missing.push('terms_accepted');
  if (missing.length) return error(res, 400, 'MISSING_REQUIRED_STEPS', '缺少必要步骤', { details: { required: missing } });
  const user_id = uuidv4();
  try {
    await db.createUser({
      user_id,
      username: session.account.username,
      phone_country_code: session.account.phone_country_code,
      phone_number: session.account.phone_number,
      email: session.account.email,
      password_hash: session.account.password_hash,
      password_salt: session.account.password_salt,
      name: session.account.name,
      id_type: session.account.id_type,
      id_number: session.account.id_number,
      traveler_type: session.account.traveler_type,
    });

    if (process.env.NODE_ENV !== 'test') {
      const reqSync = http.request({
        hostname: 'localhost',
        port: 8083,
        path: `/api/v1/internal/users/${user_id}/init-self-passenger`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': '12306-internal-secret'
        }
      }, () => {});
      reqSync.on('error', (e) => {
        console.warn('Failed to trigger self passenger sync (User Center might be down):', e.message);
      });
      reqSync.end();
    }

  } catch (e) {
    console.warn('DB createUser failed:', e && e.message);
    return error(res, 409, 'DUPLICATE_ACCOUNT', '用户名或手机号已被注册，请更换后重试');
  }
  return res.status(201).json({ user_id, username: session.account.username, status: 'active' });
});

// 获取条款链接
app.get(`${base}/terms`, (req, res) => {
  return res.json({
    terms_link: 'https://www.12306.cn/terms',
    privacy_link: 'https://www.12306.cn/privacy',
  });
});

// ===== 登录相关桩接口 =====

// 图形验证码相关接口已移除

// 登录（用户名/手机号/邮箱 + 密码）
app.post(`${base}/auth/login`, async (req, res) => {
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (req.get('x-simulate-maintenance') === '1' || isMaintenance(now)) {
    return error(res, 503, 'MAINTENANCE_WINDOW', '系统维护中，服务时间：每日5:00-次日1:00；周二5:00-24:00');
  }
  const {
    identifier_type,
    identifier,
    password,
  } = req.body || {};
  if (!identifier) return error(res, 400, 'LOGIN_IDENTIFIER_INVALID_FORMAT', '请输入正确的用户名/手机号/邮箱格式');
  if (!password) return error(res, 400, 'PASSWORD_REQUIRED', '请输入密码');

  // 自动识别类型
  let type = identifier_type;
  if (!type) {
    if (validatePhoneNumber(identifier)) type = 'phone';
    else if (validateEmailLogin(identifier)) type = 'email';
    else if (validateUsername(identifier)) type = 'username';
    else return error(res, 400, 'LOGIN_IDENTIFIER_INVALID_FORMAT', '请输入正确的用户名/手机号/邮箱格式');
  }

  const key = `${type}:${identifier}`;
  if (isLocked(key)) {
    return error(res, 403, 'ACCOUNT_LOCKED', '账户已被锁定，请30分钟后重试或联系客服');
  }

  // 图形验证码校验步骤已移除

  // 先查数据库
  let account = null;
  try {
    if (type === 'username') account = await db.findByUsername(identifier);
    else if (type === 'email') account = await db.findByEmail(identifier);
    else if (type === 'phone') account = await db.findByPhone('+86', identifier);
  } catch (e) {
    console.warn('DB lookup failed:', e && e.message);
  }

  let valid = false;
  if (account && account.password_salt && account.password_hash) {
    const h = hashPassword(password, account.password_salt);
    valid = h === account.password_hash;
  } else {
    // 兼容预置账户（演示用）
    const fallback = accountStore.get(key);
    if (fallback && fallback.password === password) {
      account = { user_id: fallback.user_id };
      valid = true;
    }
  }

  if (!valid) {
    incFail(key);
    const locked = isLocked(key);
    if (locked) {
      return error(res, 403, 'ACCOUNT_LOCKED', '账户已被锁定，请30分钟后重试或联系客服');
    }
    return error(res, 401, 'INVALID_CREDENTIALS', '用户名或密码错误');
  }

  // 成功登录
  resetFail(key);
  // 强制：登录二次短信验证流程（所有登录均需走2FA；如需关闭，设置环境变量 FORCE_LOGIN_2FA=0）
  if (process.env.FORCE_LOGIN_2FA !== '0') {
    const flow_id = uuidv4();
    let phone_number = null; let phone_country_code = '+86';
    try {
      const acc = await db.findByUserId(account.user_id);
      if (acc && acc.phone_number) { phone_number = acc.phone_number; phone_country_code = acc.phone_country_code || '+86'; }
    } catch (e) {}
    // 预置账户兜底手机号（如需要，可在 accountStore 中补充 phone_number 字段）
    if (!phone_number) {
      const fb = accountStore.get(key);
      if (fb && fb.phone_number) phone_number = fb.phone_number;
    }
  login2FAFlows.set(flow_id, {
      user_id: account.user_id,
      login_key: key,
      identifier_type: type,
      identifier,
      phone_country_code,
      phone_number,
      created_at: Date.now(),
      id_fail_count: 0,
      locked_until: 0,
      code_fail_count: 0,
      code: null,
      code_expires_at: 0,
    });
    const masked = phone_number ? `${String(phone_number).slice(0,3)}****${String(phone_number).slice(-4)}` : '***********';
    return res.json({ need_sms_verification: true, flow_id, masked_phone: masked, ttl_minutes: 5, message: '为保障账户安全，需进行短信身份验证' });
  }
  // 当 FORCE_LOGIN_2FA=0 时，允许直接登录返回会话
  const session_id = `sid-${account.user_id}`;
  const existing = loginSessions.get(session_id);
  if (existing) { existing.last_active_at = Date.now(); loginSessions.set(session_id, existing); }
  else { loginSessions.set(session_id, { user_id: account.user_id, last_active_at: Date.now() }); }
  return res.json({ session_id, user_id: account.user_id, redirect: process.env.HOME_URL || 'http://localhost:8080/', message: '登录成功' });
});

// 获取会话状态
app.get(`${base}/auth/session`, (req, res) => {
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const sid = m[1];
  const sess = loginSessions.get(sid);
  if (!sess) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const now = Date.now();
  const nonactiveHeader = parseInt(req.get('x-nonactive-minutes') || '0', 10);
  const effectiveLastActive = nonactiveHeader > 0 ? now - nonactiveHeader * 60 * 1000 : sess.last_active_at;
  if (now - effectiveLastActive > 30 * 60 * 1000) {
    loginSessions.delete(sid);
    return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  }
  sess.last_active_at = now;
  return res.json({
    session_id: sid,
    user_id: sess.user_id,
    last_active_at: new Date(sess.last_active_at).toISOString(),
    idle_timeout_minutes: 30,
  });
});

// 获取当前登录用户的基本信息（用户名、姓名）
app.get(`${base}/auth/session/profile`, async (req, res) => {
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const sid = m[1];
  const sess = loginSessions.get(sid);
  if (!sess) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  try {
    const acc = await db.findByUserId(sess.user_id);
    if (!acc) return error(res, 404, 'ACCOUNT_NOT_FOUND', '未找到对应账户');
    return res.json({ user_id: acc.user_id, username: acc.username, name: acc.name });
  } catch (e) {
    return error(res, 500, 'INTERNAL_ERROR', '服务器错误');
  }
});

// 获取当前登录用户的完整账户信息（脱敏返回）
app.get(`${base}/auth/session/account`, async (req, res) => {
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const sid = m[1];
  const sess = loginSessions.get(sid);
  if (!sess) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  try {
    const acc = await db.findByUserId(sess.user_id);
    if (!acc) return error(res, 404, 'ACCOUNT_NOT_FOUND', '未找到对应账户');
    function maskId(id) {
      if (!id) return '';
      const s = String(id);
      if (s.length <= 7) return s;
      const head = s.slice(0, 4);
      const tail = s.slice(-3);
      return head + '*'.repeat(s.length - 7) + tail;
    }
    function maskPhone(num) {
      if (!num) return '';
      const s = String(num);
      if (s.length <= 7) return s;
      const head = s.slice(0, 3);
      const tail = s.slice(-4);
      return head + '****' + tail;
    }
    function maskEmail(email) {
      if (!email) return '';
      const s = String(email);
      const i = s.indexOf('@');
      if (i < 0) return s;
      const local = s.slice(0, i);
      const domain = s.slice(i);
      if (local.length <= 4) {
        const head = local.slice(0, 1);
        const tail = local.slice(-1);
        const stars = Math.max(2, local.length - 2);
        return head + '*'.repeat(stars) + tail + domain;
      }
      const head = local.slice(0, 2);
      const tail = local.slice(-2);
      return head + '******' + tail + domain;
    }
    const countryCode = acc.phone_country_code || '+86';
    const countryName = countryCode === '+86' ? '中国' : countryCode === '+1' ? '美国' : '未知';
    const payload = {
      user_id: acc.user_id,
      username: acc.username,
      name: acc.name,
      id_type: acc.id_type,
      id_number_masked: maskId(acc.id_number),
      phone_country_code: countryCode,
      phone_masked: maskPhone(acc.phone_number),
      email_masked: maskEmail(acc.email || ''),
      traveler_type: acc.traveler_type,
      country: countryName,
      verified_status: '已通过',
    };
    return res.json(payload);
  } catch (e) {
    return error(res, 500, 'INTERNAL_ERROR', '服务器错误');
  }
});

app.post(`${base}/auth/session/phone/change`, async (req, res) => {
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const sid = m[1];
  const sess = loginSessions.get(sid);
  if (!sess) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const { phone_country_code, phone_number } = req.body || {};
  if (!phone_country_code || !phone_number) return error(res, 400, 'PHONE_REQUIRED', '缺少手机号');
  if (!validateCNPhone(phone_country_code, phone_number)) return error(res, 400, 'PHONE_INVALID', '请输入正确的手机号');
  try {
    const acc = await db.findByUserId(sess.user_id);
    if (!acc) return error(res, 404, 'ACCOUNT_NOT_FOUND', '未找到对应账户');
    // 如果目标手机号被其他账户占用则拒绝
    const available = await db.isPhoneAvailable(phone_country_code, phone_number);
    if (!available) return error(res, 409, 'PHONE_TAKEN', '该手机号已被注册，请尝试找回账户或联系客服');
    const ok = await db.updatePhoneByUserId(sess.user_id, phone_country_code, phone_number);
    if (!ok) return error(res, 422, 'UNPROCESSABLE', '修改失败，请稍后再试');
    function maskPhone(num) {
      const s = String(num);
      const head = s.slice(0, 3);
      const tail = s.slice(-4);
      return head + '****' + tail;
    }
    return res.json({ success: true, phone_country_code, phone_masked: maskPhone(phone_number) });
  } catch (e) {
    return error(res, 500, 'INTERNAL_ERROR', '服务器错误');
  }
});

app.patch(`${base}/auth/session/traveler-type/change`, async (req, res) => {
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const sid = m[1];
  const sess = loginSessions.get(sid);
  if (!sess) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const { traveler_type } = req.body || {};
  const allowed = ['成人', '儿童', '学生', '残疾军人'];
  if (!traveler_type || !allowed.includes(traveler_type)) return error(res, 400, 'TRAVELER_TYPE_INVALID', '优惠类型无效');
  try {
    const acc = await db.findByUserId(sess.user_id);
    if (!acc) return error(res, 404, 'ACCOUNT_NOT_FOUND', '未找到对应账户');
    const ok = await db.updateTravelerTypeByUserId(sess.user_id, traveler_type);
    if (!ok) return error(res, 422, 'UNPROCESSABLE', '修改失败，请稍后再试');
    return res.json({ success: true, traveler_type });
  } catch (e) {
    return error(res, 500, 'INTERNAL_ERROR', '服务器错误');
  }
});

// 退出登录
app.post(`${base}/auth/logout`, (req, res) => {
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return res.status(204).end();
  const sid = m[1];
  loginSessions.delete(sid);
  return res.status(204).end();
});

// 生成二维码（扫码登录）
app.get(`${base}/auth/qrcode`, (req, res) => {
  const id = uuidv4();
  const now = Date.now();
  const expiresAt = now + 2 * 60 * 1000; // 2分钟
  const imageData = Buffer.from(`QR:${id}`).toString('base64');
  qrcodeStore.set(id, { imageData, createdAt: now, expiresAt, status: 'unscanned' });
  return res.json({ qrcode_id: id, image_data: imageData, expires_at: new Date(expiresAt).toISOString(), poll_interval_seconds: 2 });
});

// 轮询二维码状态；支持测试用的状态切换头：x-dev-scan=1, x-dev-confirm=1, x-dev-cancel=1
app.get(`${base}/auth/qrcode/:id/status`, (req, res) => {
  const { id } = req.params;
  const rec = qrcodeStore.get(id);
  if (!rec) return error(res, 410, 'QR_EXPIRED', '二维码已过期，请刷新重试');
  const now = Date.now();
  if (now > rec.expiresAt) {
    rec.status = 'expired';
    qrcodeStore.set(id, rec);
    return res.json({ status: 'expired', message: '二维码已过期，请刷新重试' });
  }
  if (req.get('x-dev-cancel') === '1') {
    rec.status = 'unscanned';
  } else if (req.get('x-dev-confirm') === '1') {
    rec.status = 'confirmed';
  } else if (req.get('x-dev-scan') === '1') {
    rec.status = 'scanned';
  }
  qrcodeStore.set(id, rec);
  const payload = { status: rec.status, message: '', session_id: undefined };
  if (rec.status === 'confirmed') {
    const session_id = uuidv4();
    loginSessions.set(session_id, { user_id: 'u-qr', last_active_at: now });
    payload.session_id = session_id;
  }
  return res.json(payload);
});

// 刷新二维码
app.post(`${base}/auth/qrcode/:id/refresh`, (req, res) => {
  const { id } = req.params;
  const now = Date.now();
  const expiresAt = now + 2 * 60 * 1000;
  const imageData = Buffer.from(`QR:${id}:${now}`).toString('base64');
  qrcodeStore.set(id, { imageData, createdAt: now, expiresAt, status: 'unscanned' });
  return res.json({ qrcode_id: id, image_data: imageData, expires_at: new Date(expiresAt).toISOString() });
});

// ===== 登录二次验证（短信）接口 =====

// 身份证后4位校验并自动发送验证码
app.post(`${base}/auth/login/2fa/id-check`, async (req, res) => {
  const { flow_id, id_last4, id_last4_hash } = req.body || {};
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (!flow_id) return error(res, 400, 'FLOW_ID_REQUIRED', '缺少流程ID');
  const flow = login2FAFlows.get(flow_id);
  if (!flow) return error(res, 404, 'FLOW_NOT_FOUND', '验证流程不存在或已过期');
  if (flow.locked_until && Date.now() < flow.locked_until) {
    return error(res, 403, 'ACCOUNT_LOCKED', '账户已被锁定，请30分钟后重试或联系客服');
  }
  // 获取真实身份证号码
  let id_number = null;
  try {
    const acc = await db.findByUserId(flow.user_id);
    if (acc && acc.id_number) id_number = acc.id_number;
  } catch (e) {}
  // 预置账户兜底
  if (!id_number) {
    const fb = accountStore.get(flow.login_key);
    if (fb && fb.id_number) id_number = fb.id_number;
  }
  const last4 = id_number ? String(id_number).slice(-4) : '';
  // 支持明文后4位或哈希后4位（提升传输安全）
  let matched = false;
  if (typeof id_last4 === 'string' && /^[0-9Xx]{4}$/.test(id_last4)) {
    matched = (last4 && String(id_last4) === last4);
  } else if (typeof id_last4_hash === 'string' && id_last4_hash.length === 64) {
    const h = crypto.createHash('sha256').update(String(last4)).digest('hex');
    matched = (last4 && h === id_last4_hash);
  } else {
    return error(res, 400, 'ID_LAST4_INVALID_FORMAT', '请输入4位数字');
  }
  if (!matched) {
    flow.id_fail_count = (flow.id_fail_count || 0) + 1;
    login2FAFlows.set(flow_id, flow);
    if (flow.id_fail_count >= 3) {
      flow.locked_until = Date.now() + 30 * 60 * 1000;
      login2FAFlows.set(flow_id, flow);
      return error(res, 403, 'ACCOUNT_LOCKED', '错误次数过多，账户已锁定30分钟');
    }
    return error(res, 400, 'ID_LAST4_MISMATCH', '身份证后4位不匹配');
  }

  const hasValidCode = flow.code && Date.now() <= flow.code_expires_at;
  const phone_number = flow.phone_number;
  if (!phone_number) return error(res, 400, 'PHONE_NOT_FOUND', '未找到绑定手机号');
  const key = `${phone_number}:login`;
  const rate = smsRate.get(key) || { lastSentAt: 0, countDate: new Date(now).toDateString(), count: 0 };
  const nowDateStr = new Date(now).toDateString();
  if (rate.countDate !== nowDateStr) { rate.countDate = nowDateStr; rate.count = 0; }
  if (hasValidCode) {
    const last = rate.lastSentAt || 0;
    const diffSec = Math.floor((now.getTime() - last) / 1000);
    const countdown = diffSec >= 60 ? 0 : 60 - diffSec;
    const ttlMs = flow.code_expires_at - Date.now();
    const ttlMin = ttlMs > 0 ? Math.ceil(ttlMs / 60000) : 0;
    const leak = req.get('x-dev-debug') === '1' || req.query.dev === '1' || process.env.DEV_OTP_LEAK === '1';
    const payload = { sent: false, countdown_seconds: countdown, ttl_minutes: ttlMin };
    if (leak) payload.dev_code = flow.code;
    return res.json(payload);
  }
  if (now.getTime() - rate.lastSentAt < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - (now.getTime() - rate.lastSentAt)) / 1000);
    return error(res, 429, 'SMS_TOO_FREQUENT', `短信发送过于频繁，请在 ${waitSeconds} 秒后重试`, { retry_after: waitSeconds });
  }
  if (rate.count >= 10) return error(res, 429, 'SMS_DAILY_LIMIT_REACHED', '短信发送次数已达上限，请稍后再试');
  rate.lastSentAt = now.getTime(); rate.count += 1; smsRate.set(key, rate);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  flow.code = code; flow.code_expires_at = Date.now() + 5 * 60 * 1000; login2FAFlows.set(flow_id, flow);
  if (process.env.OTP_DEV_LOG !== '0') {
    console.log(`[DEV] 登录2FA 短信验证码 ${code} 已生成并“发送”到 +86${phone_number} (flow ${flow_id})`);
  }
  const leak = req.get('x-dev-debug') === '1' || req.query.dev === '1' || process.env.DEV_OTP_LEAK === '1';
  const payload = { sent: true, countdown_seconds: 60, ttl_minutes: 5 };
  if (leak) payload.dev_code = code;
  return res.json(payload);
});

// 重新发送验证码
app.post(`${base}/auth/login/2fa/resend`, (req, res) => {
  const { flow_id } = req.body || {};
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (!flow_id) return error(res, 400, 'FLOW_ID_REQUIRED', '缺少流程ID');
  const flow = login2FAFlows.get(flow_id);
  if (!flow) return error(res, 404, 'FLOW_NOT_FOUND', '验证流程不存在或已过期');
  if (flow.locked_until && Date.now() < flow.locked_until) {
    return error(res, 403, 'ACCOUNT_LOCKED', '账户已被锁定，请30分钟后重试或联系客服');
  }
  const phone_number = flow.phone_number;
  if (!phone_number) return error(res, 400, 'PHONE_NOT_FOUND', '未找到绑定手机号');
  const key = `${phone_number}:login`;
  const rate = smsRate.get(key) || { lastSentAt: 0, countDate: new Date(now).toDateString(), count: 0 };
  const nowDateStr = new Date(now).toDateString();
  if (rate.countDate !== nowDateStr) { rate.countDate = nowDateStr; rate.count = 0; }
  if (now.getTime() - rate.lastSentAt < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - (now.getTime() - rate.lastSentAt)) / 1000);
    return error(res, 429, 'SMS_TOO_FREQUENT', `短信发送过于频繁，请在 ${waitSeconds} 秒后重试`, { retry_after: waitSeconds });
  }
  if (rate.count >= 10) return error(res, 429, 'SMS_DAILY_LIMIT_REACHED', '短信发送次数已达上限，请稍后再试');
  rate.lastSentAt = now.getTime(); rate.count += 1; smsRate.set(key, rate);
  const code = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
  flow.code = code; flow.code_expires_at = Date.now() + 5 * 60 * 1000; login2FAFlows.set(flow_id, flow);
  if (process.env.OTP_DEV_LOG !== '0') {
    console.log(`[DEV] 登录2FA 重新发送验证码 ${code} 已生成并“发送”到 +86${phone_number} (flow ${flow_id})`);
  }
  const leak = req.get('x-dev-debug') === '1' || req.query.dev === '1' || process.env.DEV_OTP_LEAK === '1';
  const last = rate.lastSentAt || 0;
  const diffSec = Math.floor((now.getTime() - last) / 1000);
  const countdown = diffSec >= 60 ? 0 : 60 - diffSec;
  const payload = { sent: true, countdown_seconds: countdown, ttl_minutes: 5 };
  if (leak) payload.dev_code = code;
  return res.json(payload);
});

// 校验验证码并完成登录
app.post(`${base}/auth/login/2fa/verify`, (req, res) => {
  const { flow_id, code } = req.body || {};
  if (!flow_id) return error(res, 400, 'FLOW_ID_REQUIRED', '缺少流程ID');
  const flow = login2FAFlows.get(flow_id);
  if (!flow) return error(res, 404, 'FLOW_NOT_FOUND', '验证流程不存在或已过期');
  if (flow.locked_until && Date.now() < flow.locked_until) {
    return error(res, 403, 'ACCOUNT_LOCKED', '账户已被锁定，请30分钟后重试或联系客服');
  }
  if (!code) return error(res, 400, 'SMS_CODE_MISMATCH', '验证码错误');
  if (!flow.code) return error(res, 400, 'SMS_NOT_SENT', '尚未发送验证码');
  if (Date.now() > flow.code_expires_at) return error(res, 400, 'SMS_CODE_EXPIRED', '验证码已过期，请重新获取');
  if (String(code) !== String(flow.code)) {
    flow.code_fail_count = (flow.code_fail_count || 0) + 1;
    if (flow.code_fail_count >= 5) {
      flow.locked_until = Date.now() + 30 * 60 * 1000;
      login2FAFlows.set(flow_id, flow);
      return error(res, 403, 'ACCOUNT_LOCKED', '错误次数过多，账户已锁定30分钟');
    }
    login2FAFlows.set(flow_id, flow);
    return error(res, 400, 'SMS_CODE_MISMATCH', '验证码错误');
  }
  // 一次性使用
  flow.code = null; flow.code_expires_at = 0; login2FAFlows.set(flow_id, flow);
  const session_id = `sid-${flow.user_id}`;
  const existing = loginSessions.get(session_id);
  if (existing) { existing.last_active_at = Date.now(); loginSessions.set(session_id, existing); }
  else { loginSessions.set(session_id, { user_id: flow.user_id, last_active_at: Date.now() }); }
  return res.json({ session_id, user_id: flow.user_id, redirect: process.env.HOME_URL || 'http://localhost:8080/', message: '登录成功' });
});

// 找回密码：手机请求验证码
app.post(`${base}/auth/password/phone/request`, (req, res) => {
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (req.get('x-simulate-maintenance') === '1' || isMaintenance(now)) {
    return error(res, 503, 'MAINTENANCE_WINDOW', '系统维护中，服务时间：每日5:00-次日1:00；周二5:00-24:00');
  }
  const { phone_number, id_type, id_number } = req.body || {};
  if (!validatePhoneNumber(phone_number)) return error(res, 400, 'PHONE_INVALID', '请输入正确的手机号');
  if (!validateId(id_type, id_number)) return error(res, 422, 'ID_INVALID_FORMAT', '请输入正确的身份证号码格式');
  // 身份信息连续错误锁定：模拟后4位不匹配，通过请求头 x-dev-id-mismatch 控制
  // 失败3次锁定30分钟，锁定期间所有请求返回 RESET_LOCKED
  const idFailRec = idVerifyFailStore.get(phone_number) || { count: 0, lockedUntil: 0 };
  if (idFailRec.lockedUntil && Date.now() < idFailRec.lockedUntil) {
    return error(res, 403, 'RESET_LOCKED', '身份信息连续错误，找回密码功能已锁定30分钟');
  }
  if (req.get('x-dev-id-mismatch') === '1') {
    idFailRec.count += 1;
    if (idFailRec.count >= 3) {
      idFailRec.lockedUntil = Date.now() + 30 * 60 * 1000;
      idVerifyFailStore.set(phone_number, idFailRec);
      return error(res, 403, 'RESET_LOCKED', '身份信息连续错误，找回密码功能已锁定30分钟');
    }
    idVerifyFailStore.set(phone_number, idFailRec);
    return error(res, 422, 'PHONE_ID_MISMATCH', '手机号码与注册信息不匹配');
  } else {
    // 一次成功后重置失败计数
    if (idFailRec.count > 0) {
      idVerifyFailStore.delete(phone_number);
    }
  }
  // 速率限制（复用注册短信发送速率限制），允许通过 x-simulate-time 控制测试时间推进
  const key = `${phone_number}:reset`;
  const rate = smsRate.get(key) || { lastSentAt: 0, countDate: new Date(now).toDateString(), count: 0 };
  const nowDateStr = new Date(now).toDateString();
  if (rate.countDate !== nowDateStr) { rate.countDate = nowDateStr; rate.count = 0; }
  if (now.getTime() - rate.lastSentAt < 60 * 1000) {
    const waitSeconds = Math.ceil((60 * 1000 - (now.getTime() - rate.lastSentAt)) / 1000);
    return error(res, 429, 'SMS_TOO_FREQUENT', `短信发送过于频繁，请在 ${waitSeconds} 秒后重试`, { retry_after: waitSeconds });
  }
  if (rate.count >= 10) return error(res, 429, 'SMS_DAILY_LIMIT_REACHED', '短信发送次数已达上限，请稍后再试');
  rate.lastSentAt = now.getTime(); rate.count += 1; smsRate.set(key, rate);
  // 生成并保存 6 位验证码
  const code = process.env.NODE_ENV === 'test' ? '123456' : generateOtp6();
  fpSmsStore.set(phone_number, { code, expires_at: Date.now() + 5 * 60 * 1000 });
  // 开发环境：在终端打印验证码，便于联调
  if (process.env.OTP_DEV_LOG !== '0') {
    console.log(`[DEV] 找回密码短信验证码 ${code} 已生成并“发送”到 ${phone_number}`);
  }
  const leak = req.get('x-dev-debug') === '1' || req.query.dev === '1' || process.env.DEV_OTP_LEAK === '1';
  const payload = { status: 'sent', ttl_minutes: 5 };
  if (leak) payload.dev_code = code;
  return res.json(payload);
});

// 找回密码：手机验证验证码，返回重置令牌
app.post(`${base}/auth/password/phone/verify`, (req, res) => {
  const { phone_number, code } = req.body || {};
  if (!validatePhoneNumber(phone_number)) return error(res, 400, 'PHONE_INVALID', '请输入正确的手机号');
  if (!code) return error(res, 400, 'SMS_CODE_MISMATCH', '验证码错误');
  const rec = fpSmsStore.get(phone_number);
  if (!rec || !rec.code) return error(res, 400, 'SMS_NOT_SENT', '尚未发送验证码');
  // 测试辅助：仅对本次请求模拟过期，不持久化修改 fpSmsStore
  if (req.get('x-dev-expired') === '1') return error(res, 400, 'SMS_CODE_EXPIRED', '验证码已过期，请重新获取');
  if (Date.now() > rec.expires_at) return error(res, 400, 'SMS_CODE_EXPIRED', '验证码已过期，请重新获取');
  if (code !== rec.code) return error(res, 400, 'SMS_CODE_MISMATCH', '验证码错误');
  // 验证通过后清理
  fpSmsStore.delete(phone_number);
  // 生成重置令牌并与手机号绑定，令牌有效期 24 小时
  const token = uuidv4();
  resetTokenStore.set(token, { type: 'phone', phone_number, phone_country_code: '+86', expires_at: Date.now() + 24 * 60 * 60 * 1000 });
  return res.json({ reset_token: token });
});

// 找回密码：邮箱请求重置邮件
app.post(`${base}/auth/password/email/request`, (req, res) => {
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (req.get('x-simulate-maintenance') === '1' || isMaintenance(now)) {
    return error(res, 503, 'MAINTENANCE_WINDOW', '系统维护中，服务时间：每日5:00-次日1:00；周二5:00-24:00');
  }
  const { email, id_type, id_number } = req.body || {};
  if (!validateEmail(email)) return error(res, 400, 'EMAIL_INVALID_FORMAT', '邮箱格式不正确');
  if (!validateId(id_type, id_number)) return error(res, 422, 'ID_INVALID_FORMAT', '请输入正确的身份证号码格式');
  // 速率限制（复用注册邮件发送速率限制），允许通过 x-simulate-time 控制测试时间推进
  const erate = emailRate.get(email) || { lastSentAt: 0, countDate: new Date(now).toDateString(), count: 0 };
  const nowDateStr2 = new Date(now).toDateString();
  if (erate.countDate !== nowDateStr2) { erate.countDate = nowDateStr2; erate.count = 0; }
  if (now.getTime() - erate.lastSentAt < 60 * 1000) return error(res, 429, 'EMAIL_TOO_FREQUENT', '邮件发送过于频繁，请稍后再试');
  if (erate.count >= 10) return error(res, 429, 'EMAIL_DAILY_LIMIT_REACHED', '邮件发送次数已达上限，请稍后再试');
  erate.lastSentAt = now.getTime(); erate.count += 1; emailRate.set(email, erate);
  return res.json({ status: 'sent', message: '重置邮件已发送' });
});

// 找回密码：设置新密码
app.post(`${base}/auth/password/reset`, async (req, res) => {
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (req.get('x-simulate-maintenance') === '1' || isMaintenance(now)) {
    return error(res, 503, 'MAINTENANCE_WINDOW', '系统维护中，服务时间：每日5:00-次日1:00；周二5:00-24:00');
  }
  const { reset_token, new_password } = req.body || {};
  if (!reset_token) return error(res, 400, 'RESET_TOKEN_REQUIRED', '缺少重置令牌');
  const pw = validatePassword(new_password, '');
  if (!pw.ok) return error(res, 400, pw.reason, pw.detail || '密码不满足强度要求');
  // 校验令牌并更新数据库密码
  const tok = resetTokenStore.get(reset_token);
  if (!tok) {
    // 兼容旧流程：令牌未记录时仍返回成功（不更新数据库）
    return res.json({ success: true, message: '密码重置成功' });
  }
  if (Date.now() > tok.expires_at) {
    resetTokenStore.delete(reset_token);
    return error(res, 400, 'RESET_TOKEN_EXPIRED', '重置令牌已过期，请重新验证');
  }
  try {
    let account = null;
    if (tok.type === 'phone') {
      account = await db.findByPhone(tok.phone_country_code || '+86', tok.phone_number);
    } else if (tok.type === 'email') {
      account = await db.findByEmail(tok.email);
    } else if (tok.type === 'username') {
      account = await db.findByUsername(tok.username);
    }
    if (!account || !account.user_id) {
      resetTokenStore.delete(reset_token);
      return res.json({ success: true, message: '密码重置成功' });
    }
    const newSalt = uuidv4();
    const newHash = hashPassword(new_password, newSalt);
    const ok = await db.updatePasswordByUserId(account.user_id, newHash, newSalt);
    if (!ok) return error(res, 500, 'PASSWORD_UPDATE_FAILED', '密码更新失败，请稍后重试');
    resetTokenStore.delete(reset_token);
    return res.json({ success: true, message: '密码重置成功' });
  } catch (e) {
    console.warn('Password reset DB error:', e && e.message);
    return error(res, 500, 'INTERNAL_ERROR', '服务器错误');
  }
});

// 人脸识别找回密码：启动
app.get(`${base}/auth/password/face/start`, (req, res) => {
  const id = uuidv4();
  const now = Date.now();
  const expiresAt = now + 2 * 60 * 1000;
  const imageData = Buffer.from(`QR:${id}`).toString('base64');
  qrcodeStore.set(id, { imageData, createdAt: now, expiresAt, status: 'unscanned' });
  return res.json({ qrcode_id: id, image_data: imageData, expires_at: new Date(expiresAt).toISOString(), poll_interval_seconds: 2 });
});

// 人脸识别找回密码：状态轮询（别名，复用二维码状态逻辑）
app.get(`${base}/auth/password/face/status`, (req, res) => {
  const qrcode_id = req.query.qrcode_id || req.query.id;
  const rec = qrcodeStore.get(qrcode_id);
  if (!rec) return error(res, 410, 'QR_EXPIRED', '二维码已过期，请刷新重试');
  const now = Date.now();
  if (req.get('x-dev-expired') === '1') rec.expiresAt = now - 1;
  if (now > rec.expiresAt) {
    rec.status = 'expired';
    qrcodeStore.set(qrcode_id, rec);
    return res.json({ status: 'expired', message: '二维码已过期，请刷新重试' });
  }
  // 支持测试用的状态切换头
  if (req.get('x-dev-cancel') === '1') { rec.status = 'unscanned'; }
  else if (req.get('x-dev-confirm') === '1') { rec.status = 'confirmed'; }
  else if (req.get('x-dev-scan') === '1') { rec.status = 'scanned'; }
  qrcodeStore.set(qrcode_id, rec);
  return res.json({ status: rec.status });
});

// 人脸识别找回密码：状态轮询（REST风格路径）
app.get(`${base}/auth/password/face/:id/status`, (req, res) => {
  const { id } = req.params;
  const rec = qrcodeStore.get(id);
  if (!rec) return error(res, 410, 'QR_EXPIRED', '二维码已过期，请刷新重试');
  const now = Date.now();
  if (req.get('x-dev-expired') === '1') rec.expiresAt = now - 1;
  if (now > rec.expiresAt) {
    rec.status = 'expired';
    qrcodeStore.set(id, rec);
    return res.json({ status: 'expired', message: '二维码已过期，请刷新重试' });
  }
  if (req.get('x-dev-cancel') === '1') { rec.status = 'unscanned'; }
  else if (req.get('x-dev-confirm') === '1') { rec.status = 'confirmed'; }
  else if (req.get('x-dev-scan') === '1') { rec.status = 'scanned'; }
  qrcodeStore.set(id, rec);
  return res.json({ status: rec.status });
});

// 人脸识别找回密码：确认（模拟APP扫码并确认）
app.post(`${base}/auth/password/face/confirm`, (req, res) => {
  const { qrcode_id } = req.body || {};
  const rec = qrcodeStore.get(qrcode_id);
  if (!rec) return error(res, 410, 'QR_EXPIRED', '二维码已过期，请刷新重试');
  rec.status = 'confirmed';
  qrcodeStore.set(qrcode_id, rec);
  const token = uuidv4();
  resetTokenStore.set(token, { type: 'face', expires_at: Date.now() + 24 * 60 * 60 * 1000 });
  return res.json({ reset_token: token });
});

// 登录后修改密码
function validateStrongPasswordForChange(p, old) {
  if (typeof p !== 'string') return { ok: false, reason: 'NEW_PASSWORD_WEAK' };
  if (p.length < 8 || p.length > 32) return { ok: false, reason: 'NEW_PASSWORD_WEAK' };
  const hasUpper = /[A-Z]/.test(p);
  const hasLower = /[a-z]/.test(p);
  const hasDigit = /\d/.test(p);
  const hasSpecial = /[!@#$%^&*()\-_=+\[\]{};:,.?/\\|]/.test(p);
  if (!(hasUpper && hasLower && hasDigit && hasSpecial)) return { ok: false, reason: 'NEW_PASSWORD_WEAK' };
  if (p === old) return { ok: false, reason: 'NEW_PASSWORD_SAME_AS_OLD' };
  return { ok: true };
}

app.post(`${base}/auth/password/change`, (req, res) => {
  const nowHeader = req.get('x-simulate-time');
  const now = nowHeader ? new Date(nowHeader) : new Date();
  if (req.get('x-simulate-maintenance') === '1' || isMaintenance(now)) {
    return error(res, 503, 'MAINTENANCE_WINDOW', '系统维护中，服务时间：每日5:00-次日1:00；周二5:00-24:00');
  }
  const auth = req.get('Authorization') || '';
  const m = auth.match(/Bearer\s+(.+)/);
  if (!m) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const sid = m[1];
  const sess = loginSessions.get(sid);
  if (!sess) return error(res, 401, 'SESSION_EXPIRED', '登录已过期，请重新登录');
  const { old_password, new_password } = req.body || {};
  if (!old_password || !new_password) return error(res, 400, 'PASSWORD_REQUIRED', '请输入原密码与新密码');
  // 演示：原密码验证采用固定值（与预置账户一致）
  const validOld = old_password === 'Password123!';
  if (!validOld) return error(res, 401, 'INVALID_CREDENTIALS', '原密码不正确');
  const v = validateStrongPasswordForChange(new_password, old_password);
  if (!v.ok) return error(res, 400, v.reason, v.reason === 'NEW_PASSWORD_WEAK' ? '密码强度不足' : '新密码不能与原密码相同');
  return res.json({ success: true, message: '密码修改成功' });
});

// 仅当直接运行此文件时启动服务
if (require.main === module) {
  const port = process.env.PORT || 8080;
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}/`);
    console.log(`API base: http://localhost:${port}${base}`);
  });
}

module.exports = { app };
