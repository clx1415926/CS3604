const request = require('supertest');
const { app } = require('../src/server');

describe('Feature: Password recovery', () => {
  // 防滥用：身份信息连续不匹配后，应锁定找回流程
  test('should lock password recovery after 3 consecutive ID mismatches', async () => {
    const payload = { phone_number: '13911112223', id_type: '居民身份证', id_number: '110101199001011234' };

    // 前两次不匹配：应返回明确的校验错误
    for (let i = 0; i < 2; i += 1) {
      const r = await request(app)
        .post('/api/v1/auth/password/phone/request')
        .set('x-dev-id-mismatch', '1')
        .send(payload)
        .expect(422);
      expect(r.body.error).toBe('PHONE_ID_MISMATCH');
    }

    // 第三次不匹配：应触发锁定
    const locked = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-dev-id-mismatch', '1')
      .send(payload)
      .expect(403);
    expect(locked.body.error).toBe('RESET_LOCKED');
  });

  // 频控：短时间内重复请求短信验证码应被拒绝
  test('should reject frequent password recovery SMS requests within 60 seconds', async () => {
    const payload = { phone_number: '13911112222', id_type: '居民身份证', id_number: '110101199001011234' };
    const now = new Date('2025-12-15T10:00:00.000Z').toISOString();

    // 第一次请求：应成功
    await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-simulate-time', now)
      .send(payload)
      .expect(200);

    // 同一时间第二次请求：应触发频控
    const tooSoon = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-simulate-time', now)
      .send(payload)
      .expect(429);

    expect(tooSoon.body.error).toBe('SMS_TOO_FREQUENT');
    expect(typeof tooSoon.body.retry_after).toBe('number');
  });

  // 快乐路径：请求验证码 -> 校验验证码 -> 使用 token 重置密码
  test('should reset password after phone verification', async () => {
    const phone_number = '13812345678';

    // 第 1 步：请求找回密码短信验证码
    const reqRes = await request(app)
      .post('/api/v1/auth/password/phone/request')
      .set('x-dev-debug', '1')
      .send({ phone_number, id_type: '居民身份证', id_number: '110101199001011234' })
      .expect(200);

    expect(reqRes.body.status).toBe('sent');

    // 第 2 步：校验短信验证码，获取 reset_token
    const verify = await request(app)
      .post('/api/v1/auth/password/phone/verify')
      .send({ phone_number, code: '123456' })
      .expect(200);

    expect(typeof verify.body.reset_token).toBe('string');
    const token = verify.body.reset_token;

    // 第 3 步：使用 reset_token 重置新密码
    const reset = await request(app)
      .post('/api/v1/auth/password/reset')
      .send({ reset_token: token, new_password: 'Abcd1234_' })
      .expect(200);

    expect(reset.body.success).toBe(true);
    expect(reset.body.message).toBe('密码重置成功');
  });

  // 人脸找回：启动二维码 -> 轮询确认 -> confirm 返回 reset_token
  test('should provide a face recovery reset token after confirmation', async () => {
    // 第 1 步：启动人脸找回并获取 qrcode_id
    const start = await request(app)
      .get('/api/v1/auth/password/face/start')
      .expect(200);

    expect(typeof start.body.qrcode_id).toBe('string');
    const id = start.body.qrcode_id;

    // 第 2 步：通过 status 接口模拟用户在手机端确认
    await request(app)
      .get(`/api/v1/auth/password/face/${id}/status`)
      .set('x-dev-confirm', '1')
      .expect(200);

    // 第 3 步：确认完成并拿到 reset_token
    const confirm = await request(app)
      .post('/api/v1/auth/password/face/confirm')
      .send({ qrcode_id: id })
      .expect(200);

    expect(typeof confirm.body.reset_token).toBe('string');
  });
});
