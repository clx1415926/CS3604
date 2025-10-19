import React, { useState, useEffect } from 'react';
import { Layout, Button, Avatar, Dropdown, Badge, Space } from 'antd';
import { UserOutlined, BellOutlined, QuestionCircleOutlined } from '@ant-design/icons';

const { Header } = Layout;

const HomeHeader = ({ userInfo, onLoginClick, onRegisterClick, onUserMenuClick }) => {
  const [userMenuVisible, setUserMenuVisible] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  const isLoggedIn = !!userInfo;

  useEffect(() => {
    if (isLoggedIn) {
      loadNotificationCount();
    }
  }, [isLoggedIn]);

  const loadNotificationCount = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await fetch('/api/user/notifications/count', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setNotificationCount(data.count || 0);
      }
    } catch (error) {
      console.error('获取通知数量失败:', error);
    }
  };

  const userMenuItems = [
    {
      key: 'profile',
      label: '个人信息',
    },
    {
      key: 'orders',
      label: '我的订单',
    },
    {
      key: 'passengers',
      label: '常用联系人',
    },
    {
      key: 'security',
      label: '账户安全',
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      label: '退出登录',
    },
  ];

  const handleUserMenuClick = ({ key }) => {
    // TODO: 实现用户菜单点击逻辑
    if (onUserMenuClick) {
      onUserMenuClick(key);
    }
    setUserMenuVisible(false);
  };

  return (
    <Header className="home-header">
      <div className="header-container">
        <div className="header-left">
          <div className="logo">
            <span className="logo-text">12306</span>
          </div>
        </div>
        
        <div className="header-right">
          <Space size="middle">
            {/* 帮助中心 */}
            <Button
              type="text"
              icon={<QuestionCircleOutlined />}
              onClick={() => {
                // TODO: 跳转到帮助中心
                console.log('Navigate to help center');
              }}
            >
              帮助中心
            </Button>

            {/* 消息通知 */}
            <Badge count={notificationCount} size="small">
              <Button
                type="text"
                icon={<BellOutlined />}
                onClick={() => {
                  // TODO: 显示消息通知
                  console.log('Show notifications');
                }}
              />
            </Badge>

            {/* 用户状态区域 */}
            {isLoggedIn ? (
              <Dropdown
                menu={{
                  items: userMenuItems,
                  onClick: handleUserMenuClick,
                }}
                trigger={['click']}
                open={userMenuVisible}
                onOpenChange={setUserMenuVisible}
              >
                <div className="user-info" onClick={() => setUserMenuVisible(!userMenuVisible)}>
                  <Avatar
                    size="small"
                    icon={<UserOutlined />}
                    src={userInfo?.avatar}
                  />
                  <span className="username">{userInfo?.realName || userInfo?.phoneNumber}</span>
                </div>
              </Dropdown>
            ) : (
              <Space>
                <Button type="link" onClick={onLoginClick}>
                  登录
                </Button>
                <Button type="primary" onClick={onRegisterClick}>
                  注册
                </Button>
              </Space>
            )}
          </Space>
        </div>
      </div>
    </Header>
  );
};

export default HomeHeader;