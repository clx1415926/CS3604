const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-GET-Orders
// @AcceptanceCriteria: #4
test('should auto-expire unpaid orders beyond payment window and exclude from unpaid list', async () => {
  const sid = 'sid-u-expire';
  const create = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .send({
      train_id: 'G8001',
      travel_date: '2025-11-17',
      from_station: '北京南',
      to_station: '上海虹桥',
      passengers: [{ name: '李四' }],
      seat_locks: [{ lock_token: 'lk-001' }],
    });
  expect(create.status).toBe(201);

  const list = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .query({ status: 'unpaid' });
  expect(list.status).toBe(200);
  // Expect unpaid list to exclude expired orders per AC (30min window)
  // Current skeleton does not implement auto-expire, so this assertion should fail until implemented
  expect((list.body.orders || []).length).toBe(0);
});

