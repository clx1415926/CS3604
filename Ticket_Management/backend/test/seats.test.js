/**
 * 测试范围：/api/v1/seats
 * - Happy Path：获取座位图、锁座
 * - Edge Cases：锁座参数缺失时的默认值、返回结构稳定
 */

const request = require('supertest');
const { app } = require('../src/app');
const { getDb, get, resetDb } = require('../src/db');

describe('Feature: Seats API', () => {
  beforeEach(async () => {
    await resetDb();
  });

  it('should return seat map with stable structure', async () => {
    // 场景：获取座位图（座位占用是随机的，但结构/数量应稳定）
    const res = await request(app)
      .get('/api/v1/seats/map')
      .query({
        train_id: 'G123',
        travel_date: '2025-11-17',
        seat_class: '二等座',
        carriage_no: '10',
      })
      .expect(200);

    expect(res.body).toMatchObject({
      train_id: 'G123',
      travel_date: '2025-11-17',
      seat_class: '二等座',
      carriage_no: '10',
    });

    expect(Array.isArray(res.body.seats)).toBe(true);
    expect(res.body.seats).toHaveLength(100);

    // 断言：每个座位具有必要字段
    const seat = res.body.seats.find((s) => s.seat_no === '1A') || res.body.seats[0];
    expect(seat).toHaveProperty('seat_no');
    expect(seat).toHaveProperty('row');
    expect(seat).toHaveProperty('column');
    expect(seat).toHaveProperty('window');
    expect(seat).toHaveProperty('occupied');

    // 断言：列字母应在 A/B/C/D/F 集合中
    const allowed = new Set(['A', 'B', 'C', 'D', 'F']);
    for (const s of res.body.seats.slice(0, 10)) {
      expect(allowed.has(s.column)).toBe(true);
    }
  });

  it('should lock seats and return lock tokens', async () => {
    // 场景：锁座成功返回 lock_token 与有效期
    const res = await request(app)
      .post('/api/v1/seats/lock')
      .send({
        train_id: 'G123',
        travel_date: '2025-11-17',
        seats: [
          { carriage_no: '10', seat_no: '1A' },
          { carriage_no: '10', seat_no: '1B' },
        ],
      })
      .expect(200);

    expect(Array.isArray(res.body.locks)).toBe(true);
    expect(res.body.locks).toHaveLength(2);

    const [l1, l2] = res.body.locks;
    expect(typeof l1.lock_token).toBe('string');
    expect(l1.lock_token.length).toBeGreaterThan(0);
    expect(typeof l2.lock_token).toBe('string');
    expect(l2.lock_token.length).toBeGreaterThan(0);
    expect(l1).toMatchObject({ carriage_no: '10', seat_no: '1A' });
    expect(l2).toMatchObject({ carriage_no: '10', seat_no: '1B' });
    expect(typeof l1.expires_at).toBe('string');
  });

  it('should default carriage_no and seat_no when missing', async () => {
    // 场景：锁座请求里缺失字段时，后端使用默认座位信息
    const res = await request(app)
      .post('/api/v1/seats/lock')
      .send({
        train_id: 'G123',
        travel_date: '2025-11-17',
        seats: [{}],
      })
      .expect(200);

    expect(res.body.locks).toHaveLength(1);
    expect(res.body.locks[0]).toMatchObject({
      carriage_no: '10',
      seat_no: '16A',
    });
  });

  it('should persist seat lock in database and reflect in seat map', async () => {
    const authHeader = { Authorization: 'Bearer sid-u-seat1' };

    const lockRes = await request(app)
      .post('/api/v1/seats/lock')
      .set(authHeader)
      .send({
        train_id: 'G123',
        travel_date: '2025-11-17',
        seats: [{ carriage_no: '10', seat_no: '1A' }],
      })
      .expect(200);

    const token = lockRes.body.locks[0].lock_token;

    const db = await getDb();
    const row = await get(
      db,
      `SELECT lock_token FROM seat_locks WHERE train_code = ? AND travel_date = ? AND carriage_no = ? AND seat_no = ?`,
      ['G123', '2025-11-17', '10', '1A']
    );
    expect(row).toBeTruthy();
    expect(String(row.lock_token)).toBe(String(token));

    const mapRes = await request(app)
      .get('/api/v1/seats/map')
      .query({ train_id: 'G123', travel_date: '2025-11-17', seat_class: '二等座', carriage_no: '10' })
      .expect(200);
    const seat = mapRes.body.seats.find((s) => s.seat_no === '1A');
    expect(seat).toBeTruthy();
    expect(seat.occupied).toBe(true);
    expect(seat.status).toBe('locked');
  });

  it('should make locked seat immediately unavailable to other users', async () => {
    const user1 = { Authorization: 'Bearer sid-u-seat2' };
    const user2 = { Authorization: 'Bearer sid-u-seat3' };

    await request(app)
      .post('/api/v1/seats/lock')
      .set(user1)
      .send({ train_id: 'G123', travel_date: '2025-11-17', seats: [{ carriage_no: '10', seat_no: '1B' }] })
      .expect(200);

    await request(app)
      .post('/api/v1/seats/lock')
      .set(user2)
      .send({ train_id: 'G123', travel_date: '2025-11-17', seats: [{ carriage_no: '10', seat_no: '1B' }] })
      .expect(409);
  });

  it('should keep seat map status consistent across refreshes', async () => {
    const authHeader = { Authorization: 'Bearer sid-u-seat4' };
    await request(app)
      .post('/api/v1/seats/lock')
      .set(authHeader)
      .send({ train_id: 'G123', travel_date: '2025-11-17', seats: [{ carriage_no: '10', seat_no: '1C' }] })
      .expect(200);

    const map1 = await request(app)
      .get('/api/v1/seats/map')
      .query({ train_id: 'G123', travel_date: '2025-11-17', seat_class: '二等座', carriage_no: '10' })
      .expect(200);
    const map2 = await request(app)
      .get('/api/v1/seats/map')
      .query({ train_id: 'G123', travel_date: '2025-11-17', seat_class: '二等座', carriage_no: '10' })
      .expect(200);

    const s1 = map1.body.seats.find((s) => s.seat_no === '1C');
    const s2 = map2.body.seats.find((s) => s.seat_no === '1C');
    expect(s1.occupied).toBe(true);
    expect(s2.occupied).toBe(true);
    expect(s1.status).toBe('locked');
    expect(s2.status).toBe('locked');
  });

  it('should handle concurrent lock requests consistently', async () => {
    const r1 = request(app)
      .post('/api/v1/seats/lock')
      .set({ Authorization: 'Bearer sid-u-seat5' })
      .send({ train_id: 'G123', travel_date: '2025-11-17', seats: [{ carriage_no: '10', seat_no: '2A' }] });
    const r2 = request(app)
      .post('/api/v1/seats/lock')
      .set({ Authorization: 'Bearer sid-u-seat6' })
      .send({ train_id: 'G123', travel_date: '2025-11-17', seats: [{ carriage_no: '10', seat_no: '2A' }] });

    const settled = await Promise.allSettled([r1, r2]);
    const codes = settled.map((s) => (s.status === 'fulfilled' ? s.value.status : 0)).sort();
    expect(codes).toEqual([200, 409]);
  });
});
