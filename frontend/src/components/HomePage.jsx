import React, { useState, useEffect } from 'react';
import { Layout, Row, Col } from 'antd';
import HomeHeader from './HomeHeader';
import TicketQueryForm from './TicketQueryForm';
import QuickAccess from './QuickAccess';
import HotRoutes from './HotRoutes';
import SearchHistory from './SearchHistory';
import ServiceEntries from './ServiceEntries';
import SystemNotice from './SystemNotice';

const { Content } = Layout;

const HomePage = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // TODO: 实现用户状态获取逻辑
    // 应该调用 API-GET-UserStatus 接口
    setIsLoading(false);
  }, []);

  const handleSearch = (searchParams) => {
    // TODO: 实现搜索逻辑
    // 应该保存搜索历史并跳转到搜索结果页
    console.log('Search params:', searchParams);
  };

  const handleLoginClick = () => {
    // TODO: 实现登录跳转逻辑
    console.log('Navigate to login');
  };

  const handleRegisterClick = () => {
    // TODO: 实现注册跳转逻辑
    console.log('Navigate to register');
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <Layout className="homepage">
      <HomeHeader
        userInfo={userInfo}
        onLoginClick={handleLoginClick}
        onRegisterClick={handleRegisterClick}
      />
      <Content className="homepage-content">
        <div className="container">
          <Row gutter={[24, 24]}>
            <Col xs={24} lg={16}>
              <div className="main-section">
                <TicketQueryForm
                  onSearch={handleSearch}
                  defaultValues={{}}
                />
                <HotRoutes
                  onRouteClick={(route) => {
                    // TODO: 自动填充查询表单
                    console.log('Route clicked:', route);
                  }}
                />
              </div>
            </Col>
            <Col xs={24} lg={8}>
              <div className="sidebar-section">
                <QuickAccess
                  userInfo={userInfo}
                  onItemClick={(item) => {
                    // TODO: 处理快捷入口点击
                    console.log('Quick access item clicked:', item);
                  }}
                />
                <SearchHistory
                  visible={!!userInfo}
                  onHistoryClick={(history) => {
                    // TODO: 自动填充查询表单
                    console.log('History clicked:', history);
                  }}
                  onClearHistory={() => {
                    // TODO: 清空历史记录
                    console.log('Clear history');
                  }}
                />
                <ServiceEntries
                  onServiceClick={(service) => {
                    // TODO: 处理服务入口点击
                    console.log('Service clicked:', service);
                  }}
                />
              </div>
            </Col>
          </Row>
        </div>
        <SystemNotice
          onNoticeClick={(notice) => {
            // TODO: 处理公告点击
            console.log('Notice clicked:', notice);
          }}
        />
      </Content>
    </Layout>
  );
};

export default HomePage;