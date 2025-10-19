const User = require('../models/User');

/**
 * 验证用户注册请求数据
 */
const validateRegister = (req, res, next) => {
  const { phoneNumber, email, verificationCode, password, realName, idCard } = req.body;

  // 验证必填字段
  if (!phoneNumber || !verificationCode || !password || !realName || !idCard) {
    return res.status(400).json({
      error: '缺少必填字段'
    });
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      error: '手机号格式错误'
    });
  }

  // 验证邮箱格式（如果提供）
  if (email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: '邮箱格式错误'
      });
    }
  }

  // 验证身份证号格式
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  if (!idCardRegex.test(idCard)) {
    return res.status(422).json({
      error: '身份证号格式不正确'
    });
  }

  // 验证密码强度
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: '密码必须包含大小写字母、数字和特殊字符，长度8-20位'
    });
  }

  // 验证验证码格式
  if (!/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({
      error: '验证码格式错误'
    });
  }

  next();
};

/**
 * 验证登录请求数据
 */
const validateLogin = (req, res, next) => {
  const { phoneNumber, account, password } = req.body;

  // 支持手机号或邮箱登录
  const identifier = phoneNumber || account;

  // 验证必填字段
  if (!identifier || !password) {
    return res.status(400).json({
      error: '手机号和密码不能为空'
    });
  }

  // 如果是手机号，验证手机号格式
  if (identifier && !identifier.includes('@')) {
    const phoneRegex = /^1[3-9]\d{9}$/;
    if (!phoneRegex.test(identifier)) {
      return res.status(400).json({
        error: '手机号格式错误'
      });
    }
  }

  // 如果是邮箱，验证邮箱格式
  if (identifier && identifier.includes('@')) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(identifier)) {
      return res.status(400).json({
        error: '邮箱格式错误'
      });
    }
  }

  next();
};

/**
 * 验证发送验证码请求数据
 */
const validateSendCode = (req, res, next) => {
  const { phoneNumber, type } = req.body;

  // 验证必填字段
  if (!phoneNumber || !type) {
    return res.status(400).json({
      error: '手机号和验证码类型不能为空'
    });
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      error: '手机号格式错误'
    });
  }

  // 验证type值
  const validTypes = ['register', 'login', 'reset-password'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      error: '验证码类型无效'
    });
  }

  next();
};

/**
 * 验证重置密码请求数据
 */
const validateResetPassword = (req, res, next) => {
  const { phoneNumber, verificationCode, newPassword } = req.body;

  // 验证必填字段
  if (!phoneNumber || !verificationCode || !newPassword) {
    return res.status(400).json({
      error: '手机号、验证码和新密码不能为空'
    });
  }

  // 验证手机号格式
  const phoneRegex = /^1[3-9]\d{9}$/;
  if (!phoneRegex.test(phoneNumber)) {
    return res.status(400).json({
      error: '手机号格式错误'
    });
  }

  // 验证验证码格式
  if (!/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({
      error: '验证码格式错误'
    });
  }

  // 验证新密码强度
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(newPassword)) {
    return res.status(400).json({
      error: '密码必须包含大小写字母、数字和特殊字符，长度8-20位'
    });
  }

  next();
};

/**
 * 通用错误处理中间件
 */
const errorHandler = (err, req, res, next) => {
  console.error('错误详情:', err);

  // 数据库错误
  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({
      error: '手机号或身份证号已存在'
    });
  }

  // JWT错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(403).json({
      error: '访问令牌格式错误'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(403).json({
      error: '访问令牌已过期'
    });
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message
    });
  }

  // 默认服务器错误
  res.status(500).json({
    error: '服务器内部错误'
  });
};

module.exports = {
  validateRegister,
  validateLogin,
  validateSendCode,
  validateResetPassword,
  errorHandler
};