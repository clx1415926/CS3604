const request = require('supertest');
const express = require('express');
const ticketsRouter = require('../../src/routes/tickets');

const app = express();
app.use(ticketsRouter);

// @InterfaceID: API-GET-QueryTickets
// @AcceptanceCriteria: #1
test('should return 200 OK and train data for valid query parameters', async () => {
  const response = await request(app).get('/api/tickets?fromStation=BJP&toStation=SHH&departDate=2025-11-11');
  expect(response.status).toBe(200);
  expect(response.body).toHaveProperty('trains');
  expect(response.body).toHaveProperty('stations');
});

// @InterfaceID: API-GET-QueryTickets
// @AcceptanceCriteria: #2
test('should return 400 Bad Request when required parameters are missing', async () => {
  const response = await request(app).get('/api/tickets');
  expect(response.status).toBe(400);
});