const state = {
  user: {
    user_id: '11111111-1111-1111-1111-111111111111',
    username: 'test_user',
    name: '张三',
    country_region: '中国',
    id_type: '居民身份证',
    id_number: '430112199912345014',
    id_verified_status: 'success',
    phone_country_code: '+86',
    phone_number: '13800000000',
    phone_verified_status: 'success',
    email: '24abcdef78@qq.com',
    email_verified_status: 'success',
    traveler_type: '成人',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  availability: {
    '+86|13900139000': true,
  },
};

function maskPII(input) {
  const result = {};
  if (input.id_number) {
    const id = String(input.id_number);
    const first = id.slice(0, 4);
    const last = id.slice(-3);
    const masked = `${first}${'*'.repeat(Math.max(0, id.length - 7))}${last}`;
    result.id_number_masked = masked;
  }
  if (input.phone_country_code && input.phone_number) {
    const phone = String(input.phone_number);
    const first3 = phone.slice(0, 3);
    const last4 = phone.slice(-4);
    result.phone_number_masked = `(${input.phone_country_code}) ${first3}****${last4}`;
  }
  if (input.email) {
    const [local, domain] = String(input.email).split('@');
    const first2 = local.slice(0, 2);
    const last2 = local.slice(-2);
    const middleLen = Math.max(0, local.length - 4);
    result.email_masked = `${first2}${'*'.repeat(middleLen)}${last2}@${domain}`;
  }
  return result;
}

async function getUserProfile() {
  const u = state.user;
  const masked = maskPII({ id_number: u.id_number, phone_country_code: u.phone_country_code, phone_number: u.phone_number, email: u.email });
  return {
    user_id: u.user_id,
    username: u.username,
    name: u.name,
    country_region: u.country_region,
    id_type: u.id_type,
    id_number_masked: masked.id_number_masked,
    id_verified_status: u.id_verified_status,
    phone_country_code: u.phone_country_code,
    phone_number_masked: masked.phone_number_masked,
    phone_verified_status: u.phone_verified_status,
    email_masked: masked.email_masked,
    email_verified_status: u.email_verified_status,
    traveler_type: u.traveler_type,
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}

async function updateTravelerType(newType) {
  const allowed = ['成人', '儿童', '学生', '残疾军人'];
  if (!allowed.includes(newType)) {
    return { ok: false };
  }
  state.user.traveler_type = newType;
  state.user.updated_at = new Date();
  return { ok: true, traveler_type: newType };
}

async function verifyPassword(password) {
  return password === 'CorrectPass1!' || password === 'Password123!';
}

async function checkPhoneAvailability(code, number) {
  const key = `${code}|${number}`;
  if (!(key in state.availability)) {
    return true;
  }
  const taken = state.availability[key];
  state.availability[key] = false;
  return !taken;
}

async function updatePhoneNumber(code, number) {
  const oldCode = state.user.phone_country_code;
  const oldNum = state.user.phone_number;
  if (oldCode === code && oldNum === number) {
    return { ok: false, sameAsOld: true };
  }
  state.user.phone_country_code = code;
  state.user.phone_number = number;
  state.user.phone_verified_status = 'pending';
  state.user.updated_at = new Date();
  const masked = maskPII({ phone_country_code: code, phone_number: number });
  return { ok: true, masked: masked.phone_number_masked };
}

async function getCountryCallingCodes() {
  return {
    codes: [
      { code: '+86', name: '中国', locale: 'zh-CN' },
      { code: '+1', name: '美国', locale: 'en-US' },
      { code: '+44', name: '英国', locale: 'en-GB' },
    ],
  };
}

module.exports = {
  getUserProfile,
  updateTravelerType,
  verifyPassword,
  checkPhoneAvailability,
  updatePhoneNumber,
  getCountryCallingCodes,
  maskPII,
};
