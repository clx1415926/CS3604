const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

// 模拟车站数据
const mockStations = [
  { code: 'BJS', name: '北京', city: '北京', province: '北京', pinyin: 'beijing', hot: true },
  { code: 'SHH', name: '上海', city: '上海', province: '上海', pinyin: 'shanghai', hot: true },
  { code: 'GZQ', name: '广州', city: '广州', province: '广东', pinyin: 'guangzhou', hot: true },
  { code: 'SZN', name: '深圳', city: '深圳', province: '广东', pinyin: 'shenzhen', hot: true },
  { code: 'HZH', name: '杭州', city: '杭州', province: '浙江', pinyin: 'hangzhou', hot: true },
  { code: 'NJH', name: '南京', city: '南京', province: '江苏', pinyin: 'nanjing', hot: true },
  { code: 'TJP', name: '天津', city: '天津', province: '天津', pinyin: 'tianjin', hot: true },
  { code: 'CQW', name: '重庆', city: '重庆', province: '重庆', pinyin: 'chongqing', hot: true },
  { code: 'CDW', name: '成都', city: '成都', province: '四川', pinyin: 'chengdu', hot: true },
  { code: 'XAY', name: '西安', city: '西安', province: '陕西', pinyin: 'xian', hot: true },
  { code: 'WHN', name: '武汉', city: '武汉', province: '湖北', pinyin: 'wuhan', hot: false },
  { code: 'CSQ', name: '长沙', city: '长沙', province: '湖南', pinyin: 'changsha', hot: false },
  { code: 'SJP', name: '石家庄', city: '石家庄', province: '河北', pinyin: 'shijiazhuang', hot: false },
  { code: 'ZZF', name: '郑州', city: '郑州', province: '河南', pinyin: 'zhengzhou', hot: false },
  { code: 'JNK', name: '济南', city: '济南', province: '山东', pinyin: 'jinan', hot: false },
  { code: 'QDK', name: '青岛', city: '青岛', province: '山东', pinyin: 'qingdao', hot: false },
  { code: 'DLT', name: '大连', city: '大连', province: '辽宁', pinyin: 'dalian', hot: false },
  { code: 'SYT', name: '沈阳', city: '沈阳', province: '辽宁', pinyin: 'shenyang', hot: false },
  { code: 'HEB', name: '哈尔滨', city: '哈尔滨', province: '黑龙江', pinyin: 'haerbin', hot: false },
  { code: 'CCT', name: '长春', city: '长春', province: '吉林', pinyin: 'changchun', hot: false }
];

