const request = require('supertest');
const { app } = require('../src/server');
const db = require('../src/db');

// Mock the db module
jest.mock('../src/db', () => ({
  findByUsername: jest.fn(),
  findByPhone: jest.fn(),
  updateUser: jest.fn(),
}));

describe('12306 忘记密码 API', () => {
  const mockUser = {
    user_id: 'u-test-123',
    username: 'testuser',
    phone_country_code: '+86',
    phone_number: '13800138000',
    password_hash: 'hashed_password',
    password_salt: 'salt',
  };

  beforeEach(() => {
    // Reset mocks before each test
    db.findByUsername.mockReset();
    db.findByPhone.mockReset();
    db.updateUser.mockReset();
  });

  describe('POST /api/v1/auth/password/phone/request', () => {
    test('应该在提供有效用户名和手机号时发送验证码', async () => {
      db.findByUsername.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/password/phone/request')
        .send({
          username: 'testuser',
          phone_country_code: '+86',
          phone_number: '13800138000',
        });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('sent');
      expect(res.body.countdown_seconds).toBe(60);
    });

    test('如果用户不存在，应该返回 404', async () => {
      db.findByUsername.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/v1/auth/password/phone/request')
        .send({
          username: 'nonexistent',
          phone_country_code: '+86',
          phone_number: '13800138000',
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('USER_NOT_FOUND');
    });

    test('如果手机号与用户名不匹配，应该返回 404', async () => {
      db.findByUsername.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/password/phone/request')
        .send({
          username: 'testuser',
          phone_country_code: '+86',
          phone_number: '13900139000', // Different phone number
        });

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('USER_NOT_FOUND');
    });

    test('对于无效的手机号格式，应该返回 400', async () => {
        const res = await request(app)
          .post('/api/v1/auth/password/phone/request')
          .send({
            username: 'testuser',
            phone_country_code: '+86',
            phone_number: '123', // Invalid number
          });
  
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('PHONE_INVALID');
    });
  });

  describe('POST /api/v1/auth/password/phone/verify', () => {
    let verificationRequest;

    beforeEach(async () => {
      db.findByUsername.mockResolvedValue(mockUser);
      // First, request a code to be able to test verification
      verificationRequest = await request(app)
        .post('/api/v1/auth/password/phone/request')
        .send({
          username: 'testuser',
          phone_country_code: '+86',
          phone_number: '13800138000',
        });
      expect(verificationRequest.status).toBe(200);
    });

    test('应该在验证码正确时返回 reset_token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/password/phone/verify')
        .send({
          phone_country_code: '+86',
          phone_number: '13800138000',
          code: '123456', // Assuming dev code is '123456'
        });

      expect(res.status).toBe(200);
      expect(res.body.verified).toBe(true);
      expect(res.body.reset_token).toMatch(/^rst-ph-/);
    });

    test('如果验证码不正确，应该返回 400', async () => {
      const res = await request(app)
        .post('/api/v1/auth/password/phone/verify')
        .send({
          phone_country_code: '+86',
          phone_number: '13800138000',
          code: '000000', // Wrong code
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('SMS_CODE_MISMATCH');
    });
  });

  describe('POST /api/v1/auth/password/reset', () => {
    let resetToken;

    beforeEach(async () => {
      db.findByUsername.mockResolvedValue(mockUser);
      await request(app)
        .post('/api/v1/auth/password/phone/request')
        .send({ username: 'testuser', phone_country_code: '+86', phone_number: '13800138000' });

      const verifyRes = await request(app)
        .post('/api/v1/auth/password/phone/verify')
        .send({ phone_country_code: '+86', phone_number: '13800138000', code: '123456' });
      
      resetToken = verifyRes.body.reset_token;
    });

    test('应该在 token 有效时成功重置密码', async () => {
      db.findByPhone.mockResolvedValue(mockUser);
      db.updateUser.mockResolvedValue({ success: true });

      const res = await request(app)
        .post('/api/v1/auth/password/reset')
        .send({
          reset_token: resetToken,
          new_password: 'NewPassword123_',
        });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('密码重置成功');
      // Verify that updateUser was called correctly
      expect(db.updateUser).toHaveBeenCalledWith(mockUser.user_id, expect.any(Object));
    });

    test('如果 reset_token 无效，应该返回 400', async () => {
        const res = await request(app)
          .post('/api/v1/auth/password/reset')
          .send({
            reset_token: 'invalid-token',
            new_password: 'NewPassword123_',
          });
  
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('RESET_TOKEN_INVALID');
      });

      test('如果新密码太弱，应该返回 400', async () => {
        const res = await request(app)
          .post('/api/v1/auth/password/reset')
          .send({
            reset_token: resetToken,
            new_password: '123', // Weak password
          });
  
        expect(res.status).toBe(400);
        expect(res.body.error).toBe('PASSWORD_LENGTH_SHORT');
      });
  });
});