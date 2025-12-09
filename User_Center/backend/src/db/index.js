const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'data.json');

const defaultState = {
  user: {
    user_id: 'u-super',
    username: 'superadmin',
    name: '系统管理员',
    country_region: '中国',
    id_type: '居民身份证',
    id_number: '110101199001011234',
    id_verified_status: 'success',
    phone_country_code: '+86',
    phone_number: '13900000000',
    phone_verified_status: 'success',
    email: 'superadmin@example.com',
    email_verified_status: 'success',
    traveler_type: '成人',
    created_at: new Date('2024-01-01T00:00:00Z'),
    updated_at: new Date('2024-01-01T00:00:00Z'),
  },
  availability: {
    '+86|13900000000': true,
  },
  passengers: [
    {
      passenger_id: '1',
      user_id: 'u-super',
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
          // Migration: Assign default user_id if missing
          if (!p.user_id) p.user_id = 'u-super';
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

const { encrypt, decrypt } = require('../utils/security');

function syncSelfPassengers() {
  try {
    const accountsDbPath = path.resolve(__dirname, '../../../../Login_Register_Page/backend/data/accounts.db');
    if (fs.existsSync(accountsDbPath)) {
      const raw = fs.readFileSync(accountsDbPath, 'utf8');
      const lines = raw.split('\n').filter(line => line.trim());
      
      let added = false;
      lines.forEach(line => {
        try {
          const user = JSON.parse(line);
          if (user.user_id) {
            const existing = state.passengers.find(p => p.user_id === user.user_id && p.is_self);
            if (!existing) {
              // Add self passenger
              const encryptedId = encrypt(user.id_number || '110101199001011234'); // Use provided or default
              const newSelf = {
                passenger_id: 'self-' + user.user_id,
                user_id: user.user_id,
                name: user.name || user.username,
                id_type: user.id_type || '居民身份证',
                id_number: encryptedId,
                phone_country_code: user.phone_country_code || '+86',
                phone_number: user.phone_number || '13800000000',
                traveler_type: user.traveler_type || '成人',
                verified_status: '已通过',
                is_self: true,
                protected_flag: 1,
                created_at: new Date()
              };
              state.passengers.push(newSelf);
              added = true;
              console.log(`Synced self passenger for user: ${user.username} (${user.user_id})`);
            }
          }
        } catch (err) {
          console.error('Failed to parse user line:', err);
        }
      });
      
      if (added) {
        saveData();
        console.log('Self passenger sync completed.');
      }
    } else {
      console.log('Accounts DB not found, skipping sync.');
    }
  } catch (e) {
    console.error('Failed to sync self passengers:', e);
  }
}

function findUserInAccounts(userId) {
  try {
    const accountsDbPath = path.resolve(__dirname, '../../../../Login_Register_Page/backend/data/accounts.db');
    if (fs.existsSync(accountsDbPath)) {
      const raw = fs.readFileSync(accountsDbPath, 'utf8');
      const lines = raw.split('\n').filter(line => line.trim());
      for (const line of lines) {
        try {
           const u = JSON.parse(line);
           if (u.user_id === userId) return u;
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error('Error reading accounts db:', e);
  }
  return null;
}

// Load data on startup
loadData();
syncSelfPassengers();

function maskPII(input) {
  const result = {};
  if (input.id_number) {
    const id = decrypt(String(input.id_number));
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
  // Decrypt ID for masking logic (though maskPII handles decryption too)
  const plainId = decrypt(u.id_number); 
  const masked = maskPII({ id_number: plainId, phone_country_code: u.phone_country_code, phone_number: u.phone_number, email: u.email });
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

async function updateTravelerType(type) {
  state.user.traveler_type = type;
  state.user.updated_at = new Date();
  saveData();
  return { ok: true, traveler_type: type };
}

async function verifyPassword(password) {
  // Mock check
  return true;
}

async function checkPhoneAvailability(code, number) {
  // Mock check
  return true;
}

async function updatePhoneNumber(code, number) {
  state.user.phone_country_code = code;
  state.user.phone_number = number;
  state.user.updated_at = new Date();
  saveData();
  const masked = maskPII({ phone_country_code: code, phone_number: number });
  return { ok: true, masked: masked.phone_number_masked };
}

async function getCountryCallingCodes() {
  return { codes: ['+86', '+852', '+853', '+886'] };
}

async function getPassengers(userId, nameKeyword = '', showFull = false) {
  // Ensure 'self' passenger exists for this user
  const existingSelf = state.passengers.find(p => p.user_id === userId && p.is_self);
  
  if (!existingSelf) {
    // Try to find user profile to create self passenger
    let userProfile = null;
    
    if (userId === state.user.user_id) {
       userProfile = state.user;
    } else {
       // Look in external DB
       userProfile = findUserInAccounts(userId);
    }
    
    if (userProfile) {
      const encryptedId = encrypt(userProfile.id_number || '110101199001011234');
      const newSelf = {
        passenger_id: 'self-' + userProfile.user_id,
        user_id: userProfile.user_id,
        name: userProfile.name || userProfile.username,
        id_type: userProfile.id_type || '居民身份证',
        id_number: encryptedId,
        phone_country_code: userProfile.phone_country_code || '+86',
        phone_number: userProfile.phone_number || '13800000000',
        traveler_type: userProfile.traveler_type || '成人',
        verified_status: '已通过',
        is_self: true,
        protected_flag: 1,
        created_at: new Date()
      };
      state.passengers.push(newSelf);
      saveData();
    }
  }

  let list = state.passengers;
  if (userId) {
    list = list.filter(p => p.user_id === userId);
  } else {
    return [];
  }

  if (nameKeyword) {
    list = list.filter(p => p.name.includes(nameKeyword));
  }
  return list.map(p => {
    const plainId = decrypt(p.id_number);
    if (showFull) {
      return {
        ...p,
        id_number: plainId // Return decrypted if full requested (careful!)
      };
    }
    const masked = maskPII({
      id_number: plainId,
      phone_country_code: p.phone_country_code,
      phone_number: p.phone_number
    });
    return {
      ...p,
      id_number: masked.id_number_masked, 
      phone_number: masked.phone_number_masked
    };
  });
}

async function getPassengerById(passengerId, userId) {
  const p = state.passengers.find(p => p.passenger_id === passengerId);
  if (!p) return null;
  if (userId && p.user_id !== userId) return null;
  
  const plainId = decrypt(p.id_number);
  const masked = maskPII({
      id_number: plainId,
      phone_country_code: p.phone_country_code,
      phone_number: p.phone_number
  });
  return {
      ...p,
      id_number: masked.id_number_masked, // Always mask unless specialized API
      // Note: For Edit mode, we usually need the real one or mask with special format
      // The prompt requires encrypted storage, so we store encrypted.
      // But front-end might need real ID to validate? No, edit usually masks it.
      // Let's keep it masked for now. If frontend needs raw, we might need another flag.
      phone_number: masked.phone_number_masked
  };
}

async function addPassenger(userId, data) {
  const userPassengers = state.passengers.filter(p => p.user_id === userId);
  if (userPassengers.length >= 15) {
    return { ok: false, error: 'LIMIT_REACHED' };
  }
  
  // Check for duplicate ID number for this user
  // Note: We need to compare against decrypted ID or encrypt the input and compare?
  // Since encryption uses random IV, same input produces different output. 
  // So we must decrypt existing records to check.
  // Optimization: In a real DB we might store a hash of the ID for search/uniqueness. 
   // Here we iterate.
   const isDuplicate = userPassengers.some(p => {
       const plain = decrypt(p.id_number);
       // console.log(`Check Dup: ${plain} vs ${data.id_number}`);
       return plain === data.id_number;
   });
  
  if (isDuplicate) {
      return { ok: false, error: 'DUPLICATE_PASSENGER' };
  }

  // Encrypt ID
  const encryptedId = encrypt(data.id_number);
  
  const newPassenger = {
    passenger_id: Date.now().toString(),
    user_id: userId,
    ...data,
    id_number: encryptedId, // Store encrypted
    verified_status: '已通过',
    is_self: false,
    created_at: new Date()
  };
  state.passengers.push(newPassenger);
  saveData();
  
  // Return response with masked data to prevent leakage
  const masked = maskPII({
    id_number: data.id_number,
    phone_country_code: data.phone_country_code,
    phone_number: data.phone_number
  });

  return { 
    ok: true, 
    passenger: {
      ...newPassenger,
      id_number: masked.id_number_masked,
      phone_number: masked.phone_number_masked
    }
  };
}

async function updatePassenger(passengerId, userId, updates) {
  const index = state.passengers.findIndex(p => p.passenger_id === passengerId);
  if (index === -1) return { ok: false, error: 'NOT_FOUND' };
  
  const p = state.passengers[index];
  if (userId && p.user_id !== userId) return { ok: false, error: 'NOT_FOUND' }; // Hide existence

  // Apply updates
  if (p.is_self) {
    // For self, restrict critical fields (name, id_type, id_number)
    // Only allow contact info and traveler type updates
    if (updates.name || updates.id_type || updates.id_number) {
       // We can either throw error or silently ignore. 
       // The prompt says "Key identity info need real-name verification flow to modify".
       // Since we don't have that flow here, we reject these changes.
       return { ok: false, error: 'CANNOT_UPDATE_SELF_IDENTITY' };
    }
  } else {
     // For others, if name/id changes, we might need re-encryption or checks.
     // But currently addPassenger sets them. updatePassenger logic below only handles phone/type.
     // Wait, existing code only updates phone/type anyway:
     // if (updates.phone_number !== undefined) p.phone_number = updates.phone_number;
     // ...
     // If the user sends name/id_number in updates, they are currently ignored by the code below!
     // So we just need to ensure we don't add them to the list of updated fields if we expand this later.
     // But wait, if I want to support "edit passenger" fully, I should allow name/id update for normal passengers.
     // Let's see if the prompt requires fully editable passengers.
     // "该记录只能修改部分非关键信息... 关键身份信息需通过实名认证流程才能修改" refers to the self record.
     // Normal passengers usually can't have ID modified after creation in 12306 (you delete and re-add), 
     // but let's stick to current implementation which only supports phone/type updates.
     // So actually, the current implementation ALREADY prevents name/id update because it doesn't pick them up!
     // I will add explicit check to return error for clarity if someone tries.
  }

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

async function deletePassenger(passengerId, userId) {
  const index = state.passengers.findIndex(p => p.passenger_id === passengerId);
  if (index === -1) return { ok: false, error: 'NOT_FOUND' };
  
  const p = state.passengers[index];
  if (userId && p.user_id !== userId) return { ok: false, error: 'NOT_FOUND' };

  if (p.is_self || p.protected_flag === 1) return { ok: false, error: 'CANNOT_DELETE_SELF' };
  
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
