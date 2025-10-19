import React, { useState, useEffect } from 'react';
import { Card, List, Button, Tag, Skeleton, Empty } from 'antd';
import { FireOutlined, ArrowRightOutlined, ReloadOutlined } from '@ant-design/icons';

const HotRoutes = ({ onRouteSelect, maxItems = 10 }) => {
  const [hotRoutes, setHotRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHotRoutes();
  }, []);

  const loadHotRoutes = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // 调用 API-GET-HotRoutes 接口
      const response = await fetch(`/api/routes/hot?limit=${maxItems}`);
      if (response.ok) {
        const data = await response.json();
        setHotRoutes(data.routes || []);
      } else {
        setHotRoutes([]);
      }
    } catch (error) {
      console.error('加载热门路线失败:', error);
      setHotRoutes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadHotRoutes(true);
  };

  const handleRouteClick = (route) => {
    if (onRouteSelect) {
      onRouteSelect({
        from: route.fromStation,
        to: route.toStation,
        fromCode: route.fromStationCode,
        toCode: route.toStationCode,
      });
    }
  };

  const renderRouteItem = (route) => {
    const priceRange = route.minPrice === route.maxPrice 
      ? `¥${route.minPrice}` 
      : `¥${route.minPrice}-${route.maxPrice}`;

    return (
      <List.Item
        className="hot-route-item"
        onClick={() => handleRouteClick(route)}
        style={{ cursor: 'pointer' }}
      >
        <div className="route-content">
          <div className="route-stations">
            <span className="from-station">{route.fromStation}</span>
            <ArrowRightOutlined className="route-arrow" />
            <span className="to-station">{route.toStation}</span>
          </div>
          
          <div className="route-info">
            <div className="route-stats">
              <Tag color="red" icon={<FireOutlined />}>
                热度 {route.popularity}
              </Tag>
              <span className="route-price">{priceRange}</span>
            </div>
            
            <div className="route-details">
              <span className="route-distance">{route.distance}km</span>
              <span className="route-duration">约{route.duration}小时</span>
              {route.hasHighSpeed && (
                <Tag color="blue" size="small">高铁</Tag>
              )}
            </div>
          </div>
        </div>
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
    <Card 
      title={
        <span>
          <FireOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />
          热门路线
        </span>
      }
      extra={cardExtra}
      className="hot-routes-container"
    >
      {loading ? (
        <div>
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} active paragraph={{ rows: 2 }} style={{ marginBottom: 16 }} />
          ))}
        </div>
      ) : hotRoutes.length === 0 ? (
        <Empty 
          description="暂无热门路线数据" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <List
          dataSource={hotRoutes.slice(0, maxItems)}
          renderItem={renderRouteItem}
          className="hot-routes-list"
        />
      )}
    </Card>
  );
};

export default HotRoutes;