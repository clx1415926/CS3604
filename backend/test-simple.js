const request = require('supertest');
const app = require('./src/app');
const User = require('./src/models/User');

async function testAPI() {
  try {
    console.log('开始测试API...');
    
    // 先创建验证码
    console.log('创建验证码...');
    const codeResult = await User.createVerificationCode('13800138000', 'register');
    console.log('生成的验证码:', codeResult.code);
    
    // 测试注册API
    console.log('测试注册API...');
    const registerData = {
      phoneNumber: '13800138000',
      email: 'test@example.com',
      verificationCode: codeResult.code,
      password: 'Password123!',
      realName: '张三',
      idCard: '110101199001011234'
    };
    
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(registerData);
    
    console.log('注册响应状态:', registerResponse.status);
    console.log('注册响应内容:', registerResponse.body);
    
    // 测试登录API
    console.log('\n测试登录API...');
    const loginData = {
      phoneNumber: '13800138000',
      password: 'Password123!'
    };
    
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send(loginData);
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应内容:', loginResponse.body);
    
    console.log('\nAPI测试完成');
    process.exit(0);
  } catch (error) {
    console.error('测试出错:', error);
    process.exit(1);
  }
}

testAPI();