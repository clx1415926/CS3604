const request = require('supertest');
const { app } = require('../../src/app');

process.env.TEST_AUTH_ANY = '1';

test('orders are isolated per token: initial empty for new user', async () => {
  const res = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', 'Bearer tok-A');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.orders)).toBe(true);
  expect(res.body.orders.length).toBe(0);
});

test('creating order stores under token and does not leak', async () => {
  const create = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', 'Bearer tok-A')
    .send({ train_id: 'G101', travel_date: '2025-12-15', from_station: '北京南站', to_station: '上海虹桥站', passengers: [{ name: '张三' }], seat_locks: [{ lock_token: 'lk-1' }] });
  expect(create.status).toBe(201);
  const listA = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', 'Bearer tok-A');
  expect(listA.status).toBe(200);
  expect(listA.body.orders.length).toBeGreaterThanOrEqual(1);
  const listB = await request(app)
    .get('/api/v1/orders')
    .set('Authorization', 'Bearer tok-B');
  expect(listB.status).toBe(200);
  expect(listB.body.orders.length).toBe(0);
});