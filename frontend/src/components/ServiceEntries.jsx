import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Badge, Spin } from 'antd';
import { 
  CustomerServiceOutlined,
  PhoneOutlined,
  QuestionCircleOutlined,
  FileTextOutlined,
  SafetyOutlined,
  GiftOutlined,
  BellOutlined,
  SettingOutlined
} from '@ant-design/icons';

const ServiceEntries = ({ onServiceClick }) => {
  const [serviceEntries, setServiceEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [systemConfig, setSystemConfig] = useState(null);

  useEffect(() => {
    loadServiceEntries();
    loadSystemConfig();
  }, []);

  const loadServiceEntries = async () => {
    try {
      setLoading(true);
      // 从系统配置获取服务入口配置
      const response = await fetch('/api/system/config');
      if (response.ok) {
        const config = await response.json();
        setSystemConfig(config);
        
        // 根据系统配置生成服务入口
        const entries = [
          {
            id: 'customer-service',
            title: '在线客服',
            icon: <CustomerServiceOutlined />,
            description: config.customerService?.description || '7×24小时在线服务',
            badge: 0,
            action: 'chat',
            url: config.customerService?.url,
            available: config.customerService?.enabled || false,
          },
          {
            id: 'hotline',
            title: '客服热线',
            icon: <PhoneOutlined />,
            description: config.hotline?.number || '95105105',
            badge: 0,
            action: 'call',
            available: config.hotline?.enabled || false,
          },
          {
            id: 'faq',
            title: '常见问题',
            icon: <QuestionCircleOutlined />,
            description: config.faq?.description || '快速找到答案',
            badge: 0,
            action: 'navigate',
            url: config.faq?.url,
            path: '/faq',
            available: config.faq?.enabled || false,
          },
          {
            id: 'user-guide',
            title: '使用指南',
            icon: <FileTextOutlined />,
            description: config.userGuide?.description || '详细操作说明',
            badge: 0,
            action: 'navigate',
            url: config.userGuide?.url,
            path: '/guide',
            available: config.userGuide?.enabled || false,
          },
          {
            id: 'safety-tips',
            title: '安全提醒',
            icon: <SafetyOutlined />,
            description: '出行安全须知',
            badge: 0,
            action: 'navigate',
            path: '/safety',
            available: true,
          },
          {
            id: 'promotions',
            title: '优惠活动',
            icon: <GiftOutlined />,
            description: '最新优惠信息',
            badge: 0,
            action: 'navigate',
            path: '/promotions',
            available: true,
          },
          {
            id: 'notifications',
            title: '系统公告',
            icon: <BellOutlined />,
            description: '重要通知',
            badge: config.notices?.filter(n => !n.isRead).length || 0,
            action: 'navigate',
            path: '/announcements',
            available: true,
          },
          {
            id: 'feedback',
            title: '意见反馈',
            icon: <SettingOutlined />,
            description: '帮助我们改进',
            badge: 0,
            action: 'navigate',
            path: '/feedback',
            available: true,
          },
        ];
        
        setServiceEntries(entries);
      } else {
        // 如果API调用失败，使用默认配置
        setServiceEntries(getDefaultEntries());
      }
    } catch (error) {
      console.error('加载服务入口失败:', error);
      setServiceEntries(getDefaultEntries());
    } finally {
      setLoading(false);
    }
  };

  const getDefaultEntries = () => [
    {
      id: 'customer-service',
      title: '在线客服',
      icon: <CustomerServiceOutlined />,
      description: '7×24小时在线服务',
      badge: 0,
      action: 'chat',
      available: true,
    },
    {
      id: 'hotline',
      title: '客服热线',
      icon: <PhoneOutlined />,
      description: '95105105',
      badge: 0,
      action: 'call',
      available: true,
    },
    {
      id: 'faq',
      title: '常见问题',
      icon: <QuestionCircleOutlined />,
      description: '快速找到答案',
      badge: 0,
      action: 'navigate',
      path: '/faq',
      available: true,
    },
    {
      id: 'user-guide',
      title: '使用指南',
      icon: <FileTextOutlined />,
      description: '详细操作说明',
      badge: 0,
      action: 'navigate',
      path: '/guide',
      available: true,
    },
    {
      id: 'safety-tips',
      title: '安全提醒',
      icon: <SafetyOutlined />,
      description: '出行安全须知',
      badge: 0,
      action: 'navigate',
      path: '/safety',
      available: true,
    },
    {
      id: 'promotions',
      title: '优惠活动',
      icon: <GiftOutlined />,
      description: '最新优惠信息',
      badge: 0,
      action: 'navigate',
      path: '/promotions',
      available: true,
    },
    {
      id: 'notifications',
      title: '系统公告',
      icon: <BellOutlined />,
      description: '重要通知',
      badge: 0,
      action: 'navigate',
      path: '/announcements',
      available: true,
    },
    {
      id: 'feedback',
      title: '意见反馈',
      icon: <SettingOutlined />,
      description: '帮助我们改进',
      badge: 0,
      action: 'navigate',
      path: '/feedback',
      available: true,
    },
  ];
          icon: <SettingOutlined />,
          description: '帮助我们改进',
          badge: 0,
          action: 'navigate',
          path: '/feedback',
          available: true,
        },
      ];
      
      setServiceEntries(defaultEntries);
    } catch (error) {
      console.error('加载服务入口失败:', error);
      setServiceEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSystemConfig = async () => {
    try {
      // 调用 API-GET-SystemConfig 接口
      const response = await fetch('/api/system/config');
      if (response.ok) {
        const config = await response.json();
        setSystemConfig(config);
      }
    } catch (error) {
      console.error('获取系统配置失败:', error);
    }
  };

  const handleServiceClick = (service) => {
    if (!service.available) {
      return;
    }

    switch (service.action) {
      case 'chat':
        // TODO: 打开在线客服聊天窗口
        console.log('打开在线客服');
        break;
      case 'call':
        // TODO: 显示客服电话或直接拨打
        console.log('拨打客服电话:', service.description);
        break;
      case 'navigate':
        if (onServiceClick) {
          onServiceClick(service);
        } else {
          // TODO: 默认导航逻辑
          console.log('导航到:', service.path);
        }
        break;
      default:
        if (onServiceClick) {
          onServiceClick(service);
        }
    }
  };

  const renderServiceEntry = (service) => {
    return (
      <Col xs={12} sm={8} md={6} lg={6} xl={4} key={service.id}>
        <Button
          type="text"
          className={`service-entry-item ${!service.available ? 'disabled' : ''}`}
          onClick={() => handleServiceClick(service)}
          disabled={!service.available}
          style={{ 
            width: '100%', 
            height: 'auto', 
            padding: '16px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}
        >
          <div className="service-icon" style={{ fontSize: '24px', marginBottom: '8px' }}>
            <Badge count={service.badge} size="small">
              {service.icon}
            </Badge>
          </div>
          <div className="service-title" style={{ fontWeight: 'bold', marginBottom: '4px' }}>
            {service.title}
          </div>
          <div className="service-description" style={{ 
            fontSize: '12px', 
            color: '#666', 
            textAlign: 'center',
            lineHeight: '1.2'
          }}>
            {service.description}
          </div>
        </Button>
      </Col>
    );
  };

  if (loading) {
    return (
      <Card title="服务中心" className="service-entries-container">
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      </Card>
    );
  }

  return (
    <Card title="服务中心" className="service-entries-container">
      <Row gutter={[16, 16]}>
        {serviceEntries.map(renderServiceEntry)}
      </Row>
    </Card>
  );
};

export default ServiceEntries;