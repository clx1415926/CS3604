const request = require('supertest');
const app = require('./src/app');

async function testResetPassword() {
  try {
    console.log('开始测试重置密码流程...');
    
    const phoneNumber = '13800138002';
    
    // 1. 发送注册验证码
    console.log('1. 发送注册验证码...');
    const regCodeResponse = await request(app)
      .post('/api/auth/send-code')
      .send({
        phoneNumber,
        type: 'register'
      });
    console.log('注册验证码响应:', regCodeResponse.status, regCodeResponse.body);
    
    // 2. 注册用户
    console.log('2. 注册用户...');
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        phoneNumber,
        email: 'test2@example.com',
        verificationCode: '123456',
        password: 'OldPassword123!',
        realName: '张三',
        idCard: '110101199001011234'
      });
    console.log('注册响应:', registerResponse.status, registerResponse.body);
    
    if (registerResponse.status !== 201) {
      console.log('注册失败，跳过后续测试');
      return;
    }
    
    // 3. 发送重置密码验证码
    console.log('3. 发送重置密码验证码...');
    const resetCodeResponse = await request(app)
      .post('/api/auth/send-code')
      .send({
        phoneNumber,
        type: 'reset-password'
      });
    console.log('重置验证码响应:', resetCodeResponse.status, resetCodeResponse.body);
    
    // 4. 重置密码
    console.log('4. 重置密码...');
    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        phoneNumber,
        verificationCode: '123456',
        newPassword: 'NewPassword123!'
      });
    console.log('重置密码响应:', resetResponse.status, resetResponse.body);
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 设置测试环境
process.env.NODE_ENV = 'test';
testResetPassword();