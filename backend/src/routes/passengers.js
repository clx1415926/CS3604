const express = require('express');
const router = express.Router();

// TODO: 实现添加乘客接口
router.post('/', (req, res) => {
  // TODO: 实现添加乘客逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

// TODO: 实现获取乘客列表接口
router.get('/', (req, res) => {
  // TODO: 实现获取乘客列表逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

// TODO: 实现更新乘客信息接口
router.put('/:passengerId', (req, res) => {
  // TODO: 实现更新乘客信息逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

// TODO: 实现删除乘客接口
router.delete('/:passengerId', (req, res) => {
  // TODO: 实现删除乘客逻辑
  res.status(501).json({ 
    success: false, 
    message: 'Not implemented yet' 
  });
});

module.exports = router;