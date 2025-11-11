const fs = require('fs');
const path = require('path');

// 清理测试数据库，避免状态残留影响用例
const dbPath = path.resolve(__dirname, '../data/accounts.db');
try {
  if (fs.existsSync(dbPath)) {
    fs.unlinkSync(dbPath);
    // 确保数据目录存在，nedb 会自动创建文件
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  }
} catch (e) {
  // 允许忽略异常，确保不影响测试流程
}