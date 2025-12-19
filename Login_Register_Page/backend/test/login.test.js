const request = require('supertest');
const crypto = require('crypto');
const { app } = require('../src/server');

describe('Feature: Login and 2FA', () => {
  // 运维窗口/维护模式：应阻断所有登录请求
  test('should block login during maintenance window', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .set('x-simulate-maintenance', '1')
      .send({ identifier: 'testuser123', password: 'Password123!' })
      .expect(503);

    expect(res.body.error).toBe('MAINTENANCE_WINDOW');
  });

  // 防暴力破解：连续输错多次后，账号应被临时锁定
  test('should lock account after 5 consecutive failed logins', async () => {
    const identifier = 'testuser123';

    // 连续 4 次错误：应仍返回“账号密码错误”
    for (let i = 0; i < 4; i += 1) {
      const r = await request(app)
        .post('/api/v1/auth/login')
        .send({ identifier, password: 'WrongPassword123!' });
      expect(r.status).toBe(401);
      expect(r.body.error).toBe('INVALID_CREDENTIALS');
    }

    // 第 5 次错误：应触发账号锁定
    const locked = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier, password: 'WrongPassword123!' })
      .expect(403);
    expect(locked.body.error).toBe('ACCOUNT_LOCKED');

    // 锁定窗口内：即使密码正确也应拒绝登录
    const stillLocked = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier, password: 'Password123!' })
      .expect(403);
    expect(stillLocked.body.error).toBe('ACCOUNT_LOCKED');

    // 锁定时间结束后：应恢复登录，并进入 2FA
    const originalNow = Date.now();
    jest.spyOn(Date, 'now').mockImplementation(() => originalNow + 31 * 60 * 1000);

    const okAfter = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier, password: 'Password123!' })
      .expect(200);

    expect(okAfter.body.need_sms_verification).toBe(true);
    expect(typeof okAfter.body.flow_id).toBe('string');
  });

  // 快乐路径：账号密码登录 -> 证件后四位校验 -> 短信验证码校验 -> 建立会话
  test('should complete login after successful 2FA', async () => {
    // 第 1 步：登录成功但需要 2FA，返回 flow_id
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier_type: 'phone', identifier: '13812345678', password: 'Password123!' })
      .expect(200);

    expect(login.body.need_sms_verification).toBe(true);
    const flowId = login.body.flow_id;

    // 第 2 步：提交证件后四位哈希，触发短信验证码发送
    const hash = crypto.createHash('sha256').update('1234').digest('hex');
    const idCheck = await request(app)
      .post('/api/v1/auth/login/2fa/id-check')
      .set('x-dev-debug', '1')
      .send({ flow_id: flowId, id_last4_hash: hash })
      .expect(200);

    expect(idCheck.body.sent).toBe(true);
    expect(/^[0-9]{6}$/.test(idCheck.body.dev_code)).toBe(true);

    // 第 3 步：校验短信验证码，拿到 session_id
    const verify = await request(app)
      .post('/api/v1/auth/login/2fa/verify')
      .send({ flow_id: flowId, code: idCheck.body.dev_code })
      .expect(200);

    expect(typeof verify.body.session_id).toBe('string');
    expect(verify.body.message).toBe('登录成功');
  });

  // 防滥用：证件后四位连续输错后，应锁定 2FA 流程
  test('should lock 2FA flow after 3 failed ID last4 checks', async () => {
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier_type: 'phone', identifier: '13812345678', password: 'Password123!' })
      .expect(200);
    const flowId = login.body.flow_id;

    // 前两次输错：应返回明确的校验错误
    for (let i = 0; i < 2; i += 1) {
      const r = await request(app)
        .post('/api/v1/auth/login/2fa/id-check')
        .send({ flow_id: flowId, id_last4: '0000' });
      expect(r.status).toBe(400);
      expect(r.body.error).toBe('ID_LAST4_MISMATCH');
    }

    // 第三次输错：应触发锁定
    const locked = await request(app)
      .post('/api/v1/auth/login/2fa/id-check')
      .send({ flow_id: flowId, id_last4: '0000' })
      .expect(403);
    expect(locked.body.error).toBe('ACCOUNT_LOCKED');
  });
});
