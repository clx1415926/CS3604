const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultState = {
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
  passengers: [
    {
      passenger_id: '1',
      name: '张三',
      id_type: '居民身份证',
      id_number: '430112199912345014',
      phone_country_code: '+86',
      phone_number: '13800000000',
      traveler_type: '成人',
      verified_status: '已通过',
      is_self: true,
      created_at: new Date('2024-01-01T00:00:00Z'),
    }
  ]
};

let state = { ...defaultState };

function loadData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);
      // Restore Date objects
      if (data.user) {
        if (data.user.created_at) data.user.created_at = new Date(data.user.created_at);
        if (data.user.updated_at) data.user.updated_at = new Date(data.user.updated_at);
      }
      if (Array.isArray(data.passengers)) {
        data.passengers.forEach(p => {
          if (p.created_at) p.created_at = new Date(p.created_at);
        });
      }
      state = data;
      console.log('Data loaded from disk.');
    } else {
      saveData(); // Initialize file
    }
  } catch (e) {
    console.error('Failed to load data:', e);
  }
}

function saveData() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

// Load data on startup
loadData();

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
  saveData();
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
  saveData();
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

async function getPassengers(nameKeyword = '', showFull = false) {
  let list = state.passengers;
  if (nameKeyword) {
    list = list.filter(p => p.name.includes(nameKeyword));
  }
  return list.map(p => {
    if (showFull) return p;
    const masked = maskPII({
      id_number: p.id_number,
      phone_country_code: p.phone_country_code,
      phone_number: p.phone_number
    });
    return {
      ...p,
      id_number: masked.id_number_masked || p.id_number, 
      phone_number: masked.phone_number_masked || p.phone_number
    };
  });
}

async function getPassengerById(passengerId) {
  const p = state.passengers.find(p => p.passenger_id === passengerId);
  if (!p) return null;
  
  const masked = maskPII({
      id_number: p.id_number,
      phone_country_code: p.phone_country_code,
      phone_number: p.phone_number
  });
  return {
      ...p,
      id_number: masked.id_number_masked || p.id_number, 
      phone_number: masked.phone_number_masked || p.phone_number
  };
}

async function addPassenger(data) {
  if (state.passengers.length >= 15) {
    return { ok: false, error: 'LIMIT_REACHED' };
  }
  
  const newPassenger = {
    passenger_id: Date.now().toString(),
    ...data,
    verified_status: '已通过',
    is_self: false,
    created_at: new Date()
  };
  state.passengers.push(newPassenger);
  saveData();
  return { ok: true, passenger: newPassenger };
}

async function updatePassenger(passengerId, updates) {
  const index = state.passengers.findIndex(p => p.passenger_id === passengerId);
  if (index === -1) return { ok: false, error: 'NOT_FOUND' };
  
  const p = state.passengers[index];
  
  // Apply updates
  if (updates.phone_number !== undefined) p.phone_number = updates.phone_number;
  if (updates.phone_country_code !== undefined) p.phone_country_code = updates.phone_country_code;
  if (updates.traveler_type !== undefined) p.traveler_type = updates.traveler_type;
  
  p.updated_at = new Date();
  
  saveData();

  const masked = maskPII({
      id_number: p.id_number,
      phone_country_code: p.phone_country_code,
      phone_number: p.phone_number
  });
  
  return { 
    ok: true, 
    passenger: {
      ...p,
      id_number: masked.id_number_masked || p.id_number,
      phone_number: masked.phone_number_masked || p.phone_number
    }
  };
}

async function deletePassenger(passengerId) {
  const index = state.passengers.findIndex(p => p.passenger_id === passengerId);
  if (index === -1) return { ok: false, error: 'NOT_FOUND' };
  if (state.passengers[index].is_self) return { ok: false, error: 'CANNOT_DELETE_SELF' };
  
  state.passengers.splice(index, 1);
  saveData();
  return { ok: true };
}

module.exports = {
  getUserProfile,
  updateTravelerType,
  verifyPassword,
  checkPhoneAvailability,
  updatePhoneNumber,
  getCountryCallingCodes,
  maskPII,
  getPassengers,
  getPassengerById,
  addPassenger,
  updatePassenger,
  deletePassenger,
};
