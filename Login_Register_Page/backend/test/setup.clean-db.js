// 测试环境配置
process.env.NODE_ENV = 'test';
process.env.OTP_DEV_LOG = '0';

const db = require('../src/db');

// 确保每个测试用例都从干净的数据库状态开始
beforeEach(async () => {
  if (typeof db.__resetForTests === 'function') {
    await db.__resetForTests();
  }
});

// 还原每个用例中设置的 spy/mock，避免相互污染
afterEach(() => {
  jest.restoreAllMocks();
});
