const db = require('../db/index');

function ok(body, extra = {}) {
  return { status: 200, body, ...extra };
}

function err(status, body = {}) {
  return { status, body };
}

async function getUserProfile(userId) {
  const profile = userId ? await db.getUserProfileByUserId(userId) : await db.getUserProfile();
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
  const userId = payload && payload.user_id;
  const res = userId ? await db.updateTravelerType(userId, type) : await db.updateTravelerType(type);
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

async function getPhoneVerificationContext(userId) {
  const profile = userId ? await db.getUserProfileByUserId(userId) : await db.getUserProfile();
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

  const passOk = await db.verifyPassword(login_password || '');
  if (!passOk) return err(401, { error: 'INVALID_PASSWORD', message: '密码错误，请重新输入' });

  const available = await db.checkPhoneAvailability(phone_country_code, phone_number);
  if (!available) {
    return err(409, { error: 'PHONE_TAKEN', message: '该手机号已被占用，请更换' });
  }
  const userId = payload && payload.user_id;
  const updated = userId ? await db.updatePhoneNumber(userId, phone_country_code, phone_number) : await db.updatePhoneNumber(phone_country_code, phone_number);
  if (!updated.ok) {
    if (updated.error === 'SAME_AS_OLD') return err(422, { error: 'UNPROCESSABLE', message: '修改失败，请稍后再试' });
    return err(422, { error: 'UNPROCESSABLE', message: '修改失败，请稍后再试' });
  }
  return ok(
    { success: true, message: '修改成功', phone_country_code, phone_number_masked: updated.masked },
    { redirect_to: '/otn/view/information.html' }
  );
}

async function getCountryCodes() {
  const res = await db.getCountryCallingCodes();
  const codes = res && Array.isArray(res.codes) ? res.codes : [];
  return ok({ codes });
}

async function getOrders(userId, authToken, query) {
  const targetUserId = userId || (query && query.user_id) || null;
  if (!targetUserId) {
    return err(401, { error: 'LOGIN_REQUIRED', message: '请先登录' });
  }

  if (authToken) {
    try {
      const r = await fetch('http://localhost:3001/api/v1/orders', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (r.ok) {
        const data = await r.json().catch(() => ({}));
        const list = Array.isArray(data.orders) ? data.orders : [];
        await db.setOrdersForUser(targetUserId, list);
        return ok({ orders: list, source: 'remote' });
      }
    } catch (e) {}
  }

  const cached = await db.getOrdersForUser(targetUserId);
  return ok({ orders: cached, source: 'cache' });
}

module.exports = {
  getUserProfile,
  patchTravelerType,
  getPhoneVerificationContext,
  postPhoneChange,
  getCountryCodes,
  getOrders,
};
