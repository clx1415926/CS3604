const request = require('supertest');
const { app } = require('../src/server');

describe('12306 密码管理 API', () => {
  let loginSessionId;

  test('手机找回：请求验证码成功', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .send({ phone_number: '13900001111', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('sent');
    expect(res.body.ttl_minutes).toBe(5);
  });

  test('手机找回：身份证不匹配', async () => {
    const res = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-dev-id-mismatch', '1')
      .send({ phone_number: '13900001111', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(res.status).toBe(422);
    expect(res.body.error).toBe('PHONE_ID_MISMATCH');
  });

  test('手机验证码：错误与过期', async () => {
    const wrong = await request(app)
      .post('/api/v1/auth/password/phone/verify')
      .send({ phone_number: '13900001111', code: '654321' });
    expect(wrong.status).toBe(400);
    expect(wrong.body.error).toBe('SMS_CODE_MISMATCH');

    const expired = await request(app)
      .post('/api/v1/auth/password/phone/verify')
      .set('x-dev-expired', '1')
      .send({ phone_number: '13900001111', code: '123456' });
    expect(expired.status).toBe(400);
    expect(expired.body.error).toBe('SMS_CODE_EXPIRED');
  });

  test('手机验证码：验证成功获得重置令牌并重置密码', async () => {
    const ver = await request(app)
      .post('/api/v1/auth/password/phone/verify')
      .send({ phone_number: '13900001111', code: '123456' });
    expect(ver.status).toBe(200);
    const token = ver.body.reset_token;
    expect(token).toBeTruthy();

    // 重置密码（重置场景允许下划线，无需特殊符号）
    const reset = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({ reset_token: token, new_password: 'Abc12345' });
    expect(reset.status).toBe(200);
    expect(reset.body.success).toBe(true);
  });

  test('邮箱找回：格式错误', async () => {
    const bad = await request(app)
      .post('/api/v1/auth/password/email/request')
      .send({ email: 'bad%mail', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(bad.status).toBe(400);
    expect(bad.body.error).toBe('EMAIL_INVALID_FORMAT');
  });

  test('邮箱找回：成功与速率限制', async () => {
    const ok1 = await request(app)
      .post('/api/v1/auth/password/email/request')
      .send({ email: 'reset2@example.com', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(ok1.status).toBe(200);
    expect(ok1.body.status).toBe('sent');

    const ok2 = await request(app)
      .post('/api/v1/auth/password/email/request')
      .send({ email: 'reset2@example.com', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(ok2.status).toBe(429);
    expect(ok2.body.error).toBe('EMAIL_TOO_FREQUENT');
  });

  test('手机找回：速率限制', async () => {
    const ok1 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .send({ phone_number: '13900002222', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(ok1.status).toBe(200);
    const ok2 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .send({ phone_number: '13900002222', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(ok2.status).toBe(429);
    expect(ok2.body.error).toBe('SMS_TOO_FREQUENT');
  });

  test('手机找回：身份证不匹配触发锁定（3次）', async () => {
    const r1 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-dev-id-mismatch', '1')
      .send({ phone_number: '13900003333', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(r1.status).toBe(422);
    expect(r1.body.error).toBe('PHONE_ID_MISMATCH');

    const r2 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-dev-id-mismatch', '1')
      .send({ phone_number: '13900003333', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(r2.status).toBe(422);
    expect(r2.body.error).toBe('PHONE_ID_MISMATCH');

    const r3 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-dev-id-mismatch', '1')
      .send({ phone_number: '13900003333', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(r3.status).toBe(403);
    expect(r3.body.error).toBe('RESET_LOCKED');

    // 锁定期间再次请求仍返回锁定
    const r4 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .send({ phone_number: '13900003333', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(r4.status).toBe(403);
    expect(r4.body.error).toBe('RESET_LOCKED');
  });

  test('手机验证码：重复使用提示', async () => {
    // 先发送与验证一次
    const req1 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .send({ phone_number: '13900005555', id_type: '居民身份证', id_number: '110101199001011234' });
    expect(req1.status).toBe(200);
    const ver1 = await request(app)
      .post('/api/v1/auth/password/phone/verify')
      .send({ phone_number: '13900005555', code: '123456' });
    expect(ver1.status).toBe(200);
    // 再次提交相同手机号与验证码，提示未发送（已作废）
    const ver2 = await request(app)
      .post('/api/v1/auth/password/phone/verify')
      .send({ phone_number: '13900005555', code: '123456' });
    expect(ver2.status).toBe(400);
    expect(ver2.body.error).toBe('SMS_NOT_SENT');
  });

  test('手机找回：每日上限10次', async () => {
    const phone = '13900006666';
    for (let i = 0; i < 10; i++) {
      const r = await request(app)
        .post('/api/v1/auth/password/phone/request')
        .set('x-simulate-time', new Date(Date.now() + i * 61 * 1000).toISOString())
        .send({ phone_number: phone, id_type: '居民身份证', id_number: '110101199001011234' });
      expect(r.status).toBe(200);
    }
    const r11 = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-simulate-time', new Date(Date.now() + 11 * 61 * 1000).toISOString())
      .send({ phone_number: phone, id_type: '居民身份证', id_number: '110101199001011234' });
    expect(r11.status).toBe(429);
    expect(r11.body.error).toBe('SMS_DAILY_LIMIT_REACHED');
  });

  test('人脸识别找回：二维码与状态切换/过期', async () => {
    const start = await request(app).get('/api/v1/auth/password/face/start');
    expect(start.status).toBe(200);
    const qid = start.body.qrcode_id;
    expect(qid).toBeTruthy();

    const s1 = await request(app)
      .get('/api/v1/auth/password/face/status')
      .query({ qrcode_id: qid });
    expect(s1.status).toBe(200);
    expect(s1.body.status).toBe('unscanned');

    const s2 = await request(app)
      .get(`/api/v1/auth/password/face/${qid}/status`)
      .set('x-dev-scan', '1');
    expect(s2.status).toBe(200);
    expect(s2.body.status).toBe('scanned');

    const s3 = await request(app)
      .get(`/api/v1/auth/password/face/${qid}/status`)
      .set('x-dev-confirm', '1');
    expect(s3.status).toBe(200);
    expect(s3.body.status).toBe('confirmed');

    const confirm = await request(app)
      .post('/api/v1/auth/password/face/confirm')
      .send({ qrcode_id: qid });
    expect(confirm.status).toBe(200);
    expect(confirm.body.reset_token).toBeTruthy();

    const expired = await request(app)
      .get(`/api/v1/auth/password/face/${qid}/status`)
      .set('x-dev-expired', '1');
    expect(expired.status).toBe(200);
    expect(expired.body.status).toBe('expired');
  });

  test('登录后修改密码：成功', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'testuser123', password: 'Password123!' });
    expect(login.status).toBe(200);
    loginSessionId = login.body.session_id;
    expect(loginSessionId).toBeTruthy();

    const change = await request(app)
      .post('/api/v1/auth/password/change')
      .set('Authorization', `Bearer ${loginSessionId}`)
      .send({ old_password: 'Password123!', new_password: 'NewPass_123!' });
    expect(change.status).toBe(200);
    expect(change.body.success).toBe(true);
  });

  test('登录后修改密码：旧密码错误与弱密码', async () => {
    const wrongOld = await request(app)
      .post('/api/v1/auth/password/change')
      .set('Authorization', `Bearer ${loginSessionId}`)
      .send({ old_password: 'Wrong_123', new_password: 'NewPass_123!' });
    expect(wrongOld.status).toBe(401);
    expect(wrongOld.body.error).toBe('INVALID_CREDENTIALS');

    const weakNew = await request(app)
      .post('/api/v1/auth/password/change')
      .set('Authorization', `Bearer ${loginSessionId}`)
      .send({ old_password: 'Password123!', new_password: 'Abc12345' });
    expect(weakNew.status).toBe(400);
    expect(weakNew.body.error).toBe('NEW_PASSWORD_WEAK');
  });

  test('登录后修改密码：会话缺失与维护窗口', async () => {
    const noSession = await request(app)
      .post('/api/v1/auth/password/change')
      .send({ old_password: 'Password123!', new_password: 'NewPass_123!' });
    expect(noSession.status).toBe(401);
    expect(noSession.body.error).toBe('SESSION_EXPIRED');

    const maint = await request(app)
      .post('/api/v1/auth/password/reset')
      .set('x-simulate-maintenance', '1')
      .send({ reset_token: 'dummy', new_password: 'Abc12345' });
    expect(maint.status).toBe(503);
    expect(maint.body.error).toBe('MAINTENANCE_WINDOW');
  });
});