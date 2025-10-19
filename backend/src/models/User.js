const bcrypt = require('bcryptjs');
const crypto = require('crypto');

class User {
  constructor() {
    // 模拟数据库存储
    this.users = new Map();
    this.verificationCodes = new Map();
    this.loginAttempts = new Map();
    this.tokens = new Set();
    this.dailyCodeCounts = new Map(); // 存储每日验证码发送次数
  }

  // 根据手机号查找用户
  async findByPhone(phoneNumber) {
    for (const [id, user] of this.users) {
      if (user.phoneNumber === phoneNumber) {
        return { id, ...user };
      }
    }
    return null;
  }

  // 根据邮箱查找用户
  async findByEmail(email) {
    for (const [id, user] of this.users) {
      if (user.email === email) {
        return { id, ...user };
      }
    }
    return null;
  }

  // 根据身份证号查找用户
  async findByIdCard(idCard) {
    for (const [id, user] of this.users) {
      if (user.idCard === idCard) {
        return { id, ...user };
      }
    }
    return null;
  }

  // 根据用户ID查找用户
  async findById(userId) {
    const user = this.users.get(userId);
    if (user) {
      return { id: userId, ...user };
    }
    return null;
  }

  // 创建新用户
  async create(userData) {
    const userId = crypto.randomUUID();
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = {
      phoneNumber: userData.phoneNumber,
      email: userData.email,
      realName: userData.realName,
      idCard: userData.idCard,
      password: hashedPassword,
      createdAt: new Date(),
      isLocked: false,
      lockUntil: null
    };

    this.users.set(userId, user);
    return userId;
  }

  // 验证密码
  async verifyPassword(userId, password) {
    const user = this.users.get(userId);
    if (!user) return false;
    return await bcrypt.compare(password, user.password);
  }

  // 更新用户密码
  async updatePassword(userId, newPassword) {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    this.users.set(userId, user);
    return true;
  }

  // 锁定用户账户
  async lockUser(userId, lockDuration = 30 * 60 * 1000) { // 默认30分钟
    const user = this.users.get(userId);
    if (!user) return false;
    
    user.isLocked = true;
    user.lockUntil = new Date(Date.now() + lockDuration);
    this.users.set(userId, user);
    return true;
  }

  // 检查用户是否被锁定
  async isUserLocked(userId) {
    const user = this.users.get(userId);
    if (!user) return false;
    
    if (user.isLocked && user.lockUntil && new Date() > user.lockUntil) {
      // 锁定时间已过，解锁用户
      user.isLocked = false;
      user.lockUntil = null;
      this.users.set(userId, user);
      return false;
    }
    
    return user.isLocked;
  }

  // 记录登录尝试
  async recordLoginAttempt(identifier, success = false) {
    const key = identifier;
    const attempts = this.loginAttempts.get(key) || { count: 0, lastAttempt: null };
    
    if (success) {
      this.loginAttempts.delete(key);
    } else {
      attempts.count += 1;
      attempts.lastAttempt = new Date();
      this.loginAttempts.set(key, attempts);
    }
    
    return attempts.count;
  }

  // 获取登录尝试次数
  async getLoginAttempts(identifier) {
    const attempts = this.loginAttempts.get(identifier);
    return attempts ? attempts.count : 0;
  }

  // 验证码相关方法
  async createVerificationCode(phoneNumber, type) {
    // 检查每日发送次数限制
    const today = new Date().toDateString();
    const dailyKey = `${phoneNumber}_${today}`;
    const dailyCount = this.dailyCodeCounts.get(dailyKey) || 0;
    
    if (dailyCount >= 10) {
      throw new Error('发送过于频繁，请稍后再试');
    }
    
    // 在测试环境中使用固定验证码
    const code = process.env.NODE_ENV === 'test' ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const key = `${phoneNumber}_${type}`;
    const expireTime = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期
    
    this.verificationCodes.set(key, {
      code,
      expireTime,
      createdAt: new Date()
    });
    
    // 更新每日发送次数
    this.dailyCodeCounts.set(dailyKey, dailyCount + 1);
    
    return { code, expireTime };
  }

  async verifyCode(phoneNumber, code, type) {
    const key = `${phoneNumber}_${type}`;
    const storedCode = this.verificationCodes.get(key);
    
    if (!storedCode) return false;
    if (new Date() > storedCode.expireTime) {
      this.verificationCodes.delete(key);
      return false;
    }
    if (storedCode.code !== code) return false;
    
    // 验证成功后删除验证码
    this.verificationCodes.delete(key);
    return true;
  }

  // 检查验证码发送频率
  async canSendCode(phoneNumber, type) {
    const key = `${phoneNumber}_${type}`;
    const storedCode = this.verificationCodes.get(key);
    
    if (!storedCode) return true;
    
    const timeDiff = new Date() - storedCode.createdAt;
    return timeDiff > 60 * 1000; // 1分钟间隔
  }

  // Token管理
  addToken(token) {
    this.tokens.add(token);
  }

  removeToken(token) {
    this.tokens.delete(token);
  }

  clearUserTokens(userId) {
    // 在实际应用中，这里应该根据userId清除相关的tokens
    // 由于这是模拟实现，我们简单地清除所有tokens
    this.tokens.clear();
  }

  // 验证手机号格式
  static validatePhoneNumber(phoneNumber) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    return phoneRegex.test(phoneNumber);
  }

  // 验证邮箱格式
  static validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  // 验证身份证号格式
  static validateIdCard(idCard) {
    const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
    return idCardRegex.test(idCard);
  }

  // 验证密码强度
  static validatePassword(password) {
    // 至少8位，包含大小写字母、数字和特殊字符
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  }
}

// 创建单例实例
const userModel = new User();

module.exports = userModel;