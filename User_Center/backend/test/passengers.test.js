const fs = require('fs');
const path = require('path');
const request = require('supertest');

const dataFilePath = path.join(__dirname, '../src/db/data.json');

function seedData(passengerCount = 1) {
  const basePassengers = [
    {
      passenger_id: '1',
      user_id: 'u-super',
      name: '张三',
      id_type: '居民身份证',
      id_number: '430112199912345014',
      phone_country_code: '+86',
      phone_number: '13800000000',
      traveler_type: '成人',
      verified_status: '已通过',
      is_self: true,
      protected_flag: 1,
      created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    },
  ];

  const extra = [];
  for (let i = 0; i < Math.max(0, passengerCount - 1); i += 1) {
    extra.push({
      passenger_id: String(100 + i),
      user_id: 'u-super',
      name: `李${i}`,
      id_type: '居民身份证',
      id_number: `11010119900101${String(1000 + i).slice(-4)}`,
      phone_country_code: '+86',
      phone_number: `1390000${String(1000 + i).slice(-4)}`,
      traveler_type: '成人',
      verified_status: '已通过',
      is_self: false,
      created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    });
  }

  const state = {
    user: {
      user_id: 'u-super',
      username: 'superadmin',
      name: '系统管理员',
      country_region: '中国China',
      id_type: '居民身份证',
      id_number: '110101199001011234',
      id_verified_status: 'success',
      phone_country_code: '+86',
      phone_number: '13900000000',
      phone_verified_status: 'success',
      email: 'superadmin@example.com',
      email_verified_status: 'success',
      traveler_type: '成人',
      created_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
      updated_at: new Date('2024-01-01T00:00:00.000Z').toISOString(),
    },
    availability: {
      '+86|13900000000': true,
    },
    passengers: basePassengers.concat(extra),
  };
  fs.writeFileSync(dataFilePath, JSON.stringify(state, null, 2), 'utf8');
}

function newApi() {
  jest.resetModules();
  const { createServer } = require('../src/server');
  return request(createServer());
}

describe('Feature: Passenger management', () => {
  let original;

  beforeAll(() => {
    original = fs.readFileSync(dataFilePath, 'utf8');
  });

  beforeEach(() => {
    seedData(1);
  });

  afterAll(() => {
    fs.writeFileSync(dataFilePath, original, 'utf8');
  });

  test('should require authorization for passenger list', async () => {
    const api = newApi();
    const r = await api
      .get('/api/v1/passengers')
      .set('x-test-rate-limit-bypass', '1')
      .expect(401);
    expect(r.body.error).toBe('UNAUTHORIZED');
  });

  test('should list passengers with masked id and phone by default', async () => {
    const api = newApi();
    const r = await api
      .get('/api/v1/passengers')
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .expect(200);

    expect(Array.isArray(r.body.passengers)).toBe(true);
    expect(r.body.passengers.length).toBeGreaterThan(0);
    const p = r.body.passengers[0];
    expect(String(p.id_number)).toMatch(/^\d{4}\*+\d{3}$/);
    expect(String(p.phone_number)).toMatch(/^\(\+\d+\)\s\d{3}\*{4}\d{4}$/);
  });

  test('should add passenger with validation and return masked fields', async () => {
    const api = newApi();
    const payload = {
      name: '李四',
      id_type: '居民身份证',
      id_number: '110101199001011234',
      phone_country_code: '+86',
      phone_number: '13912345678',
      traveler_type: '成人',
    };
    const r = await api
      .post('/api/v1/passengers')
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .send(payload)
      .expect(201);

    expect(r.body).toHaveProperty('passenger_id');
    expect(r.body.id_number).toMatch(/^\d{4}\*+\d{3}$/);
    expect(r.body.phone_number).toMatch(/^\(\+\d+\)\s\d{3}\*{4}\d{4}$/);
  });

  test('should reject missing fields when adding passenger', async () => {
    const api = newApi();
    const r = await api
      .post('/api/v1/passengers')
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .send({ traveler_type: '成人' })
      .expect(400);

    expect(String(r.body.error)).toMatch(/^MISSING_/);
  });

  test('should reject invalid traveler type when adding passenger', async () => {
    const api = newApi();
    const r = await api
      .post('/api/v1/passengers')
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .send({
        name: '李四',
        id_type: '居民身份证',
        id_number: '110101199001011234',
        phone_country_code: '+86',
        phone_number: '13912345678',
        traveler_type: '老人',
      })
      .expect(400);
    expect(r.body.error).toBe('INVALID_TRAVELER_TYPE');
  });

  test('should reject invalid id number format when adding passenger', async () => {
    const api = newApi();
    const r = await api
      .post('/api/v1/passengers')
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .send({
        name: '李四',
        id_type: '居民身份证',
        id_number: '123',
        phone_country_code: '+86',
        phone_number: '13912345678',
        traveler_type: '成人',
      })
      .expect(400);
    expect(r.body.error).toBe('INVALID_ID_NUMBER_FORMAT');
  });

  test('should support name query filter', async () => {
    seedData(3);
    const api = newApi();
    const r = await api
      .get(`/api/v1/passengers?name=${encodeURIComponent('李1')}`)
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .expect(200);

    expect(r.body.passengers.length).toBe(1);
    expect(r.body.passengers[0].name).toBe('李1');
  });

  test('should not allow deleting self passenger', async () => {
    const api = newApi();
    const r = await api
      .delete('/api/v1/passengers/1')
      .set('Authorization', 'Bearer sess-super-12306')
      .set('x-test-rate-limit-bypass', '1')
      .expect(403);

    expect(r.body.error).toBe('CANNOT_DELETE_SELF');
  });
});
