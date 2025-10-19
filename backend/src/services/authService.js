const jwt = require('jsonwebtoken');
const User = require('../models/User');

class AuthService {
  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || 'your-secret-key';
    this.jwtExpiresIn = process.env.JWT_EXPIRES_IN || '24h';
  }

  // 用户注册
  async register(userData) {
    const { phoneNumber, email, verificationCode, password, realName, idCard } = userData;

    // 1. 验证输入格式
    if (!User.validatePhoneNumber(phoneNumber)) {
      throw new Error('手机号格式不正确');
    }

    if (email && !User.validateEmail(email)) {
      throw new Error('邮箱格式不正确');
    }

    if (!User.validateIdCard(idCard)) {
      throw new Error('身份证号格式不正确');
    }

    if (!User.validatePassword(password)) {
      throw new Error('密码强度不足，需包含大小写字母、数字和特殊字符，至少8位');
    }

    // 2. 验证验证码
    const isCodeValid = await User.verifyCode(phoneNumber, verificationCode, 'register');
    if (!isCodeValid) {
      throw new Error('验证码错误或已过期');
    }

    // 3. 检查用户是否已存在
    const existingUserByPhone = await User.findByPhone(phoneNumber);
    if (existingUserByPhone) {
      throw new Error('手机号已存在');
    }

    const existingUserByIdCard = await User.findByIdCard(idCard);
    if (existingUserByIdCard) {
      throw new Error('身份证号已存在');
    }

    if (email) {
      const existingUserByEmail = await User.findByEmail(email);
      if (existingUserByEmail) {
        throw new Error('邮箱已存在');
      }
    }

    // 4. 创建用户
    const userId = await User.create({
      phoneNumber,
      email,
      password,
      realName,
      idCard
    });

    return {
      userId,
      message: '注册成功'
    };
  }

  // 用户登录
  async login(loginData) {
    const { account, password, captcha } = loginData;
    let user = null;
    let userId = null;

    // 1. 根据账号类型查找用户
    if (User.validatePhoneNumber(account)) {
      user = await User.findByPhone(account);
    } else if (User.validateEmail(account)) {
      user = await User.findByEmail(account);
    } else {
      throw new Error('账号格式不正确');
    }

    if (!user) {
      // 记录失败尝试
      await User.recordLoginAttempt(account, false);
      throw new Error('账号或密码错误');
    }

    userId = user.id;

    // 2. 检查账户是否被锁定
    const isLocked = await User.isUserLocked(userId);
    if (isLocked) {
      throw new Error('账户已被锁定，请稍后再试');
    }

    // 3. 检查登录尝试次数
    const attempts = await User.getLoginAttempts(account);
    if (attempts >= 3 && !captcha) {
      throw new Error('需要验证码');
    }

    // 4. 验证密码
    const isPasswordValid = await User.verifyPassword(userId, password);
    if (!isPasswordValid) {
      const attemptCount = await User.recordLoginAttempt(account, false);
      
      // 超过5次尝试锁定账户
      if (attemptCount >= 5) {
        await User.lockUser(userId);
        throw new Error('登录失败次数过多，账户已被锁定30分钟');
      }
      
      throw new Error('账号或密码错误');
    }

    // 5. 登录成功，清除失败记录
    await User.recordLoginAttempt(account, true);

    // 6. 生成JWT token
    const token = jwt.sign(
      { 
        userId: userId,
        phoneNumber: user.phoneNumber,
        email: user.email 
      },
      this.jwtSecret,
      { expiresIn: this.jwtExpiresIn }
    );

    // 7. 记录token
    User.addToken(token);

    return {
      token,
      userId: userId,
      userInfo: {
        id: userId,
        phoneNumber: user.phoneNumber,
        email: user.email,
        realName: user.realName
      }
    };
  }

  // 发送验证码
  async sendVerificationCode(phoneNumber, type) {
    // 1. 验证手机号格式
    if (!User.validatePhoneNumber(phoneNumber)) {
      throw new Error('手机号格式错误');
    }

    // 2. 检查发送频率
    const canSend = await User.canSendCode(phoneNumber, type);
    if (!canSend) {
      throw new Error('发送过于频繁，请稍后再试');
    }

    // 3. 生成并存储验证码
    const { code, expireTime } = await User.createVerificationCode(phoneNumber, type);

    // 4. 模拟发送短信（实际应用中应调用短信服务）
    console.log(`发送验证码到 ${phoneNumber}: ${code}`);

    return {
      message: '验证码已发送',
      expireTime: expireTime.getTime()
    };
  }

  // 重置密码
  async resetPassword(phoneNumber, verificationCode, newPassword) {
    // 1. 验证手机号格式
    if (!this.validatePhoneNumber(phoneNumber)) {
      throw new Error('手机号格式错误');
    }

    // 2. 验证密码强度
    if (!this.validatePassword(newPassword)) {
      throw new Error('密码格式不符合要求：至少8位，包含大小写字母、数字和特殊字符');
    }

    // 3. 验证验证码
    const isCodeValid = this.verifyCode(phoneNumber, verificationCode);
    if (!isCodeValid) {
      throw new Error('验证码错误或已过期');
    }

    // 4. 查找用户
    const user = User.findByPhone(phoneNumber);
    if (!user) {
      throw new Error('用户不存在');
    }

    // 5. 更新密码
    const success = User.updatePassword(user.id, newPassword);
    if (!success) {
      throw new Error('密码重置失败');
    }

    // 6. 清除所有登录token
    User.clearUserTokens(user.id);

    return {
      message: '密码重置成功'
    };
  }

  // 验证JWT token
  verifyToken(token) {
    try {
      const decoded = jwt.verify(token, this.jwtSecret);
      return decoded;
    } catch (error) {
      throw new Error('Token无效或已过期');
    }
  }

  // 登出（移除token）
  logout(token) {
    User.removeToken(token);
    return { message: '登出成功' };
  }
}

// 创建单例实例
const authService = new AuthService();

module.exports = authService;