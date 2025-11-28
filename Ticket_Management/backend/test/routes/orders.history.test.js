const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-GET-Orders
// @AcceptanceCriteria: #5
test('should list canceled orders under history tab', async () => {
  const sid = 'sid-u-history';
  const create = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .send({
      train_id: 'G8002',
      travel_date: '2025-11-17',
      from_station: '北京南',
      to_station: '上海虹桥',
      passengers: [{ name: '王五' }],
      seat_locks: [{ lock_token: 'lk-001' }],
    });
  expect(create.status).toBe(201);
  const orderId = create.body.order_id || 'o-001';

  const cancel = await request(app)
    .post(`/api/v1/orders/${orderId}/cancel`)
    .set('Authorization', `Bearer ${sid}`)
    .send({});
  expect([200, 429]).toContain(cancel.status);

  const listHistory = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .query({ status: 'history' });
  expect(listHistory.status).toBe(200);
  // Expect history tab to include canceled orders with status 'canceled'
  const hasCanceled = (listHistory.body.orders || []).some((o) => String(o.status) === 'canceled');
  expect(hasCanceled).toBe(true);
});

