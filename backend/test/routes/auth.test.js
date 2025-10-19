const request = require('supertest');
const app = require('../../src/app');
const User = require('../../src/models/User');

describe('Authentication API Tests', () => {
  // 在每个测试之前清理数据
  beforeEach(() => {
    User.users.clear();
    User.verificationCodes.clear();
    User.loginAttempts.clear();
    User.tokens.clear();
    User.dailyCodeCounts.clear();
  });
  
  // 在每个测试之后也清理数据，确保测试间不相互影响
  afterEach(() => {
    User.users.clear();
    User.verificationCodes.clear();
    User.loginAttempts.clear();
    User.tokens.clear();
    User.dailyCodeCounts.clear();
  });
  describe('POST /api/auth/register', () => {
    const validRegisterData = {
      phoneNumber: '13800138000',
      email: 'test@example.com',
      verificationCode: '123456',
      password: 'Password123!',
      realName: '张三',
      idCard: '110101199001011234'
    };

    it('应该在接收到合法且未注册的数据时返回201 Created', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138000',
          type: 'register'
        });
      
      const response = await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('message', '注册成功');
      expect(typeof response.body.userId).toBe('string');
    });

    it('应该在手机号已存在时返回409 Conflict', async () => {
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138000',
          type: 'register'
        });
      
      // 先注册一个用户
      await request(app)
        .post('/api/auth/register')
        .send(validRegisterData);

      // 再次使用相同手机号注册
        const response = await request(app)
          .post('/api/auth/register')
          .send(validRegisterData);

      expect(response.status).toBe(409);
      expect(response.body).toHaveProperty('error', '手机号或身份证号已存在');
    });

    it('应该在验证码验证失败时返回400 Bad Request', async () => {
      const invalidCodeData = {
        ...validRegisterData,
        verificationCode: '000000'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidCodeData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '输入信息格式错误或验证码无效');
    });

    it('应该在身份证号格式验证失败时返回422 Unprocessable Entity', async () => {
      const invalidIdCardData = {
        ...validRegisterData,
        idCard: '123456789'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidIdCardData);

      expect(response.status).toBe(422);
      expect(response.body).toHaveProperty('error', '身份证号格式不正确');
    });

    it('应该在缺少必填字段时返回400 Bad Request', async () => {
      const incompleteData = {
        phoneNumber: '13800138000',
        password: 'Password123!'
        // 缺少其他必填字段
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    const validLoginData = {
      account: '13800138000',
      password: 'Password123!'
    };

    beforeEach(async () => {
      // 确保有一个已注册的用户用于登录测试
      // 先发送验证码
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138000',
          type: 'register'
        });
      
      // 然后注册用户
      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138000',
          email: 'test@example.com',
          verificationCode: '123456',
          password: 'Password123!',
          realName: '张三',
          idCard: '110101199001011234'
        });
    });

    it('应该在登录成功时返回JWT token和用户基本信息', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send(validLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('userInfo');
      expect(typeof response.body.token).toBe('string');
      expect(typeof response.body.userId).toBe('string');
      expect(typeof response.body.userInfo).toBe('object');
    });

    it('应该在账号或密码错误时返回401 Unauthorized', async () => {
      const invalidLoginData = {
        account: '13800138000',
        password: 'WrongPassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', '账号或密码错误');
    });

    it('应该在密码错误超过5次后锁定账户30分钟', async () => {
      const invalidLoginData = {
        account: '13800138000',
        password: 'WrongPassword'
      };

      // 连续5次错误登录
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(invalidLoginData);
      }

      // 第6次应该返回423 Locked
      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidLoginData);

      expect(response.status).toBe(423);
      expect(response.body).toHaveProperty('error', '账户已被锁定，请稍后再试');
    });

    it('应该在验证码错误时返回400 Bad Request', async () => {
      // 先注册一个用户
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138005',
          type: 'register'
        });
      
      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138005',
          email: 'test5@example.com',
          verificationCode: '123456',
          password: 'Password123!',
          realName: '张三',
          idCard: '110101199001011235'
        });

      // 先进行5次错误登录以触发验证码要求
      const invalidLoginData = {
        account: '13800138005',
        password: 'wrongpassword'
      };

      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(invalidLoginData);
      }

      const loginDataWithCaptcha = {
        account: '13800138005',
        password: 'Password123!',
        captcha: 'wrongcaptcha'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginDataWithCaptcha);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '验证码错误');
    });

    it('应该支持邮箱登录', async () => {
      // 先注册一个用户
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138004',
          type: 'register'
        });
      
      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138004',
          email: 'test@example.com',
          verificationCode: '123456',
          password: 'Password123!',
          realName: '张三',
          idCard: '110101199001011234'
        });

      const emailLoginData = {
        account: 'test@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(emailLoginData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('userInfo');
    });
  });

  describe('POST /api/auth/send-code', () => {
    const validSendCodeData = {
      phoneNumber: '13800138000',
      type: 'register'
    };

    it('应该成功发送验证码并返回过期时间', async () => {
      const response = await request(app)
        .post('/api/auth/send-code')
        .send(validSendCodeData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '验证码发送成功');
    });

    it('应该在同一手机号1分钟内重复发送时返回429 Too Many Requests', async () => {
      const phoneNumber = '13800138001';
      
      // 第一次发送
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber,
          type: 'register'
        });

      // 立即再次发送
      const response = await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber,
          type: 'register'
        });

      expect(response.status).toBe(429);
      expect(response.body).toHaveProperty('error', '发送过于频繁，请稍后再试');
    });

    it('应该在手机号格式错误时返回400 Bad Request', async () => {
      const invalidPhoneData = {
        phoneNumber: '123',
        type: 'register'
      };

      const response = await request(app)
        .post('/api/auth/send-code')
        .send(invalidPhoneData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '手机号格式错误');
    });

    it('应该支持不同类型的验证码发送', async () => {
      const types = ['register', 'login', 'reset-password'];

      for (const type of types) {
        const response = await request(app)
          .post('/api/auth/send-code')
          .send({
            phoneNumber: `1380013800${Math.floor(Math.random() * 10)}`,
            type
          });

        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('message', '验证码发送成功');
      }
    });

    it('应该限制验证码发送频率', async () => {
      const phoneNumber = '13800138003'; // 使用不同的手机号避免冲突
      
      // 第一次发送应该成功
      const firstResponse = await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber,
          type: 'register'
        });
      
      expect(firstResponse.status).toBe(200);
      expect(firstResponse.body.message).toBe('验证码发送成功');
      
      // 立即再次发送应该被限制（1分钟间隔）
      const secondResponse = await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber,
          type: 'register'
        });
      
      expect(secondResponse.status).toBe(429);
      expect(secondResponse.body.error).toBe('发送过于频繁，请稍后再试');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    const validResetData = {
      phoneNumber: '13800138002',
      verificationCode: '123456',
      newPassword: 'NewPassword123!'
    };

    beforeEach(async () => {
      // 先发送注册验证码
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138002',
          type: 'register'
        });
      
      // 注册用户
      await request(app)
        .post('/api/auth/register')
        .send({
          phoneNumber: '13800138002',
          email: 'test2@example.com',
          verificationCode: '123456',
          password: 'OldPassword123!',
          realName: '张三',
          idCard: '110101199001011234'
        });

      // 发送重置密码验证码
      await request(app)
        .post('/api/auth/send-code')
        .send({
          phoneNumber: '13800138002',
          type: 'reset-password'
        });
    });

    it('应该在验证码验证通过后成功重置密码', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(validResetData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', '密码重置成功');
    });

    it('应该在验证码错误或已过期时返回400 Bad Request', async () => {
      const invalidCodeData = {
        ...validResetData,
        verificationCode: '000000'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(invalidCodeData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', '验证码错误或已过期');
    });

    it('应该在用户不存在时返回404 Not Found', async () => {
      const nonExistentUserData = {
        phoneNumber: '13800138999',
        verificationCode: '123456',
        newPassword: 'NewPassword123!'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(nonExistentUserData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', '用户不存在');
    });

    it('应该验证新密码符合安全要求', async () => {
      const weakPasswordData = {
        ...validResetData,
        newPassword: '123'
      };

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send(weakPasswordData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('应该在重置成功后清除所有登录token', async () => {
      // 先登录获取token
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          phoneNumber: '13800138002',
          password: 'OldPassword123!'
        });

      const token = loginResponse.body.token;

      // 重置密码
      await request(app)
        .post('/api/auth/reset-password')
        .send(validResetData);

      // 使用旧token访问受保护的资源应该失败
      const protectedResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(protectedResponse.status).toBe(401);
    });
  });
});