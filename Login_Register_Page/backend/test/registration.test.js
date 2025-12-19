const request = require('supertest');
const { app } = require('../src/server');

describe('Feature: Registration flow', () => {
  // 新建注册会话：所有进度标记应初始化为 false
  test('should create a registration session with empty progress', async () => {
    const res = await request(app)
      .post('/api/v1/registration/sessions')
      .send({})
      .expect(201);

    expect(typeof res.body.session_id).toBe('string');
    expect(res.body.progress).toEqual({
      account_info_completed: false,
      phone_verified: false,
      identity_verified: false,
      terms_accepted: false,
    });
  });

  // 服务端校验：用户名格式不符合规则时应拒绝
  test('should reject account submission with invalid username format', async () => {
    const s = await request(app).post('/api/v1/registration/sessions').send({}).expect(201);
    const sessionId = s.body.session_id;

    const res = await request(app)
      .patch(`/api/v1/registration/sessions/${sessionId}/account`)
      .send({
        username: '1bad',
        password: 'Abcd1234_',
        name: '张三',
        id_type: '居民身份证',
        id_number: '110101199001011234',
        phone_country_code: '+86',
        phone_number: '13811112222',
        email: 'u@example.com',
        traveler_type: '成人',
      })
      .expect(400);

    expect(res.body.error).toBe('USERNAME_INVALID_FORMAT');
  });

  // 服务端校验：密码包含不允许字符时应拒绝
  test('should reject password containing special characters', async () => {
    const s = await request(app).post('/api/v1/registration/sessions').send({}).expect(201);
    const sessionId = s.body.session_id;

    // WARNING: Implementation diverges from requirement doc
    const res = await request(app)
      .patch(`/api/v1/registration/sessions/${sessionId}/account`)
      .send({
        username: 'newuser01',
        password: 'Password123!',
        name: '张三',
        id_type: '居民身份证',
        id_number: '110101199001011234',
        phone_country_code: '+86',
        phone_number: '13811112222',
        email: 'u@example.com',
        traveler_type: '成人',
      })
      .expect(400);

    expect(res.body.error).toBe('PASSWORD_ILLEGAL_CHAR');
  });

  // 快乐路径：提交账号信息 -> 手机短信校验 -> 身份核验 -> 条款确认 -> 完成注册
  test('should complete registration after all required steps', async () => {
    const s = await request(app).post('/api/v1/registration/sessions').send({}).expect(201);
    const sessionId = s.body.session_id;

    // 第 1 步：提交账号与基础信息
    await request(app)
      .patch(`/api/v1/registration/sessions/${sessionId}/account`)
      .send({
        username: 'newuser01',
        password: 'Abcd1234_',
        name: '张三',
        id_type: '居民身份证',
        id_number: '110101199001011234',
        phone_country_code: '+86',
        phone_number: '13811112222',
        email: 'u@example.com',
        traveler_type: '成人',
      })
      .expect(200);

    // 第 2 步：请求短信验证码（用于手机号校验）
    await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/sms/send`)
      .send({ phone_country_code: '+86', phone_number: '13811112222' })
      .expect(200);

    // 第 3 步：提交短信验证码完成手机号校验
    await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/sms/verify`)
      .send({ code: '123456' })
      .expect(200);

    // 第 4 步（异常分支）：身份核验不匹配应被拒绝
    const mismatch = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/identity/verify`)
      .set('x-dev-force-mismatch', '1')
      .send({ id_type: '居民身份证', id_number: '110101199001011234', name: '张三' })
      .expect(422);
    expect(mismatch.body.error).toBe('ID_NAME_MISMATCH');

    // 第 4 步（正常分支）：身份核验匹配应通过
    await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/identity/verify`)
      .send({ id_type: '居民身份证', id_number: '110101199001011234', name: '张三' })
      .expect(200);

    // 第 5 步：确认同意服务条款与隐私政策版本
    await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/terms`)
      .send({ terms_version: 'v1', privacy_version: 'v1', accepted: true })
      .expect(200);

    // 第 6 步：完成注册应创建用户
    const complete = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/complete`)
      .send({})
      .expect(201);

    expect(typeof complete.body.user_id).toBe('string');
    expect(complete.body.username).toBe('newuser01');
    expect(complete.body.status).toBe('active');

    // 结果校验：注册完成后用户名应不再可用
    const chk = await request(app)
      .get('/api/v1/users/username/check')
      .query({ username: 'newuser01' })
      .expect(200);
    expect(chk.body.available).toBe(false);
  });

  // 兜底校验：缺少必需步骤时不允许完成注册
  test('should reject registration completion when required steps are missing', async () => {
    const s = await request(app).post('/api/v1/registration/sessions').send({}).expect(201);
    const sessionId = s.body.session_id;

    const res = await request(app)
      .post(`/api/v1/registration/sessions/${sessionId}/complete`)
      .send({})
      .expect(400);

    expect(res.body.error).toBe('MISSING_REQUIRED_STEPS');
    expect(res.body.details.required).toEqual(expect.arrayContaining([
      'account_info_completed',
      'phone_verified',
      'identity_verified',
      'terms_accepted',
    ]));
  });
});
