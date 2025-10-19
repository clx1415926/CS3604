const express = require('express');
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');
const { 
  validateRegister, 
  validateLogin, 
  validateSendCode, 
  validateResetPassword 
} = require('../middleware/validation');

const router = express.Router();

// 用户注册
router.post('/register', validateRegister, authController.register);

// 用户登录
router.post('/login', validateLogin, authController.login);

// 发送验证码
router.post('/send-code', validateSendCode, authController.sendVerificationCode);

// 重置密码
router.post('/reset-password', validateResetPassword, authController.resetPassword);

// 用户登出
router.post('/logout', authenticateToken, authController.logout);

// 获取用户信息
router.get('/profile', authenticateToken, authController.getUserProfile);

module.exports = router;