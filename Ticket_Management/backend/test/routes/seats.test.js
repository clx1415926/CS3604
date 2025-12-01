const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-GET-SeatMap
// @AcceptanceCriteria: #1
test('should return seat map with columns and window flags', async () => {
  const res = await request(app)
    .get('/api/v1/seats/map')
    .query({ train_id: 'G123', travel_date: '2025-11-17', seat_class: '二等座' });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('seats');
  const s = res.body.seats[0];
  expect(s).toHaveProperty('column');
  expect(['A', 'B', 'C', 'D', 'E', 'F']).toContain(s.column);
  expect(s).toHaveProperty('window');
  expect(s).toHaveProperty('occupied');
});

// @InterfaceID: API-POST-SeatLock
// @AcceptanceCriteria: #1
test('should lock seats and return lock tokens with expiry', async () => {
  const res = await request(app)
    .post('/api/v1/seats/lock')
    .send({ train_id: 'G123', travel_date: '2025-11-17', seats: [{ seat_class: '二等座', carriage_no: '10', seat_no: '16A', passenger_id: 'p-001' }] });
  expect(res.status).toBe(200);
  expect(res.body).toHaveProperty('locks');
  const l = res.body.locks[0];
  expect(l).toHaveProperty('lock_token');
  expect(l).toHaveProperty('expires_at');
});