const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const { getDb, all, get, run, withTransaction } = require('../db');

function nowIso() {
  return new Date().toISOString();
}

function identityKeyFromToken(token) {
  const m = String(token).match(/^sid-(.+)$/);
  if (m) return `user:${m[1]}`;
  return `token:${token}`;
}

function authUserKey(req) {
  const header = req.get('Authorization') || '';
  const m = String(header).match(/Bearer\s+(.+)/);
  const token = m ? m[1] : 'anonymous';
  return identityKeyFromToken(token);
}

const seatMapCache = new Map();

function seatMapCacheKey({ train_id, travel_date, seat_class, carriage_no }) {
  return `${String(train_id || '')}|${String(travel_date || '')}|${String(seat_class || '')}|${String(carriage_no || '')}`;
}

function getCachedSeatMap(key) {
  const v = seatMapCache.get(key);
  if (!v) return null;
  if (Date.now() > v.expiresAt) {
    seatMapCache.delete(key);
    return null;
  }
  return v.payload;
}

function setCachedSeatMap(key, payload, ttlMs) {
  seatMapCache.set(key, { payload, expiresAt: Date.now() + ttlMs });
}

async function cleanupExpiredLocks(db) {
  await run(db, `DELETE FROM seat_locks WHERE expires_at <= ?`, [nowIso()]);
}

async function getSeatSnapshot(db, { train_id, travel_date, carriage_no }) {
  await cleanupExpiredLocks(db);

  const orderRows = await all(
    db,
    `SELECT s.carriage_no, s.seat_no, o.status
     FROM order_seats s
     JOIN orders o ON o.order_id = s.order_id
     WHERE o.train_code = ?
       AND o.travel_date = ?
       AND s.carriage_no = ?
       AND o.status IN ('unpaid', 'paid', 'completed')`,
    [String(train_id), String(travel_date), String(carriage_no)]
  );

  const lockRows = await all(
    db,
    `SELECT carriage_no, seat_no, user_key, lock_token, expires_at
     FROM seat_locks
     WHERE train_code = ? AND travel_date = ? AND carriage_no = ?`,
    [String(train_id), String(travel_date), String(carriage_no)]
  );

  const orderBySeat = new Map();
  for (const r of orderRows || []) {
    orderBySeat.set(`${String(r.carriage_no)}:${String(r.seat_no)}`, String(r.status));
  }

  const lockBySeat = new Map();
  for (const r of lockRows || []) {
    lockBySeat.set(`${String(r.carriage_no)}:${String(r.seat_no)}`, {
      user_key: String(r.user_key),
      lock_token: String(r.lock_token),
      expires_at: String(r.expires_at),
    });
  }

  return { orderBySeat, lockBySeat };
}

router.get('/map', (req, res) => {
  (async () => {
    const { train_id, travel_date, seat_class } = req.query;
    const carriage_no = req.query.carriage_no || '10';
    const cacheKey = seatMapCacheKey({ train_id, travel_date, seat_class, carriage_no });
    const cached = getCachedSeatMap(cacheKey);
    if (cached) return res.json(cached);

    const db = await getDb();
    const { orderBySeat, lockBySeat } = await getSeatSnapshot(db, { train_id, travel_date, carriage_no });

    const seats = [];
    const columns = ['A', 'B', 'C', 'D', 'F'];
    const rows = 20;

    for (let row = 1; row <= rows; row++) {
      for (const col of columns) {
        const seat_no = `${row}${col}`;
        const key = `${String(carriage_no)}:${seat_no}`;
        const orderStatus = orderBySeat.get(key);
        const lockInfo = lockBySeat.get(key);
        const status = orderStatus
          ? orderStatus === 'paid' || orderStatus === 'completed'
            ? 'sold'
            : 'unpaid'
          : lockInfo
            ? 'locked'
            : 'available';
        seats.push({
          seat_no,
          row: row,
          column: col,
          window: col === 'A' || col === 'F',
          occupied: status !== 'available',
          status,
          lock_expires_at: lockInfo ? lockInfo.expires_at : null,
        });
      }
    }

    const payload = { train_id, travel_date, seat_class, carriage_no, seats };
    const isTest = process.env.NODE_ENV === 'test' || Boolean(process.env.JEST_WORKER_ID);
    const ttl = isTest ? 0 : 500;
    if (ttl > 0) setCachedSeatMap(cacheKey, payload, ttl);
    res.json(payload);
  })().catch((e) => {
    console.error('[ticket-management][seats-map] db error', e);
    res.status(500).json({ error: 'DB_ERROR' });
  });
});

