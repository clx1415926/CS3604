const request = require('supertest');
const { app } = require('../src/server');

describe('12306 用户登录 API', () => {
  let sessionId;

  test('图形验证码获取与验证', async () => {
    const resCap = await request(app).get('/api/v1/auth/captcha').query({ type: 'image' });
    expect(resCap.status).toBe(200);
    const captchaId = resCap.body.captcha_id;
    expect(captchaId).toBeTruthy();
    const resVer = await request(app).post('/api/v1/auth/captcha/verify').send({ captcha_id: captchaId, captcha_code: 'ABCD' });
    expect(resVer.status).toBe(200);
    expect(resVer.body.verified).toBe(true);
  });

  test('用户名密码登录成功', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'testuser123', password: 'Password123!', remember_me: true });
    expect(res.status).toBe(200);
    expect(res.body.session_id).toBeTruthy();
    sessionId = res.body.session_id;
    expect(res.body.remember_expires_at).toBeTruthy();
  });

  test('获取会话状态成功', async () => {
    const res = await request(app).get('/api/v1/auth/session').set('Authorization', `Bearer ${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.session_id).toBe(sessionId);
    expect(res.body.user_id).toBeTruthy();
  });

  test('非活跃超时会话过期', async () => {
    const res = await request(app)
      .get('/api/v1/auth/session')
      .set('Authorization', `Bearer ${sessionId}`)
      .set('x-nonactive-minutes', '31');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('SESSION_EXPIRED');
  });

  test('手机号密码登录成功', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: '13812345678', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.session_id).toBeTruthy();
  });

  test('邮箱密码登录成功', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'user@example.com', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.session_id).toBeTruthy();
  });

  test('错误密码导致失败', async () => {
    const res = await request(app).post('/api/v1/auth/login').send({ identifier: 'testuser123', password: 'Wrong_123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('INVALID_CREDENTIALS');
  });

  test('维护窗口禁止登录', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('x-simulate-maintenance', '1')
      .send({ identifier: 'testuser123', password: 'Password123!' });
    expect(res.status).toBe(503);
    expect(res.body.error).toBe('MAINTENANCE_WINDOW');
  });

  test('二维码登录流程（状态切换）', async () => {
    const gen = await request(app).get('/api/v1/auth/qrcode');
    expect(gen.status).toBe(200);
    const qid = gen.body.qrcode_id;
    expect(qid).toBeTruthy();
    const s1 = await request(app).get(`/api/v1/auth/qrcode/${qid}/status`);
    expect(s1.status).toBe(200);
    expect(s1.body.status).toBe('unscanned');
    const s2 = await request(app).get(`/api/v1/auth/qrcode/${qid}/status`).set('x-dev-scan', '1');
    expect(s2.status).toBe(200);
    expect(s2.body.status).toBe('scanned');
    const s3 = await request(app).get(`/api/v1/auth/qrcode/${qid}/status`).set('x-dev-confirm', '1');
    expect(s3.status).toBe(200);
    expect(s3.body.status).toBe('confirmed');
    expect(s3.body.session_id).toBeTruthy();
  });

  test('退出登录成功', async () => {
    const res = await request(app).post('/api/v1/auth/logout').set('Authorization', `Bearer ${sessionId}`);
    expect(res.status).toBe(204);
  });
});