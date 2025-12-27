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
  return path.join(root, isTest ? `ticket_selection.test-${worker}.db` : 'ticket_selection.db');
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
      console.error('[ticket-selection][db] rollback failed', e2);
    }
    throw e;
  }
}

function seedTrains() {
  const baseTrains = [
    {
      trainNo: 'G101',
      fromStation: '北京南站',
      toStation: '上海虹桥站',
      departTime: '08:00',
      arriveTime: '13:28',
      duration: '5小时28分',
      seats: [
        { type: '商务座', count: '有', price: 1748 },
        { type: '一等座', count: '有', price: 933 },
        { type: '二等座', count: '有', price: 553 },
      ],
      startingPrice: 553,
    },
    {
      trainNo: 'D313',
      fromStation: '北京南站',
      toStation: '上海虹桥站',
      departTime: '14:20',
      arriveTime: '22:50',
      duration: '8小时30分',
      seats: [
        { type: '二等座', count: '有', price: 428 },
        { type: '一等座', count: '有', price: 684 },
      ],
      startingPrice: 428,
    },
    {
      trainNo: 'K511',
      fromStation: '北京西站',
      toStation: '上海站',
      departTime: '19:15',
      arriveTime: '14:45',
      duration: '19小时30分',
      seats: [
        { type: '硬座', count: '有', price: 156 },
        { type: '硬卧', count: '有', price: 300 },
        { type: '软卧', count: '有', price: 450 },
      ],
      startingPrice: 156,
    },
    {
      trainNo: 'G7001',
      fromStation: '南京南站',
      toStation: '上海虹桥站',
      departTime: '09:30',
      arriveTime: '11:00',
      duration: '1小时30分',
      seats: [
        { type: '二等座', count: '有', price: 134 },
        { type: '一等座', count: '有', price: 200 },
        { type: '商务座', count: '有', price: 400 },
      ],
      startingPrice: 134,
    },
    {
      trainNo: 'D5401',
      fromStation: '南京南站',
      toStation: '上海虹桥站',
      departTime: '15:45',
      arriveTime: '17:15',
      duration: '1小时30分',
      seats: [
        { type: '二等座', count: '有', price: 119 },
        { type: '一等座', count: '有', price: 180 },
      ],
      startingPrice: 119,
    },
    {
      trainNo: 'G7002',
      fromStation: '上海虹桥站',
      toStation: '南京南站',
      departTime: '12:00',
      arriveTime: '13:30',
      duration: '1小时30分',
      seats: [
        { type: '二等座', count: '有', price: 134 },
        { type: '一等座', count: '有', price: 200 },
        { type: '商务座', count: '有', price: 400 },
      ],
      startingPrice: 134,
    },
    {
      trainNo: 'G103',
      fromStation: '北京南站',
      toStation: '上海虹桥站',
      departTime: '08:30',
      arriveTime: '13:58',
      duration: '5小时28分',
      seats: [
        { type: '二等座', count: '有', price: 428 },
        { type: '一等座', count: '有', price: 684 },
      ],
      startingPrice: 428,
    },
    {
      trainNo: 'D315',
      fromStation: '北京南站',
      toStation: '上海虹桥站',
      departTime: '14:50',
      arriveTime: '23:20',
      duration: '8小时30分',
      seats: [
        { type: '二等座', count: '有', price: 428 },
        { type: '一等座', count: '有', price: 684 },
      ],
      startingPrice: 428,
    },
    {
      trainNo: 'G153',
      fromStation: '北京南站',
      toStation: '南京南站',
      departTime: '10:45',
      arriveTime: '14:15',
      duration: '3小时30分',
      seats: [
        { type: '二等座', count: '有', price: 443 },
        { type: '一等座', count: '有', price: 700 },
        { type: '商务座', count: '有', price: 1400 },
      ],
      startingPrice: 443,
    },
    {
      trainNo: 'G7003',
      fromStation: '南京南站',
      toStation: '上海虹桥站',
      departTime: '10:00',
      arriveTime: '11:30',
      duration: '1小时30分',
      seats: [
        { type: '二等座', count: '有', price: 134 },
        { type: '一等座', count: '有', price: 200 },
        { type: '商务座', count: '有', price: 400 },
      ],
      startingPrice: 134,
    },
    {
      trainNo: 'G506',
      fromStation: '长沙南',
      toStation: '北京西站',
      departTime: '09:00',
      arriveTime: '15:00',
      duration: '6小时00分',
      seats: [
        { type: '二等座', count: '有', price: 650 },
        { type: '一等座', count: '有', price: 1000 },
      ],
      startingPrice: 650,
    },
    {
      trainNo: 'G1234',
      fromStation: '长春',
      toStation: '北京',
      departTime: '07:00',
      arriveTime: '13:30',
      duration: '6小时30分',
      seats: [
        { type: '二等座', count: '有', price: 500 },
        { type: '一等座', count: '有', price: 800 },
      ],
      startingPrice: 500,
    },
  ];

  const result = [];
  const today = new Date();
  
  // Generate data for next 30 days
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const dateStr = `${y}-${m}-${day}`;
    
    baseTrains.forEach(train => {
      result.push({ ...train, date: dateStr });
    });
  }
  
  return result;
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
        `CREATE TABLE IF NOT EXISTS trains (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          date TEXT NOT NULL,
          train_no TEXT NOT NULL,
          from_station TEXT NOT NULL,
          to_station TEXT NOT NULL,
          depart_time TEXT NOT NULL,
          arrive_time TEXT NOT NULL,
          duration TEXT NOT NULL,
          starting_price INTEGER,
          UNIQUE(date, train_no, from_station, to_station, depart_time)
        );`,
        'CREATE INDEX IF NOT EXISTS idx_trains_date_from_to ON trains(date, from_station, to_station);',
        `CREATE TABLE IF NOT EXISTS train_seats (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          train_id INTEGER NOT NULL,
          seat_type TEXT NOT NULL,
          seat_count TEXT NOT NULL,
          seat_price INTEGER NOT NULL,
          UNIQUE(train_id, seat_type),
          FOREIGN KEY(train_id) REFERENCES trains(id) ON DELETE CASCADE
        );`,
        'CREATE INDEX IF NOT EXISTS idx_train_seats_train ON train_seats(train_id);',
      ].join('\n')
    );

    const resetOnStart = (process.env.DB_RESET_ON_START || '1') === '1';
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
    if (isTest && resetOnStart) {
      await exec(db, 'DELETE FROM train_seats;\nDELETE FROM trains;');
    }

    const row = await get(db, 'SELECT COUNT(1) AS c FROM trains');
    if ((row && row.c) || 0) return;

    const trains = seedTrains();
    await withTransaction(db, async () => {
      for (const t of trains) {
        const insertTrain = await run(
          db,
          `INSERT INTO trains(date, train_no, from_station, to_station, depart_time, arrive_time, duration, starting_price)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?)` ,
          [
            t.date,
            t.trainNo,
            t.fromStation,
            t.toStation,
            t.departTime,
            t.arriveTime,
            t.duration,
            t.startingPrice != null ? t.startingPrice : null,
          ]
        );
        const trainId = insertTrain.lastID;
        for (const s of t.seats || []) {
          await run(
            db,
            'INSERT INTO train_seats(train_id, seat_type, seat_count, seat_price) VALUES(?, ?, ?, ?)',
            [trainId, String(s.type), String(s.count), Number(s.price)]
          );
        }
      }
    });
  })().catch((e) => {
    console.error('[ticket-selection][db] init failed', e);
    throw e;
  });
  return initPromise;
}