router.post('/lock', (req, res) => {
  (async () => {
    const { train_id, travel_date, seats } = req.body || {};
    const requested = Array.isArray(seats) ? seats : [];
    if (requested.length === 0) return res.json({ locks: [] });
    
    console.log('[座位锁定] 收到的seats请求:', JSON.stringify(requested));

    const user_key = authUserKey(req);
    const trainCode = String(train_id || '');
    const travelDate = String(travel_date || '');
    if (!trainCode || !travelDate) {
      return res.status(400).json({ error: 'INVALID_PARAMS', message: '参数缺失' });
    }

    const normalized = requested.map((s) => ({
      carriage_no: s?.carriage_no || '10',
      seat_no: s?.seat_no || '16A',
      seat_class: s?.seat_class || '二等座',
    }));
    
    console.log('[座位锁定] 标准化后的seats:', JSON.stringify(normalized));

    const db = await getDb();
    const expiresAt = new Date(Date.now() + 2 * 60 * 1000).toISOString();
    const ts = nowIso();

    const result = await withTransaction(db, async () => {
      await cleanupExpiredLocks(db);

      const locks = [];
      const uniqueCarriages = Array.from(new Set(normalized.map((s) => String(s.carriage_no || ''))));
      const snapshotByCarriage = new Map();
      for (const c of uniqueCarriages) {
        snapshotByCarriage.set(c, await getSeatSnapshot(db, { train_id: trainCode, travel_date: travelDate, carriage_no: c }));
      }

      for (const s of normalized) {
        const carriageNo = String(s.carriage_no);
        const seatNo = String(s.seat_no);
        const seatKey = `${carriageNo}:${seatNo}`;
        const snapshot = snapshotByCarriage.get(carriageNo);
        const orderStatus = snapshot?.orderBySeat?.get(seatKey);
        if (orderStatus) {
          const err = new Error('SEAT_NOT_AVAILABLE');
          err.code = 'SEAT_NOT_AVAILABLE';
          err.seat = { carriage_no: carriageNo, seat_no: seatNo };
          throw err;
        }
        const lockInfo = snapshot?.lockBySeat?.get(seatKey);
        if (lockInfo && String(lockInfo.user_key) !== user_key) {
          const err = new Error('SEAT_LOCKED');
          err.code = 'SEAT_LOCKED';
          err.seat = { carriage_no: carriageNo, seat_no: seatNo };
          throw err;
        }

        const existing = await get(
          db,
          `SELECT lock_token FROM seat_locks
           WHERE train_code = ? AND travel_date = ? AND carriage_no = ? AND seat_no = ?`,
          [trainCode, travelDate, carriageNo, seatNo]
        );

        const lock_token = existing?.lock_token ? String(existing.lock_token) : crypto.randomBytes(12).toString('hex');
        await run(
          db,
          `INSERT INTO seat_locks(train_code, travel_date, carriage_no, seat_no, user_key, lock_token, expires_at, created_at, updated_at)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(train_code, travel_date, carriage_no, seat_no)
           DO UPDATE SET user_key = excluded.user_key, lock_token = excluded.lock_token, expires_at = excluded.expires_at, updated_at = excluded.updated_at`,
          [trainCode, travelDate, carriageNo, seatNo, user_key, lock_token, expiresAt, ts, ts]
        );
        await run(
          db,
          `INSERT INTO seat_events(ts, user_key, action, train_code, travel_date, carriage_no, seat_no, lock_token)
           VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
          [ts, user_key, 'lock', trainCode, travelDate, carriageNo, seatNo, lock_token]
        );
        locks.push({ lock_token, expires_at: expiresAt, carriage_no: carriageNo, seat_no: seatNo, seat_class: s.seat_class });
        console.log(`[座位锁定-完成] carriage=${carriageNo}, seat=${seatNo}, class=${s.seat_class}`);
      }
      return locks;
    });

    res.json({ locks: result });
  })().catch((e) => {
    if (e && (e.code === 'SEAT_NOT_AVAILABLE' || e.code === 'SEAT_LOCKED')) {
      return res.status(409).json({ error: 'SEAT_NOT_AVAILABLE', message: '座位已被占用', seat: e.seat });
    }
    if (e && e.code === 'SQLITE_BUSY') {
      return res.status(409).json({ error: 'SEAT_NOT_AVAILABLE', message: '座位已被占用' });
    }
    console.error('[ticket-management][seats-lock] db error', e);
    res.status(500).json({ error: 'DB_ERROR' });
  });
});

module.exports = router;
