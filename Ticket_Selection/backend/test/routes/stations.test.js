const request = require('supertest');
const express = require('express');
const stationsRouter = require('../../src/routes/stations');

const app = express();
app.use(stationsRouter);

// @InterfaceID: API-GET-QueryStations
// @AcceptanceCriteria: #1
test('should return 200 OK and a list of stations for a valid keyword', async () => {
  const response = await request(app).get('/api/stations?keyword=bj');
  expect(response.status).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);
});