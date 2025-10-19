const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * JWT认证中间件
 * 验证请求头中的JWT token
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: '访问令牌缺失'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    
    // 检查用户是否存在
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        error: '用户不存在'
      });
    }

    // 检查token是否在用户的有效token列表中
    if (!User.tokens.has(token)) {
      return res.status(401).json({
        error: '访问令牌无效'
      });
    }

    req.user = decoded;
    req.token = token;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({
        error: '访问令牌格式错误'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: '访问令牌已过期'
      });
    }

    console.error('认证中间件错误:', error);
    return res.status(500).json({
      error: '服务器内部错误'
    });
  }
};

/**
 * 可选认证中间件
 * 如果有token则验证，没有token则继续
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next();
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret');
    const user = await User.findById(decoded.userId);
    
    if (user && user.tokens.includes(token)) {
      req.user = decoded;
      req.token = token;
    }

    next();
  } catch (error) {
    // 可选认证失败时不返回错误，继续执行
    next();
  }
};

module.exports = {
  authenticateToken,
  optionalAuth
};