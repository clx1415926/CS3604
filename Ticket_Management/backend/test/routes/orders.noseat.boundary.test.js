const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-POST-OrderCreate
// @AcceptanceCriteria: #2
test('should return NO_SEATS_AVAILABLE with human-friendly message when seat locks missing', async () => {
  const sid = 'sid-u-noseat';
  const res = await request(app)
    .post('/api/v1/orders')
    .set('Authorization', `Bearer ${sid}`)
    .send({ train_id: 'G8004', travel_date: '2025-11-17', from_station: '北京南', to_station: '上海虹桥', passengers: [{ name: '钱七' }] });
  expect(res.status).toBe(400);
  expect(res.body.error).toBe('NO_SEATS_AVAILABLE');
  // Expect server to include friendly message; current skeleton returns only error code
  expect(res.body.message).toBe('座位不足或不可用');
});

