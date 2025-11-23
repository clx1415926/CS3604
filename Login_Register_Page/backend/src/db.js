// Simple file-based database using nedb-promises (pure JS) for demo purposes
// Stores registered user accounts and supports lookup for login

const fs = require('fs');
const path = require('path');
const Datastore = require('nedb-promises');

const dataDir = path.resolve(__dirname, '../data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const dbPath = path.join(dataDir, 'accounts.db');
const useMemory = process.env.NODE_ENV === 'test';

const accounts = useMemory
  ? Datastore.create({ inMemoryOnly: true })
  : Datastore.create({ filename: dbPath, autoload: true });

// Indexes to enforce uniqueness
accounts.ensureIndex({ fieldName: 'username', unique: true }).catch(() => {});
// email 使用稀疏索引，允许文档缺少该字段；避免多个 null 值触发唯一性冲突
accounts.ensureIndex({ fieldName: 'email', unique: true, sparse: true }).catch(() => {});
accounts.ensureIndex({ fieldName: 'phone_key', unique: true }).catch(() => {});

function phoneKey(cc, num) { return `${cc || '+86'}:${num}`; }

module.exports = {
  async isUsernameAvailable(username) {
    if (!username) return false;
    const found = await accounts.findOne({ username });
    return !found;
  },
  async isPhoneAvailable(cc, num) {
    if (!num) return false;
    const found = await accounts.findOne({ phone_key: phoneKey(cc, num) });
    return !found;
  },
  async findByUserId(user_id) {
    if (!user_id) return null;
    return accounts.findOne({ user_id });
  },
  async findByUsername(username) {
    if (!username) return null;
    return accounts.findOne({ username });
  },
  async findByEmail(email) {
    if (!email) return null;
    return accounts.findOne({ email });
  },
  async findByPhone(cc, num) {
    if (!num) return null;
    return accounts.findOne({ phone_key: phoneKey(cc, num) });
  },
  async createUser(user) {
    const doc = {
      user_id: user.user_id,
      username: user.username,
      phone_country_code: user.phone_country_code || '+86',
      phone_number: user.phone_number,
      phone_key: phoneKey(user.phone_country_code || '+86', user.phone_number),
      password_hash: user.password_hash,
      password_salt: user.password_salt,
      name: user.name,
      id_type: user.id_type,
      id_number: user.id_number,
      traveler_type: user.traveler_type,
      created_at: Date.now(),
    };
    // 仅当提供 email 时才写入该字段，避免以 null 参与唯一索引
    if (user.email) {
      doc.email = user.email;
    }
    return accounts.insert(doc);
  },
  async updatePasswordByUserId(user_id, password_hash, password_salt) {
    if (!user_id || !password_hash || !password_salt) throw new Error('updatePasswordByUserId: invalid params');
    const num = await accounts.update({ user_id }, { $set: { password_hash, password_salt, updated_at: Date.now() } }, { multi: false });
    return num > 0;
  }
};