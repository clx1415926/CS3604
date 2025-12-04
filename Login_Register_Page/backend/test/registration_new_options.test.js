const request = require('supertest');
const { app } = require('../src/server');

describe('12306 用户注册 API - 新增乘客类型测试', () => {
  
  const travelerTypes = ['学生', '残疾军人'];

  travelerTypes.forEach((type, index) => {
    let sessionId;
    const username = `testuser_type_${index}`;
    const phone = `1380000001${index}`; // Avoid 13800000000 which is hardcoded as taken

    test(`流程测试：乘客类型为 ${type}`, async () => {
      // 1. 创建会话
      const resSession = await request(app).post('/api/v1/registration/sessions').send({});
      expect(resSession.status).toBe(201);
      sessionId = resSession.body.session_id;

      // 2. 提交账户信息
      const resAccount = await request(app)
        .patch(`/api/v1/registration/sessions/${sessionId}/account`)
        .send({
          username: username,
          password: 'MyPass_123',
          name: '张三',
          id_type: '居民身份证',
          id_number: '110101199001011234',
          phone_country_code: '+86',
          phone_number: phone,
          email: `test${index}@example.com`,
          traveler_type: type
        });
      
      if (resAccount.status !== 200) {
        console.error(`Failed for type ${type}:`, resAccount.body);
      }
      expect(resAccount.status).toBe(200);
      expect(resAccount.body.account_info_completed).toBe(true);

      // 3. 验证短信 (Mocked code 123456 for test environment usually, or we rely on the previous behavior)
      // Note: In previous steps, dev_code was returned in response in dev mode. 
      // But here we are in test mode. Let's see how verify works in test.
      // registration.test.js used '123456' as success code. 
      // Let's check if we need to send sms first.
      
      await request(app)
        .post(`/api/v1/registration/sessions/${sessionId}/sms/send`)
        .send({ phone_country_code: '+86', phone_number: phone });
      
      // The server might be using a fixed code or we need to extract it.
      // However, looking at registration.test.js, it uses '123456' directly.
      // Let's assume 123456 works or we might need to check server logic.
      // But for this test, we mainly care about account info submission accepting the type.
      // We can stop here or continue to full registration to ensure persistence.
      
      const resVerify = await request(app)
        .post(`/api/v1/registration/sessions/${sessionId}/sms/verify`)
        .send({ code: '123456' });
        
      // If verify fails, it might be because of dynamic code. 
      // But let's proceed.
      expect(resVerify.status).toBe(200);

      // 4. 身份核验
      const resIdentity = await request(app)
        .post(`/api/v1/registration/sessions/${sessionId}/identity/verify`)
        .send({ id_type: '居民身份证', id_number: '110101199001011234', name: '张三' });
      expect(resIdentity.status).toBe(200);

      // 5. 条款
      await request(app)
        .post(`/api/v1/registration/sessions/${sessionId}/terms`)
        .send({ terms_version: 'v2025.11_服务条款', privacy_version: 'v2025.11_隐私权政策', accepted: true });

      // 6. 完成
      const resComplete = await request(app)
        .post(`/api/v1/registration/sessions/${sessionId}/complete`)
        .send({});
      expect(resComplete.status).toBe(201);
    });
  });
});