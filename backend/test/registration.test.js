const request = require('supertest');
const { app } = require('../src/server');

describe('12306 用户注册 API', () => {
  let sessionId;

  test('用户名检查：可用', async () => {
    const res = await request(app).get('/api/v1/users/username/check').query({ username: 'testuser123' });
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  test('用户名检查：格式错误', async () => {
    const res = await request(app).get('/api/v1/users/username/check').query({ username: '1abc' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('USERNAME_INVALID_FORMAT');
  });

  test('手机号检查：可用', async () => {
    const res = await request(app)
      .get('/api/v1/users/phone/check')
      .query({ phone_country_code: '+86', phone_number: '13812345678' });
    expect(res.status).toBe(200);
    expect(res.body.available).toBe(true);
  });

  test('手机号检查：格式错误', async () => {
    const res = await request(app)
      .get('/api/v1/users/phone/check')
      .query({ phone_country_code: '+86', phone_number: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('PHONE_INVALID');
  });

  test('创建注册会话', async () => {
    const res = await request(app).post('/api/v1/registration/sessions').send({});
    expect(res.status).toBe(201);
    expect(res.body.session_id).toBeTruthy();
    expect(res.body.progress).toBeTruthy();
    sessionId = res.body.session_id;
  });

  test('提交账户信息：成功', async () => {
    const res = await request(app)
      .patch(`/api/v1/registration/sessions/${sessionId}/account`)
      .send({
        username: 'testuser123',
        password: 'MyPass_123',
        name: '张三',
        id_type: '居民身份证',
        id_number: '110101199001011234',
        phone_country_code: '+86',
        phone_number: '13812345678',
        email: 'test@example.com',
        traveler_type: '成人'
      });
    expect(res.status).toBe(200);
    expect(res.body.account_info_completed).toBe(true);
  });

  test('发送短信验证码：成功', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/sms/send`)
      .send({ phone_country_code: '+86', phone_number: '13812345678' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('sent');
  });

  test('发送短信验证码：过于频繁', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/sms/send`)
      .send({ phone_country_code: '+86', phone_number: '13812345678' });
    expect(res.status).toBe(429);
    expect(res.body.error).toBe('SMS_TOO_FREQUENT');
  });

  test('验证短信：错误码', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/sms/verify`)
      .send({ code: '654321' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('SMS_CODE_MISMATCH');
  });

  test('验证短信：成功', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/sms/verify`)
      .send({ code: '123456' });
    expect(res.status).toBe(200);
    expect(res.body.phone_verified).toBe(true);
  });

  test('身份核验：成功', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/identity/verify`)
      .send({ id_type: '居民身份证', id_number: '110101199001011234', name: '张三' });
    expect(res.status).toBe(200);
    expect(res.body.identity_verified).toBe(true);
  });

  test('条款确认：成功', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/terms`)
      .send({ terms_version: 'v2025.11_服务条款', privacy_version: 'v2025.11_隐私权政策', accepted: true });
    expect(res.status).toBe(200);
    expect(res.body.terms_accepted).toBe(true);
  });

  test('完成注册：成功', async () => {
    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/complete`)
      .send({});
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('active');
  });
});