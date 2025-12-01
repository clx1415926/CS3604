const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-POST-OrderCreate
// @AcceptanceCriteria: #1
test('should create unpaid order and return order_id', async () => {
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', 'Bearer sess-super-12306')
    .send({ train_id: 'G123', travel_date: '2025-11-17', from_station: '北京南', to_station: '上海虹桥', passengers: [{ passenger_id: 'p-001', name: '张三', ticket_type: '成人票' }], seat_locks: [{ lock_token: 'lk-001' }] });
  expect(res.status).toBe(201);
  expect(res.body).toHaveProperty('order_id');
  expect(res.body.status).toBe('unpaid');
  expect(typeof res.body.price_total).toBe('number');
});

// @InterfaceID: API-GET-Orders
// @AcceptanceCriteria: #1
test('should list orders in unpaid tab with required fields', async () => {
  const res = await request(app).get('/api/v1/orders').query({ status: 'unpaid' });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('orders');
  const o = res.body.orders[0];
  expect(o).toHaveProperty('order_id');
  expect(o).toHaveProperty('train');
  expect(o).toHaveProperty('passengers');
  expect(o).toHaveProperty('seats');
  expect(o).toHaveProperty('price_total');
  expect(o).toHaveProperty('status');
});

// @InterfaceID: API-GET-OrderDetail
// @AcceptanceCriteria: #1
test('should return order detail with full field set', async () => {
  const res = await request(app).get('/api/v1/orders/o-001');
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('order');
  const d = res.body.order;
  expect(d).toHaveProperty('order_id');
  expect(d).toHaveProperty('train');
  expect(d).toHaveProperty('passengers');
  expect(d).toHaveProperty('seats');
  expect(d).toHaveProperty('price_total');
  expect(d).toHaveProperty('status');
});

// @InterfaceID: API-POST-OrderCancel
// @AcceptanceCriteria: #1, #2
test('should cancel unpaid order or enforce daily limit', async () => {
  const res = await request(app).post('/api/v1/orders/o-001/cancel').send({});
  expect([200, 429]).toContain(res.status);
});