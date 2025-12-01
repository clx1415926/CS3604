const request = require('supertest');
const { app } = require('../../src/app');

process.env.TEST_AUTH_ANY = '1';

// @InterfaceID: API-GET-Orders
// @AcceptanceCriteria: N/A
// @BugID: BUG-ORD-PERSIST-001
test('should persist orders under stable sid per user - BUG-ORD-PERSIST-001', async () => {
  const sid = 'sid-u-aaa';

  const create = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .send({
      train_id: 'G101',
      travel_date: '2025-12-15',
      from_station: '广州南',
      to_station: '深圳北',
      passengers: [{ name: '张三' }],
      seat_locks: [{ lock_token: 'lk-1' }],
    });
  expect(create.status).toBe(201);

  const list = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`);
  expect(list.status).toBe(200);
  expect(list.body.orders.length).toBeGreaterThanOrEqual(1);
});