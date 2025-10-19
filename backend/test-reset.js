const request = require('supertest');
const app = require('./src/app');

async function testResetPassword() {
  console.log('开始测试重置密码API...');
  
  try {
    // 0. 先发送注册验证码
    console.log('0. 发送注册验证码...');
    const sendRegisterCodeResponse = await request(app)
      .post('/api/auth/send-code')
      .send({
        phoneNumber: '13800138000',
        type: 'register'
      });
    
    console.log('发送注册验证码响应状态:', sendRegisterCodeResponse.status);
    
    // 等待一下让验证码生成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 1. 注册用户 - 使用实际生成的验证码
    console.log('1. 注册用户...');
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        phoneNumber: '13800138000',
        email: 'test@example.com',
        verificationCode: '123456', // 模拟验证码，实际应该从控制台获取
        password: 'OldPassword123!',
        realName: '张三',
        idCard: '110101199001011234'
      });
    
    console.log('注册响应状态:', registerResponse.status);
    console.log('注册响应内容:', registerResponse.body);
    
    if (registerResponse.status !== 201) {
      console.log('注册失败，跳过后续测试');
      return;
    }
    
    // 2. 发送重置密码验证码
    console.log('2. 发送重置密码验证码...');
    const sendCodeResponse = await request(app)
      .post('/api/auth/send-code')
      .send({
        phoneNumber: '13800138000',
        type: 'reset-password'
      });
    
    console.log('发送验证码响应状态:', sendCodeResponse.status);
    console.log('发送验证码响应内容:', sendCodeResponse.body);
    
    // 等待一下让验证码生成
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // 3. 重置密码
    console.log('3. 重置密码...');
    const resetResponse = await request(app)
      .post('/api/auth/reset-password')
      .send({
        phoneNumber: '13800138000',
        verificationCode: '123456', // 模拟验证码
        newPassword: 'NewPassword123!'
      });
    
    console.log('重置密码响应状态:', resetResponse.status);
    console.log('重置密码响应内容:', resetResponse.body);
    
  } catch (error) {
    console.error('测试过程中出错:', error);
  }
  
  console.log('测试完成');
  process.exit(0);
}

testResetPassword();