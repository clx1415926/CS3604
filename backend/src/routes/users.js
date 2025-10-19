const express = require('express');
const router = express.Router();

// TODO: 实现获取用户资料接口
router.get('/profile', (req, res) => {
  // TODO: 实现获取用户资料逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

// TODO: 实现更新用户资料接口
router.put('/profile', (req, res) => {
  // TODO: 实现更新用户资料逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

// TODO: 实现上传头像接口
router.post('/avatar', (req, res) => {
  // TODO: 实现上传头像逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

// TODO: 实现获取用户状态接口
router.get('/status', (req, res) => {
  // TODO: 实现获取用户状态逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

module.exports = router;