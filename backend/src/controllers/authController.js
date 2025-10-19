const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { phoneNumber, email, verificationCode, password, realName, idCard } = req.body;

    // 检查用户是否已存在
    const existingUserByPhone = await User.findByPhone(phoneNumber);
    const existingUserByIdCard = await User.findByIdCard(idCard);
    
    if (existingUserByPhone || existingUserByIdCard) {
      return res.status(409).json({
        error: '手机号或身份证号已存在'
      });
    }

    // 验证验证码
    const isCodeValid = await User.verifyCode(phoneNumber, verificationCode, 'register');
    if (!isCodeValid) {
      return res.status(400).json({
        error: '输入信息格式错误或验证码无效'
      });
    }

    // 创建用户
    const userId = await User.create({
      phoneNumber,
      email,
      password,
      realName,
      idCard
    });

    // 生成JWT token
    const token = jwt.sign(
      { userId: userId, phoneNumber: phoneNumber },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // 保存token到用户记录
    User.addToken(token);

    res.status(201).json({
      message: '注册成功',
      token,
      userId: userId
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      error: '注册失败，请稍后重试'
    });
  }
};

/**
 * 用户登录
 */
const login = async (req, res) => {
  try {
    const { phoneNumber, account, password, captcha } = req.body;

    // 支持手机号或邮箱登录
    const identifier = phoneNumber || account;
    
    let user;
    
    if (identifier.includes('@')) {
      // 邮箱登录
      user = await User.findByEmail(identifier);
    } else {
      // 手机号登录
      user = await User.findByPhone(identifier);
    }

    if (!user) {
      return res.status(401).json({
        error: '账号或密码错误'
      });
    }

    // 检查登录尝试次数
    const attempts = await User.getLoginAttempts(identifier);
    if (attempts >= 5) {
      // 需要验证码
      if (!captcha) {
        return res.status(423).json({
          error: '账户已被锁定，请稍后再试'
        });
      }
      
      // 验证图形验证码（简单验证）
      if (captcha !== 'correct') {
        return res.status(400).json({
          error: '验证码错误'
        });
      }
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      // 记录失败尝试
      await User.recordLoginAttempt(identifier, false);
      
      const newAttempts = await User.getLoginAttempts(identifier);
      if (newAttempts >= 5) {
        return res.status(423).json({
          error: '账户已被锁定，请稍后再试'
        });
      }
      
      return res.status(401).json({
        error: '账号或密码错误'
      });
    }

    // 登录成功，清除失败记录
    await User.recordLoginAttempt(identifier, true);

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '24h' }
    );

    // 保存token到用户记录
    User.addToken(token);

    res.status(200).json({
      message: '登录成功',
      token,
      userId: user.id,
      userInfo: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        realName: user.realName
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      error: '登录失败，请稍后重试'
    });
  }
};

/**
 * 发送验证码
 */
const sendVerificationCode = async (req, res) => {
  try {
    const { phoneNumber, type } = req.body;

    // 检查是否可以发送验证码（1分钟间隔限制）
    const canSend = await User.canSendCode(phoneNumber, type);
    if (!canSend) {
      return res.status(429).json({
        error: '发送过于频繁，请稍后再试'
      });
    }

    // 生成并保存验证码
    const codeResult = await User.createVerificationCode(phoneNumber, type);

    // 这里应该调用短信服务发送验证码
    console.log(`发送验证码 ${codeResult.code} 到 ${phoneNumber} (类型: ${type})`);

    res.status(200).json({
      message: '验证码发送成功'
    });
  } catch (error) {
    console.error('发送验证码错误:', error);
    
    // 如果是每日限制错误，返回429状态码
    if (error.message === '发送过于频繁，请稍后再试') {
      return res.status(429).json({
        error: error.message
      });
    }
    
    res.status(500).json({
      error: '发送验证码失败，请稍后重试'
    });
  }
};

/**
 * 重置密码
 */
const resetPassword = async (req, res) => {
  try {
    const { phoneNumber, verificationCode, newPassword } = req.body;

    // 查找用户
    const user = await User.findByPhone(phoneNumber);
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    // 验证验证码
    const isCodeValid = await User.verifyCode(phoneNumber, verificationCode, 'reset-password');
    if (!isCodeValid) {
      return res.status(400).json({
        error: '验证码错误或已过期'
      });
    }

    // 更新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await User.updatePassword(user.id, hashedPassword);

    // 清除所有token（强制重新登录）
    User.clearUserTokens(user.id);

    res.status(200).json({
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置密码错误:', error);
    res.status(500).json({
      error: '重置密码失败，请稍后重试'
    });
  }
};

/**
 * 用户登出
 */
const logout = async (req, res) => {
  try {
    const token = req.token;
    const userId = req.user.userId;

    // 从用户记录中移除token
    const user = await User.findById(userId);
    if (user) {
      await user.removeToken(token);
    }

    res.status(200).json({
      message: '登出成功'
    });
  } catch (error) {
    console.error('登出错误:', error);
    res.status(500).json({
      error: '登出失败，请稍后重试'
    });
  }
};

/**
 * 获取用户信息
 */
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({
        error: '用户不存在'
      });
    }

    res.status(200).json({
      userInfo: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        email: user.email,
        realName: user.realName
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      error: '获取用户信息失败'
    });
  }
};

module.exports = {
  register,
  login,
  sendVerificationCode,
  resetPassword,
  logout,
  getUserProfile
};