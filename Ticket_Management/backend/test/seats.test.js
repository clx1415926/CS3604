/**
 * 测试范围：/api/v1/seats
 * - Happy Path：获取座位图、锁座
 * - Edge Cases：锁座参数缺失时的默认值、返回结构稳定
 */

const request = require('supertest');
const { app } = require('../src/app');

describe('Feature: Seats API', () => {
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
    expect(l1.lock_token).toMatch(/^lk-\d{3}$/);
    expect(l2.lock_token).toMatch(/^lk-\d{3}$/);
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
});

