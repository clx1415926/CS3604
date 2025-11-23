const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-POST-OrderPay
// @AcceptanceCriteria: #1
test('should pay created order successfully under same session', async () => {
  const sid = 'sess-super-12306';
  const create = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .send({
      train_id: 'G123',
      travel_date: '2025-11-17',
      from_station: '北京南',
      to_station: '上海虹桥',
      passengers: [{ passenger_id: 'p-001', name: '张三', ticket_type: '成人票' }],
      seat_locks: [{ lock_token: 'lk-001' }],
    });
  expect(create.status).toBe(201);
  const orderId = create.body.order_id;

  const pay = await request(app)
    .post(`/api/v1/orders/${orderId}/pay`)
    .set('Authorization', `Bearer ${sid}`)
    .send({});
  expect(pay.status).toBe(200);
  expect(pay.body).toHaveProperty('success', true);
  expect(pay.body).toHaveProperty('status', 'paid');
});