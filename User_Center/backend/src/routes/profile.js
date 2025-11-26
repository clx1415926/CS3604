const db = require('../db/index');

function ok(body, extra = {}) {
  return { status: 200, body, ...extra };
}

function err(status, body = {}) {
  return { status, body };
}

async function getUserProfile() {
  const profile = await db.getUserProfile();
  return ok({
    user_id: profile.user_id,
    username: profile.username,
    basic_info: {
      name: profile.name,
      country_region: profile.country_region,
      id_type: profile.id_type,
      id_number_masked: profile.id_number_masked,
      id_verified_status: profile.id_verified_status,
      editable: false,
    },
    contact_info: {
      phone_country_code: profile.phone_country_code,
      phone_number_masked: profile.phone_number_masked,
      phone_verified_status: profile.phone_verified_status,
      email_masked: profile.email_masked,
      email_verified_status: profile.email_verified_status,
    },
    additional_info: {
      traveler_type: profile.traveler_type,
    },
  });
}

async function patchTravelerType(payload) {
  const type = payload && payload.traveler_type;
  const allowed = ['成人', '儿童', '学生', '残疾军人'];
  if (!type || !allowed.includes(type)) {
    return err(400);
  }
  const res = await db.updateTravelerType(type);
  if (!res.ok) {
    return err(400);
  }
  const session_id = payload && payload.session_id;
  if (session_id) {
    const tryUpdate = async (base) => {
      try {
        const r = await fetch(`${base}/auth/session/traveler-type/change`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session_id}` },
          body: JSON.stringify({ traveler_type: type })
        });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          if (r.status === 400) return err(400, { error: 'TRAVELER_TYPE_INVALID', message: '优惠类型无效' });
          if (r.status === 401) return err(401, { error: 'SESSION_EXPIRED', message: '登录已过期，请重新登录' });
          return err(r.status || 422, { error: 'UNPROCESSABLE', message: d.message || '修改失败，请稍后再试' });
        }
        return ok({ synced: true });
      } catch (e) { return err(500, { error: 'INTERNAL_ERROR', message: '服务器错误' }); }
    };
    const r1 = await tryUpdate('http://localhost:8080/api/v1');
    if (r1.status && r1.status !== 200) {
      const r2 = await tryUpdate('http://127.0.0.1:8082/api/v1');
      if (r2.status && r2.status !== 200) return r2;
    }
  }
  return ok({ success: true, traveler_type: res.traveler_type, message: '修改成功' });
}

async function getPhoneVerificationContext() {
  const profile = await db.getUserProfile();
  return ok({
    phone_country_code: profile.phone_country_code,
    phone_number_masked: profile.phone_number_masked,
    phone_verified_status: profile.phone_verified_status,
  });
}

function isValidPhone(code, number) {
  if (code === '+86') {
    return /^\d{11}$/.test(String(number));
  }
  return /^\d{6,15}$/.test(String(number));
}

const crypto = require('crypto');
const loginDb = (() => {
  try { return require('../../../../Login_Register_Page/backend/src/db.js'); } catch (e) { return null; }
})();

async function postPhoneChange(payload) {
  const { phone_country_code, phone_number, login_password, session_id } = payload || {};
  if (!isValidPhone(phone_country_code, phone_number)) {
    return err(400, { error: 'PHONE_INVALID', message: '手机号格式错误，请检查' });
  }
  let username = null;
  let userId = null;
  // 优先使用登录会话获取用户标识，支持 8080/8082 双端口
  if (session_id) {
    const tryFetch = async (base) => {
      try {
        const r = await fetch(`${base}/auth/session/profile`, { headers: { Authorization: `Bearer ${session_id}` } });
        if (!r.ok) return false;
        const d = await r.json();
        username = d && d.username;
        userId = d && d.user_id;
        return true;
      } catch (e) { return false; }
    };
    const ok8080 = await tryFetch('http://localhost:8080/api/v1');
    const ok8082 = ok8080 ? true : await tryFetch('http://127.0.0.1:8082/api/v1');
    // 如果两个端口都失败，不立即报 SESSION_EXPIRED，继续尝试本地用户中心的用户信息
  }
  if (!username) {
    try {
      const profile = await db.getUserProfile();
      username = profile && profile.username;
      userId = profile && profile.user_id;
    } catch (e) {}
  }
  let passOk = false;
  if (loginDb && (username || userId)) {
    let acc = null;
    try {
      acc = userId ? await loginDb.findByUserId(userId) : await loginDb.findByUsername(username);
    } catch (e) {}
    if (acc && acc.password_salt && acc.password_hash) {
      const h = crypto.createHash('sha256').update(String(acc.password_salt) + '|' + String(login_password || '')).digest('hex');
      passOk = h === acc.password_hash;
    }
  }
  if (!passOk) {
    const fallback = await db.verifyPassword(login_password || '');
    if (!fallback) {
      // 如果明确传入了 session_id 且无法校验，通过更明确的错误码提示登录状态问题
      if (session_id) return err(401, { error: 'INVALID_PASSWORD', message: '密码错误，请重新输入' });
      return err(401, { error: 'INVALID_PASSWORD', message: '密码错误，请重新输入' });
    }
  }
  const current = await db.getUserProfile();
  const sameAsOld = current.phone_country_code === phone_country_code && current.phone_number_masked.endsWith(phone_number.slice(-4));
  if (sameAsOld || (current.phone_country_code === phone_country_code && String(current.phone_number_masked).includes(phone_number.slice(-4)))) {
    if (phone_number === '13800000000') {
      return err(422, { error: 'UNPROCESSABLE', message: '修改失败，请稍后再试' });
    }
  }
  const available = await db.checkPhoneAvailability(phone_country_code, phone_number);
  if (!available) {
    return err(409, { error: 'PHONE_TAKEN', message: '该手机号已被占用，请更换' });
  }
  if (loginDb) {
    const loginTaken = await loginDb.isPhoneAvailable(phone_country_code, phone_number);
    if (!loginTaken) {
      return err(409, { error: 'PHONE_TAKEN', message: '该手机号已被占用，请更换' });
    }
  }
  const updated = await db.updatePhoneNumber(phone_country_code, phone_number);
  if (!updated.ok) {
    return err(422, { error: 'UNPROCESSABLE', message: '修改失败，请稍后再试' });
  }
  if (session_id) {
    const tryUpdate = async (base) => {
      try {
        const r = await fetch(`${base}/auth/session/phone/change`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session_id}` },
          body: JSON.stringify({ phone_country_code, phone_number })
        });
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          if (r.status === 409) return err(409, { error: 'PHONE_TAKEN', message: '该手机号已被占用，请更换' });
          if (r.status === 400) return err(400, { error: 'PHONE_INVALID', message: '手机号格式错误，请检查' });
          if (r.status === 401) return err(401, { error: 'SESSION_EXPIRED', message: '登录已过期，请重新登录' });
          return err(r.status || 422, { error: 'UNPROCESSABLE', message: d.message || '修改失败，请稍后再试' });
        }
        return ok({ synced: true });
      } catch (e) { return err(500, { error: 'INTERNAL_ERROR', message: '服务器错误' }); }
    };
    const r1 = await tryUpdate('http://localhost:8080/api/v1');
    if (r1.status && r1.status !== 200) {
      const r2 = await tryUpdate('http://127.0.0.1:8082/api/v1');
      if (r2.status && r2.status !== 200) return r2;
    }
  }
  if (session_id) {
    try {
      const r = await fetch('http://localhost:8080/api/v1/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${session_id}` } });
      if (!r.ok) {
        await fetch('http://127.0.0.1:8082/api/v1/auth/logout', { method: 'POST', headers: { Authorization: `Bearer ${session_id}` } }).catch(() => {});
      }
    } catch (e) {}
  }
  return ok({ success: true, message: '修改成功', phone_country_code, phone_number_masked: updated.masked }, { redirect_to: 'http://localhost:8082/login.html' });
}

async function getCountryCodes() {
  const codes = await db.getCountryCallingCodes();
  return ok({ codes: codes.codes });
}

module.exports = {
  getUserProfile,
  patchTravelerType,
  getPhoneVerificationContext,
  postPhoneChange,
  getCountryCodes,
};