// GET /api/stations - 获取车站列表
router.get('/stations', async (req, res) => {
  try {
    const { keyword, city, province, page = 1, limit = 20 } = req.query;
    
    // 验证分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    
    if (isNaN(pageNum) || pageNum < 1) {
      return res.status(400).json({ error: '查询参数格式错误' });
    }
    
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return res.status(400).json({ error: '查询参数格式错误' });
    }
    
    let filteredStations = [...mockStations];
    
    // 关键词搜索
    if (keyword) {
      const searchTerm = keyword.toLowerCase();
      filteredStations = filteredStations.filter(station => 
        station.name.includes(keyword) ||
        station.city.includes(keyword) ||
        station.pinyin.includes(searchTerm)
      );
    }
    
    // 城市筛选
    if (city) {
      filteredStations = filteredStations.filter(station => station.city === city);
    }
    
    // 省份筛选
    if (province) {
      filteredStations = filteredStations.filter(station => station.province === province);
    }
    
    // 分页处理
    const startIndex = (pageNum - 1) * limitNum;
    const endIndex = startIndex + limitNum;
    const paginatedStations = filteredStations.slice(startIndex, endIndex);
    
    res.status(200).json({
      stations: paginatedStations,
      totalCount: filteredStations.length,
      currentPage: pageNum,
      hasMore: endIndex < filteredStations.length
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/stations/search - 车站搜索自动补全
router.get('/stations/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: '搜索关键词不能为空' });
    }
    
    const searchTerm = q.toLowerCase();
    const suggestions = mockStations
      .filter(station => 
        station.name.includes(q) ||
        station.city.includes(q) ||
        station.pinyin.includes(searchTerm)
      )
      .sort((a, b) => {
        // 热门车站优先
        if (a.hot && !b.hot) return -1;
        if (!a.hot && b.hot) return 1;
        // 名称完全匹配优先
        if (a.name === q) return -1;
        if (b.name === q) return 1;
        return 0;
      })
      .slice(0, parseInt(limit))
      .map(station => ({
        code: station.code,
        name: station.name,
        city: station.city,
        province: station.province,
        pinyin: station.pinyin
      }));
    
    res.status(200).json({
      suggestions
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 模拟热门城市数据
const mockHotCities = [
  { code: 'BJS', name: '北京', province: '北京', stationCount: 15, hotness: 95 },
  { code: 'SHH', name: '上海', province: '上海', stationCount: 12, hotness: 92 },
  { code: 'GZQ', name: '广州', province: '广东', stationCount: 8, hotness: 88 },
  { code: 'SZN', name: '深圳', province: '广东', stationCount: 6, hotness: 85 },
  { code: 'HZH', name: '杭州', province: '浙江', stationCount: 7, hotness: 82 },
  { code: 'NJH', name: '南京', province: '江苏', stationCount: 9, hotness: 80 },
  { code: 'TJP', name: '天津', province: '天津', stationCount: 5, hotness: 78 },
  { code: 'CQW', name: '重庆', province: '重庆', stationCount: 10, hotness: 76 },
  { code: 'CDW', name: '成都', province: '四川', stationCount: 11, hotness: 74 },
  { code: 'XAY', name: '西安', province: '陕西', stationCount: 8, hotness: 72 }
];

// 模拟热门路线数据
const mockHotRoutes = [
  { fromStation: '北京', toStation: '上海', hotness: 95, referencePrice: 553, trainCount: 42, duration: '4h28m', popularity: 95, frequency: 42 },
  { fromStation: '北京', toStation: '广州', hotness: 88, referencePrice: 862, trainCount: 28, duration: '7h59m', popularity: 88, frequency: 28 },
  { fromStation: '上海', toStation: '深圳', hotness: 92, referencePrice: 674, trainCount: 35, duration: '6h45m', popularity: 92, frequency: 35 },
  { fromStation: '北京', toStation: '杭州', hotness: 85, referencePrice: 489, trainCount: 31, duration: '4h18m', popularity: 85, frequency: 31 },
  { fromStation: '上海', toStation: '南京', hotness: 90, referencePrice: 134, trainCount: 67, duration: '1h17m', popularity: 90, frequency: 67 },
  { fromStation: '广州', toStation: '深圳', hotness: 94, referencePrice: 75, trainCount: 89, duration: '1h09m', popularity: 94, frequency: 89 },
  { fromStation: '北京', toStation: '天津', hotness: 87, referencePrice: 54, trainCount: 156, duration: '30m', popularity: 87, frequency: 156 },
  { fromStation: '上海', toStation: '杭州', hotness: 89, referencePrice: 73, trainCount: 98, duration: '45m', popularity: 89, frequency: 98 },
  { fromStation: '北京', toStation: '西安', hotness: 82, referencePrice: 515, trainCount: 24, duration: '4h25m', popularity: 82, frequency: 24 },
  { fromStation: '上海', toStation: '武汉', hotness: 84, referencePrice: 398, trainCount: 36, duration: '3h28m', popularity: 84, frequency: 36 },
  { fromStation: '广州', toStation: '长沙', hotness: 86, referencePrice: 314, trainCount: 41, duration: '2h17m', popularity: 86, frequency: 41 },
  { fromStation: '成都', toStation: '重庆', hotness: 91, referencePrice: 154, trainCount: 73, duration: '1h13m', popularity: 91, frequency: 73 }
];

// GET /api/cities/hot - 获取热门城市
router.get('/cities/hot', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const limitNum = parseInt(limit);
    // 按热度排序返回城市列表
    const cities = mockHotCities
      .sort((a, b) => b.hotness - a.hotness)
      .slice(0, limitNum);
    
    res.status(200).json({
      cities,
      totalCount: mockHotCities.length
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/routes/hot - 获取热门线路
router.get('/routes/hot', async (req, res) => {
  try {
    const { limit = 12 } = req.query;
    
    const limitNum = parseInt(limit);
    // 按热度排序返回线路列表
    const routes = mockHotRoutes
      .sort((a, b) => b.hotness - a.hotness)
      .slice(0, limitNum);
    
    res.status(200).json({
      routes,
      updateTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// 模拟用户搜索历史数据
const mockUserSearchHistory = new Map();

// 模拟用户最近车站数据
const mockUserRecentStations = new Map();

// 模拟系统配置数据
const mockSystemConfig = {
  customerService: {
    enabled: true,
    url: 'https://service.12306.cn/chat',
    workingHours: '7:00-23:00',
    description: '在线客服为您提供7×16小时服务'
  },
  hotline: {
    enabled: true,
    number: '95105105',
    workingHours: '24小时',
    description: '全国统一客服热线'
  },
  faq: {
    enabled: true,
    url: 'https://www.12306.cn/mormhweb/faq/',
    categories: ['购票', '退改签', '账户', '其他'],
    description: '常见问题解答'
  },
  userGuide: {
    enabled: true,
    url: 'https://www.12306.cn/mormhweb/guide/',
    sections: ['新手指南', '购票流程', '支付方式', '常用功能'],
    description: '详细使用指南'
  },
  notices: [
    {
      id: 1,
      title: '关于春运期间购票的重要提醒',
      content: '春运期间车票紧张，请提前规划出行时间...',
      type: 'important',
      priority: 'high',
      publishTime: '2025-01-20T10:00:00Z',
      isRead: false
    },
    {
      id: 2,
      title: '系统维护通知',
      content: '系统将于1月25日凌晨2:00-4:00进行维护...',
      type: 'maintenance',
      priority: 'medium',
      publishTime: '2025-01-19T15:30:00Z',
      isRead: false
    },
    {
      id: 3,
      title: '新功能上线公告',
      content: '12306手机APP新增智能推荐功能...',
      type: 'feature',
      priority: 'low',
      publishTime: '2025-01-18T09:00:00Z',
      isRead: true
    }
  ]
};

// GET /api/user/search-history - 获取用户搜索历史
router.get('/user/search-history', authenticateToken, async (req, res) => {
  try {
    const { limit = 20, sortBy = 'searchTime', order = 'desc' } = req.query;
    const userId = req.user.userId;
    
    // 获取用户搜索历史
    let history = mockUserSearchHistory.get(userId) || [
      {
        id: 1,
        origin: '北京',
        destination: '上海',
        searchTime: '2025-01-20T10:30:00Z',
        frequency: 5
      },
      {
        id: 2,
        origin: '广州',
        destination: '深圳',
        searchTime: '2025-01-19T15:20:00Z',
        frequency: 3
      },
      {
        id: 3,
        origin: '杭州',
        destination: '南京',
        searchTime: '2025-01-18T09:15:00Z',
        frequency: 1
      }
    ];
    
    // 排序
    if (sortBy === 'frequency') {
      history.sort((a, b) => order === 'desc' ? b.frequency - a.frequency : a.frequency - b.frequency);
    } else {
      history.sort((a, b) => {
        const dateA = new Date(a.searchTime);
        const dateB = new Date(b.searchTime);
        return order === 'desc' ? dateB - dateA : dateA - dateB;
      });
    }
    
    const limitNum = parseInt(limit);
    const paginatedHistory = history.slice(0, limitNum);
    
    res.status(200).json({
      history: paginatedHistory,
      total: history.length,
      hasMore: history.length > limitNum
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// POST /api/user/search-history - 保存用户搜索历史
router.post('/user/search-history', authenticateToken, async (req, res) => {
  try {
    const { origin, destination } = req.body;
    const userId = req.user.userId;
    
    if (!origin || !destination) {
      return res.status(400).json({ error: '出发地和目的地不能为空' });
    }
    
    // 获取现有历史
    let history = mockUserSearchHistory.get(userId) || [];
    
    // 检查是否已存在相同记录
    const existingIndex = history.findIndex(item => 
      item.origin === origin && item.destination === destination
    );
    
    if (existingIndex >= 0) {
      // 更新频次和时间
      history[existingIndex].frequency += 1;
      history[existingIndex].searchTime = new Date().toISOString();
    } else {
      // 添加新记录
      const newRecord = {
        id: Date.now(),
        origin,
        destination,
        searchTime: new Date().toISOString(),
        frequency: 1
      };
      history.unshift(newRecord);
      
      // 限制历史记录数量
      if (history.length > 50) {
        history = history.slice(0, 50);
      }
    }
    
    mockUserSearchHistory.set(userId, history);
    
    res.status(201).json({
      message: '搜索历史保存成功'
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/user/recent-stations - 获取用户最近使用的车站
router.get('/user/recent-stations', authenticateToken, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.userId;
    
    // 获取用户最近车站
    const recentStations = mockUserRecentStations.get(userId) || [
      { code: 'TJP', name: '天津', pinyin: 'tianjin', lastUsed: '2025-01-20T08:30:00Z' },
      { code: 'SJP', name: '石家庄', pinyin: 'shijiazhuang', lastUsed: '2025-01-19T14:20:00Z' },
      { code: 'HZH', name: '杭州', pinyin: 'hangzhou', lastUsed: '2025-01-18T16:45:00Z' }
    ];
    
    const limitNum = parseInt(limit);
    const stations = recentStations.slice(0, limitNum);
    
    res.status(200).json({
      stations
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/system/config - 获取系统配置
router.get('/system/config', async (req, res) => {
  try {
    const { type, status } = req.query;
    
    // 基础配置
    let configs = [
      {
        id: 1,
        type: 'announcement',
        status: 'active',
        title: '春运购票提醒',
        content: '春运期间车票紧张，请提前规划出行时间',
        effectiveTime: '2025-01-01T00:00:00Z',
        expiryTime: '2025-03-01T23:59:59Z',
        priority: 'high'
      },
      {
        id: 2,
        type: 'maintenance',
        status: 'active',
        title: '系统维护通知',
        content: '系统将于1月25日凌晨2:00-4:00进行维护',
        effectiveTime: '2025-01-20T00:00:00Z',
        expiryTime: '2025-01-26T00:00:00Z',
        priority: 'medium'
      },
      {
        id: 3,
        type: 'feature',
        status: 'inactive',
        title: '新功能上线',
        content: '12306手机APP新增智能推荐功能',
        effectiveTime: '2025-01-15T00:00:00Z',
        expiryTime: '2025-02-15T00:00:00Z',
        priority: 'low'
      }
    ];
    
    // 按类型筛选
    if (type) {
      configs = configs.filter(config => config.type === type);
    }
    
    // 按状态筛选
    if (status) {
      configs = configs.filter(config => config.status === status);
    }
    
    // 返回完整的系统配置，包含configs数组和其他配置
    res.status(200).json({
      ...mockSystemConfig,
      configs,
      updateTime: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

// GET /api/user/status - 获取用户状态
router.get('/user/status', async (req, res) => {
  try {
    // TODO: 实现用户状态查询逻辑
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(200).json({
        isLoggedIn: false,
        userInfo: null,
        permissions: []
      });
    }
    
    // 临时返回未登录状态，让测试失败
    res.status(200).json({
      isLoggedIn: false,
      userInfo: null,
      permissions: []
    });
  } catch (error) {
    res.status(500).json({ error: '服务器内部错误' });
  }
});

module.exports = router;