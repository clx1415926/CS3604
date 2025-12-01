const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-GET-Contacts
// @AcceptanceCriteria: #1
test('should return contacts with required fields', async () => {
  const res = await request(app).get('/api/v1/contacts');
  expect(res.status).toBe(200);
  expect(Array.isArray(res.body.contacts)).toBe(true);
  const c = res.body.contacts[0];
  expect(c).toHaveProperty('name');
  expect(c).toHaveProperty('id_type');
  expect(c).toHaveProperty('masked_id_number');
  expect(c).toHaveProperty('verified');
});