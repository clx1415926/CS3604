import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Badge, Spin } from 'antd';
import { 
  CarOutlined, 
  EnvironmentOutlined, 
  ClockCircleOutlined,
  UserOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  BellOutlined,
  GiftOutlined
} from '@ant-design/icons';

const QuickAccess = ({ onItemClick }) => {
  const [accessItems, setAccessItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userStatus, setUserStatus] = useState(null);

  useEffect(() => {
    loadQuickAccessItems();
    loadUserStatus();
  }, []);

  const loadQuickAccessItems = async () => {
    try {
      setLoading(true);
      // 从系统配置获取快捷入口配置
      const response = await fetch('/api/system/config?type=quick_access');
      let items = [];
      
      if (response.ok) {
        const data = await response.json();
        const quickAccessConfig = data.configs?.find(config => config.type === 'quick_access');
        if (quickAccessConfig?.value?.items) {
          items = quickAccessConfig.value.items;
        }
      }
      
      // 如果没有配置或配置为空，使用默认配置
      if (items.length === 0) {
        items = [
          {
            id: 'my-orders',
            title: '我的订单',
            icon: <CarOutlined />,
            badge: 0,
            path: '/orders',
            requireLogin: true,
          },
          {
            id: 'my-trips',
            title: '我的行程',
            icon: <EnvironmentOutlined />,
            badge: 0,
            path: '/trips',
            requireLogin: true,
          },
          {
            id: 'delay-info',
            title: '晚点查询',
            icon: <ClockCircleOutlined />,
            badge: 0,
            path: '/delay',
            requireLogin: false,
          },
          {
            id: 'user-center',
            title: '个人中心',
            icon: <UserOutlined />,
            badge: 0,
            path: '/profile',
            requireLogin: true,
          },
          {
            id: 'settings',
            title: '设置',
            icon: <SettingOutlined />,
            badge: 0,
            path: '/settings',
            requireLogin: false,
          },
          {
            id: 'help',
            title: '帮助中心',
            icon: <QuestionCircleOutlined />,
            badge: 0,
            path: '/help',
            requireLogin: false,
          },
          {
            id: 'notifications',
            title: '消息通知',
            icon: <BellOutlined />,
            badge: 0,
            path: '/notifications',
            requireLogin: true,
          },
          {
            id: 'promotions',
            title: '优惠活动',
            icon: <GiftOutlined />,
            badge: 0,
            path: '/promotions',
            requireLogin: false,
          },
        ];
      }
      
      setAccessItems(items);
    } catch (error) {
      console.error('加载快捷入口失败:', error);
      setAccessItems([]);
    } finally {
      setLoading(false);
    }
  };

  const loadUserStatus = async () => {
    try {
      // 调用 API-GET-UserStatus 接口
      const token = localStorage.getItem('token');
      if (!token) {
        setUserStatus({ isLoggedIn: false });
        return;
      }

      const response = await fetch('/api/user/status', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUserStatus({
          isLoggedIn: true,
          ...data
        });
      } else {
        setUserStatus({ isLoggedIn: false });
      }
    } catch (error) {
      console.error('获取用户状态失败:', error);
      setUserStatus({ isLoggedIn: false });
    }
  };

  const handleItemClick = (item) => {
    if (item.requireLogin && !userStatus?.isLoggedIn) {
      // TODO: 跳转到登录页面
      console.log('需要登录');
      return;
    }

    if (onItemClick) {
      onItemClick(item);
    } else {
      // TODO: 默认导航逻辑
      console.log('导航到:', item.path);
    }
  };

  const renderAccessItem = (item) => {
    const isDisabled = item.requireLogin && !userStatus?.isLoggedIn;
    
    return (
      <Col xs={12} sm={8} md={6} lg={6} xl={4} key={item.id}>
        <Card
          hoverable={!isDisabled}
          className={`quick-access-item ${isDisabled ? 'disabled' : ''}`}
          onClick={() => !isDisabled && handleItemClick(item)}
          bodyStyle={{ 
            padding: '16px 8px', 
            textAlign: 'center',
            opacity: isDisabled ? 0.5 : 1 
          }}
        >
          <div className="access-icon">
            <Badge count={item.badge} size="small">
              {item.icon}
            </Badge>
          </div>
          <div className="access-title">{item.title}</div>
          {isDisabled && (
            <div className="access-hint">需要登录</div>
          )}
        </Card>
      </Col>
    );
  };

  if (loading) {
    return (
      <Card title="快捷入口" className="quick-access-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="快捷入口" className="quick-access-container">
      <Row gutter={[16, 16]}>
        {accessItems.map(renderAccessItem)}
      </Row>
    </Card>
  );
};

export default QuickAccess;