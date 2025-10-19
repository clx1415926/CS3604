import React, { useState, useEffect } from 'react';
import { Card, List, Tag, Button, Modal, Typography, Empty, Spin } from 'antd';
import { 
  BellOutlined, 
  ExclamationCircleOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Paragraph } = Typography;

const SystemNotice = ({ maxItems = 5, showReadStatus = true }) => {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadSystemNotices();
  }, []);

  const loadSystemNotices = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 从系统配置获取系统公告
      const response = await fetch(`/api/system/config?type=announcement&status=active&limit=${maxItems}`);
      
      if (response.ok) {
        const data = await response.json();
        const announcements = data.configs?.filter(config => 
          config.type === 'announcement' && config.status === 'active'
        ) || [];
        
        // 转换为前端需要的格式
        const formattedNotices = announcements.map(config => ({
          id: config.id || Math.random().toString(36).substr(2, 9),
          title: config.value?.title || '系统公告',
          content: config.value?.content || '',
          type: config.value?.type || 'info',
          priority: config.value?.priority || 'normal',
          publishTime: config.createdAt || new Date().toISOString(),
          isRead: false, // 默认未读，实际应该从用户状态获取
          author: config.value?.author || '系统管理员'
        }));
        
        setNotices(formattedNotices);
      } else {
        setNotices([]);
      }
    } catch (error) {
      console.error('加载系统公告失败:', error);
      setNotices([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadSystemNotices(true);
  };

  const handleNoticeClick = (notice) => {
    setSelectedNotice(notice);
    setModalVisible(true);
    
    // 标记为已读
    if (showReadStatus && !notice.isRead) {
      markAsRead(notice.id);
    }
  };

  const markAsRead = async (noticeId) => {
    try {
      // 调用标记已读的API
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`/api/user/notices/${noticeId}/read`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          console.warn('标记已读API调用失败，仅更新本地状态');
        }
      }
      
      // 更新本地状态
      setNotices(prev => 
        prev.map(notice => 
          notice.id === noticeId 
            ? { ...notice, isRead: true }
            : notice
        )
      );
    } catch (error) {
      console.error('标记已读失败:', error);
      // 即使API调用失败，也更新本地状态以提供更好的用户体验
      setNotices(prev => 
        prev.map(notice => 
          notice.id === noticeId 
            ? { ...notice, isRead: true }
            : notice
        )
      );
    }
  };

  const getNoticeIcon = (type) => {
    switch (type) {
      case 'warning':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'error':
        return <CloseCircleOutlined style={{ color: '#ff4d4f' }} />;
      case 'success':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'info':
      default:
        return <InfoCircleOutlined style={{ color: '#1890ff' }} />;
    }
  };

  const getNoticeTypeTag = (type) => {
    const typeConfig = {
      warning: { color: 'orange', text: '警告' },
      error: { color: 'red', text: '故障' },
      success: { color: 'green', text: '恢复' },
      info: { color: 'blue', text: '通知' },
      maintenance: { color: 'purple', text: '维护' },
    };

    const config = typeConfig[type] || typeConfig.info;
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const renderNoticeItem = (notice) => {
    const publishTime = dayjs(notice.publishTime);
    const isNew = publishTime.isAfter(dayjs().subtract(24, 'hour'));
    
    return (
      <List.Item
        className={`system-notice-item ${!notice.isRead && showReadStatus ? 'unread' : ''}`}
        onClick={() => handleNoticeClick(notice)}
        style={{ cursor: 'pointer' }}
        actions={[
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
          >
            查看
          </Button>
        ]}
      >
        <List.Item.Meta
          avatar={getNoticeIcon(notice.type)}
          title={
            <div className="notice-title">
              <span className="title-text">{notice.title}</span>
              {isNew && <Tag color="red" size="small">新</Tag>}
              {!notice.isRead && showReadStatus && (
                <div className="unread-indicator" />
              )}
            </div>
          }
          description={
            <div className="notice-meta">
              <div className="notice-summary">
                {notice.summary || notice.content.substring(0, 100) + '...'}
              </div>
              <div className="notice-info">
                {getNoticeTypeTag(notice.type)}
                <span className="publish-time">
                  {publishTime.format('YYYY-MM-DD HH:mm')}
                </span>
                {notice.priority === 'high' && (
                  <Tag color="red" size="small">重要</Tag>
                )}
              </div>
            </div>
          }
        />
      </List.Item>
    );
  };

  const cardExtra = (
    <Button
      type="text"
      icon={<ReloadOutlined spin={refreshing} />}
      onClick={handleRefresh}
      disabled={refreshing}
      size="small"
    >
      刷新
    </Button>
  );

  return (
    <>
      <Card 
        title={
          <span>
            <BellOutlined style={{ marginRight: 8 }} />
            系统公告
          </span>
        }
        extra={cardExtra}
        className="system-notice-container"
      >
        {loading ? (
          <div>
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} style={{ marginBottom: 16 }}>
                <Spin size="small" style={{ marginRight: 8 }} />
                <span>加载中...</span>
              </div>
            ))}
          </div>
        ) : notices.length === 0 ? (
          <Empty 
            description="暂无系统公告" 
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <List
            dataSource={notices.slice(0, maxItems)}
            renderItem={renderNoticeItem}
            className="system-notice-list"
          />
        )}
      </Card>

      <Modal
        title={
          <div className="notice-modal-title">
            {selectedNotice && getNoticeIcon(selectedNotice.type)}
            <span style={{ marginLeft: 8 }}>
              {selectedNotice?.title}
            </span>
          </div>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={600}
      >
        {selectedNotice && (
          <div className="notice-modal-content">
            <div className="notice-modal-meta">
              {getNoticeTypeTag(selectedNotice.type)}
              <span className="publish-time">
                发布时间: {dayjs(selectedNotice.publishTime).format('YYYY-MM-DD HH:mm:ss')}
              </span>
              {selectedNotice.effectiveTime && (
                <span className="effective-time">
                  生效时间: {dayjs(selectedNotice.effectiveTime).format('YYYY-MM-DD HH:mm:ss')}
                </span>
              )}
            </div>
            
            <Paragraph className="notice-content">
              {selectedNotice.content}
            </Paragraph>
            
            {selectedNotice.attachments && selectedNotice.attachments.length > 0 && (
              <div className="notice-attachments">
                <h4>相关附件:</h4>
                {selectedNotice.attachments.map((attachment, index) => (
                  <Button 
                    key={index} 
                    type="link" 
                    onClick={() => window.open(attachment.url)}
                  >
                    {attachment.name}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
};

export default SystemNotice;