async function resetAndSeed() {
  await initDb();
  const db = await getDbRaw();
  const trains = seedTrains();
  await withTransaction(db, async () => {
    await exec(db, 'DELETE FROM train_seats;\nDELETE FROM trains;');
    for (const t of trains) {
      const insertTrain = await run(
        db,
        `INSERT INTO trains(date, train_no, from_station, to_station, depart_time, arrive_time, duration, starting_price)
         VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          t.date,
          t.trainNo,
          t.fromStation,
          t.toStation,
          t.departTime,
          t.arriveTime,
          t.duration,
          t.startingPrice != null ? t.startingPrice : null,
        ]
      );
      const trainId = insertTrain.lastID;
      for (const s of t.seats || []) {
        await run(
          db,
          'INSERT INTO train_seats(train_id, seat_type, seat_count, seat_price) VALUES(?, ?, ?, ?)',
          [trainId, String(s.type), String(s.count), Number(s.price)]
        );
      }
    }
  });
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
    console.error('[ticket-selection][db] open failed', e);
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
  const target = path.join(backupsDir, `ticket_selection.${ts}.db`);

  const db = await getDbRaw();
  const safeTarget = String(target).replace(/'/g, "''");
  await exec(db, `VACUUM INTO '${safeTarget}';`);
  return target;
}

module.exports = {
  getDb,
  initDb,
  resetAndSeed,
  backupDb,
  all,
  get,
  run,
  exec,
  withTransaction,
};
