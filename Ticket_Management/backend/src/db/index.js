const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

function projectRoot() {
  return path.resolve(__dirname, '..', '..', '..');
}

function defaultDbPath() {
  if (process.env.DB_PATH) return process.env.DB_PATH;
  const root = projectRoot();
  const worker = process.env.JEST_WORKER_ID || process.pid;
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  return path.join(root, isTest ? `ticket_management.test-${worker}.db` : 'ticket_management.db');
}

let dbPromise;
let initPromise;

function openDb(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.cached.Database(dbPath, (err) => {
      if (err) return reject(err);
      resolve(db);
    });
  });
}

function exec(db, sql) {
  return new Promise((resolve, reject) => {
    db.exec(sql, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

function get(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.get(sql, params || [], (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

function all(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.all(sql, params || [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

function run(db, sql, params) {
  return new Promise((resolve, reject) => {
    db.run(sql, params || [], function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

async function withTransaction(db, fn) {
  await exec(db, 'BEGIN IMMEDIATE');
  try {
    const result = await fn();
    await exec(db, 'COMMIT');
    return result;
  } catch (e) {
    try {
      await exec(db, 'ROLLBACK');
    } catch (e2) {
      console.error('[ticket-management][db] rollback failed', e2);
    }
    throw e;
  }
}

async function initDb() {
  if (initPromise) return initPromise;
  initPromise = (async () => {
    const db = await getDbRaw();
    await exec(
      db,
      [
        'PRAGMA foreign_keys = ON;',
        'PRAGMA journal_mode = WAL;',
        'PRAGMA synchronous = NORMAL;',
        `CREATE TABLE IF NOT EXISTS orders (
          order_id TEXT PRIMARY KEY,
          user_key TEXT NOT NULL,
          booked_at TEXT NOT NULL,
          train_code TEXT NOT NULL,
          from_station TEXT NOT NULL,
          to_station TEXT NOT NULL,
          depart_time TEXT NOT NULL,
          arrive_time TEXT NOT NULL,
          price_total REAL NOT NULL,
          status TEXT NOT NULL CHECK(status IN ('unpaid','paid','canceled','completed')),
          paid_at TEXT
        );`,
        'CREATE INDEX IF NOT EXISTS idx_orders_user_key ON orders(user_key);',
        'CREATE INDEX IF NOT EXISTS idx_orders_user_status ON orders(user_key, status);',
        'CREATE INDEX IF NOT EXISTS idx_orders_user_booked ON orders(user_key, booked_at);',
        `CREATE TABLE IF NOT EXISTS order_passengers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          passenger_id TEXT,
          name TEXT NOT NULL,
          id_type TEXT,
          id_number TEXT,
          phone_number TEXT,
          ticket_type TEXT,
          FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
        );`,
        'CREATE INDEX IF NOT EXISTS idx_order_passengers_order ON order_passengers(order_id);',
        `CREATE TABLE IF NOT EXISTS order_seats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          order_id TEXT NOT NULL,
          seat_class TEXT NOT NULL,
          carriage_no TEXT,
          seat_no TEXT,
          FOREIGN KEY(order_id) REFERENCES orders(order_id) ON DELETE CASCADE
        );`,
        'CREATE INDEX IF NOT EXISTS idx_order_seats_order ON order_seats(order_id);',
        `CREATE TABLE IF NOT EXISTS cancel_stats (
          user_key TEXT NOT NULL,
          date TEXT NOT NULL,
          count INTEGER NOT NULL,
          PRIMARY KEY(user_key, date)
        );`,
      ].join('\n')
    );

    const resetOnStart = (process.env.DB_RESET_ON_START || '1') === '1';
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
    if (isTest && resetOnStart) {
      await exec(
        db,
        [
          'DELETE FROM cancel_stats;',
          'DELETE FROM order_seats;',
          'DELETE FROM order_passengers;',
          'DELETE FROM orders;',
        ].join('\n')
      );
    }
  })().catch((e) => {
    console.error('[ticket-management][db] init failed', e);
    throw e;
  });
  return initPromise;
}

async function getDbRaw() {
  if (dbPromise) return dbPromise;
  dbPromise = (async () => {
    const dbPath = defaultDbPath();
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const db = await openDb(dbPath);
    return db;
  })().catch((e) => {
    console.error('[ticket-management][db] open failed', e);
    throw e;
  });
  return dbPromise;
}

async function getDb() {
  await initDb();
  return getDbRaw();
}

async function backupDb() {
  const dbPath = defaultDbPath();
  const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
  if (isTest) return null;
  const backupsDir = process.env.DB_BACKUP_DIR || path.join(projectRoot(), 'backups');
  if (!fs.existsSync(backupsDir)) fs.mkdirSync(backupsDir, { recursive: true });
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  const target = path.join(backupsDir, `ticket_management.${ts}.db`);

  const db = await getDbRaw();
  const safeTarget = String(target).replace(/'/g, "''");
  await exec(db, `VACUUM INTO '${safeTarget}';`);
  return target;
}

module.exports = {
  getDb,
  initDb,
  async resetDb() {
    await initDb();
    const db = await getDbRaw();
    await withTransaction(db, async () => {
      await exec(
        db,
        [
          'DELETE FROM cancel_stats;',
          'DELETE FROM order_seats;',
          'DELETE FROM order_passengers;',
          'DELETE FROM orders;',
        ].join('\n')
      );
    });
  },
  backupDb,
  all,
  get,
  run,
  exec,
  withTransaction,
};
