import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Empty, Popconfirm, Space } from 'antd';
import { 
  HistoryOutlined, 
  DeleteOutlined, 
  ClearOutlined,
  ArrowRightOutlined,
  CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const SearchHistory = ({ onHistorySelect, maxItems = 10 }) => {
  const [searchHistory, setSearchHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSearchHistory();
  }, []);

  const loadSearchHistory = async () => {
    try {
      setLoading(true);
      // 调用 API-GET-UserSearchHistory 接口
      const token = localStorage.getItem('token');
      if (!token) {
        setSearchHistory([]);
        return;
      }
      
      const response = await fetch(`/api/user/search-history?limit=${maxItems}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        // 转换数据格式以匹配组件期望的格式
        const formattedHistory = (data.history || []).map(item => ({
          id: item.id,
          fromStation: item.origin,
          toStation: item.destination,
          fromStationCode: item.originCode || item.origin,
          toStationCode: item.destinationCode || item.destination,
          searchTime: item.searchTime,
          searchDate: new Date(item.searchTime).toISOString().split('T')[0],
          frequency: item.frequency
        }));
        setSearchHistory(formattedHistory);
      } else {
        setSearchHistory([]);
      }
    } catch (error) {
      console.error('加载搜索历史失败:', error);
      setSearchHistory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleHistoryClick = (historyItem) => {
    if (onHistorySelect) {
      onHistorySelect({
        from: historyItem.fromStation,
        to: historyItem.toStation,
        fromCode: historyItem.fromStationCode,
        toCode: historyItem.toStationCode,
        date: historyItem.searchDate,
      });
    }
  };

  const handleDeleteHistory = async (historyId, event) => {
    event.stopPropagation();
    
    try {
      // 调用删除单条历史记录的API
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch(`/api/user/search-history/${historyId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.warn('删除历史记录API调用失败，仅更新本地状态');
        }
      }
      
      // 更新本地状态
      setSearchHistory(prev => prev.filter(item => item.id !== historyId));
    } catch (error) {
      console.error('删除历史记录失败:', error);
      // 即使API调用失败，也更新本地状态
      setSearchHistory(prev => prev.filter(item => item.id !== historyId));
    }
  };

  const handleClearAllHistory = async () => {
    try {
      // 调用清空所有历史记录的API
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/user/search-history', {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          console.warn('清空历史记录API调用失败，仅更新本地状态');
        }
      }
      
      // 更新本地状态
      setSearchHistory([]);
    } catch (error) {
      console.error('清空历史记录失败:', error);
      // 即使API调用失败，也更新本地状态
      setSearchHistory([]);
    }
  };

  const renderHistoryItem = (historyItem) => {
    const searchTime = dayjs(historyItem.searchTime);
    const isToday = searchTime.isSame(dayjs(), 'day');
    const timeDisplay = isToday 
      ? searchTime.format('HH:mm')
      : searchTime.format('MM-DD HH:mm');

    return (
      <List.Item
        className="search-history-item"
        onClick={() => handleHistoryClick(historyItem)}
        style={{ cursor: 'pointer' }}
        actions={[
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => handleDeleteHistory(historyItem.id, e)}
            danger
          />
        ]}
      >
        <div className="history-content">
          <div className="history-route">
            <span className="from-station">{historyItem.fromStation}</span>
            <ArrowRightOutlined className="route-arrow" />
            <span className="to-station">{historyItem.toStation}</span>
          </div>
          
          <div className="history-details">
            <Space size="small">
              <Tag icon={<CalendarOutlined />} color="blue">
                {historyItem.searchDate}
              </Tag>
              <span className="search-time">{timeDisplay}</span>
              {historyItem.passengerType && (
                <Tag size="small">{historyItem.passengerType}</Tag>
              )}
            </Space>
          </div>
        </div>
      </List.Item>
    );
  };

  const cardExtra = searchHistory.length > 0 && (
    <Popconfirm
      title="确定要清空所有搜索历史吗？"
      onConfirm={handleClearAllHistory}
      okText="确定"
      cancelText="取消"
    >
      <Button
        type="text"
        icon={<ClearOutlined />}
        size="small"
        danger
      >
        清空
      </Button>
    </Popconfirm>
  );

  return (
    <Card 
      title={
        <span>
          <HistoryOutlined style={{ marginRight: 8 }} />
          搜索历史
        </span>
      }
      extra={cardExtra}
      className="search-history-container"
    >
      {loading ? (
        <div>加载中...</div>
      ) : searchHistory.length === 0 ? (
        <Empty 
          description="暂无搜索历史" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={searchHistory.slice(0, maxItems)}
          renderItem={renderHistoryItem}
          className="search-history-list"
        />
      )}
    </Card>
  );
};

export default SearchHistory;