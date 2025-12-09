const fs = require('fs');
const path = require('path');
const { encrypt } = require('../src/utils/security');

const ACCOUNTS_DB = path.resolve(__dirname, '../../../Login_Register_Page/backend/data/accounts.db');
const DATA_FILE = path.resolve(__dirname, '../src/db/data.json');

console.log('Starting migration of self passengers...');

if (!fs.existsSync(ACCOUNTS_DB)) {
  console.error('Accounts DB not found:', ACCOUNTS_DB);
  process.exit(1);
}

if (!fs.existsSync(DATA_FILE)) {
  console.error('User Center Data file not found:', DATA_FILE);
  process.exit(1);
}

let state;
try {
  state = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
} catch (e) {
  console.error('Failed to parse data file:', e);
  process.exit(1);
}

const accountsRaw = fs.readFileSync(ACCOUNTS_DB, 'utf8');
const accountsLines = accountsRaw.split('\n').filter(line => line.trim());

let count = 0;

accountsLines.forEach(line => {
  try {
    // Skip non-JSON lines (e.g. index lines in nedb)
    if (!line.startsWith('{')) return;
    
    const user = JSON.parse(line);
    
    // Skip internal nedb index lines (they usually have $$indexCreated)
    if (user.$$indexCreated) return;

    // Check status if exists (default to active if missing)
    if (user.status && user.status !== 'active' && user.status !== '已激活') return;

    if (!user.user_id) return;

    const existing = state.passengers.find(p => p.user_id === user.user_id && p.is_self);
    
    if (!existing) {
      const encryptedId = encrypt(user.id_number || '110101199001011234');
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
      count++;
      console.log(`Added self passenger for user: ${user.username} (${user.user_id})`);
    } else {
        // If exists, ensure protected_flag is set
        if (existing.protected_flag !== 1) {
            existing.protected_flag = 1;
            count++; // Count as modified
            console.log(`Updated protected_flag for user: ${user.username}`);
        }
    }
  } catch (e) {
    console.error('Error processing line:', line, e);
  }
});

if (count > 0) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(state, null, 2), 'utf8');
  console.log(`Migration completed. ${count} records updated/added.`);
} else {
  console.log('No changes needed.');
}
