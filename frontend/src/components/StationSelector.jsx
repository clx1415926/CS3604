import React, { useState, useEffect, useRef } from 'react';
import { Input, Dropdown, Spin, Empty, Divider } from 'antd';
import { EnvironmentOutlined, ClockCircleOutlined } from '@ant-design/icons';

const StationSelector = ({ 
  value, 
  onChange, 
  placeholder = '请选择车站', 
  showHistory = true 
}) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [hotCities, setHotCities] = useState([]);
  const [recentStations, setRecentStations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    if (searchKeyword.length >= 1) {
      searchStations(searchKeyword);
    } else {
      setSuggestions([]);
    }
  }, [searchKeyword]);

  useEffect(() => {
    // TODO: 加载热门城市和最近车站
    loadHotCities();
    if (showHistory) {
      loadRecentStations();
    }
  }, [showHistory]);

  const searchStations = async (keyword) => {
    try {
      setIsLoading(true);
      // 调用 API-GET-StationsSearch 接口
      const response = await fetch(`/api/stations/search?keyword=${encodeURIComponent(keyword)}`);
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.stations || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('搜索车站失败:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadHotCities = async () => {
    try {
      // 调用 API-GET-HotCities 接口
      const response = await fetch('/api/cities/hot');
      if (response.ok) {
        const data = await response.json();
        setHotCities(data.cities || []);
      }
    } catch (error) {
      console.error('加载热门城市失败:', error);
    }
  };

  const loadRecentStations = async () => {
    try {
      // 调用 API-GET-UserRecentStations 接口
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/user/recent-stations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentStations(data.stations || []);
      }
    } catch (error) {
      console.error('加载最近车站失败:', error);
    }
  };

  const handleInputChange = (e) => {
    const keyword = e.target.value;
    setSearchKeyword(keyword);
    if (!showDropdown) {
      setShowDropdown(true);
    }
  };

  const handleStationSelect = (station) => {
    onChange(station.code);
    setSearchKeyword(station.name);
    setShowDropdown(false);
    inputRef.current?.blur();
  };

  const handleInputFocus = () => {
    setShowDropdown(true);
  };

  const handleInputBlur = () => {
    // 延迟关闭下拉框，允许点击选项
    setTimeout(() => {
      setShowDropdown(false);
    }, 200);
  };

  const renderDropdownContent = () => {
    if (isLoading) {
      return (
        <div className="station-selector-loading">
          <Spin size="small" />
          <span style={{ marginLeft: 8 }}>搜索中...</span>
        </div>
      );
    }

    if (searchKeyword && suggestions.length === 0) {
      return <Empty description="未找到相关车站" size="small" />;
    }

    return (
      <div className="station-selector-dropdown">
        {/* 搜索结果 */}
        {searchKeyword && suggestions.length > 0 && (
          <div className="suggestions-section">
            <div className="section-title">搜索结果</div>
            {suggestions.map((station) => (
              <div
                key={station.code}
                className="station-item"
                onClick={() => handleStationSelect(station)}
              >
                <EnvironmentOutlined className="station-icon" />
                <div className="station-info">
                  <div className="station-name">{station.name}</div>
                  <div className="station-detail">{station.city} · {station.province}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 最近使用的车站 */}
        {!searchKeyword && showHistory && recentStations.length > 0 && (
          <div className="recent-section">
            <div className="section-title">
              <ClockCircleOutlined /> 最近使用
            </div>
            {recentStations.map((station) => (
              <div
                key={station.code}
                className="station-item"
                onClick={() => handleStationSelect(station)}
              >
                <EnvironmentOutlined className="station-icon" />
                <div className="station-info">
                  <div className="station-name">{station.name}</div>
                  <div className="station-detail">{station.city}</div>
                </div>
              </div>
            ))}
            <Divider style={{ margin: '8px 0' }} />
          </div>
        )}

        {/* 热门城市 */}
        {!searchKeyword && hotCities.length > 0 && (
          <div className="hot-cities-section">
            <div className="section-title">热门城市</div>
            <div className="cities-grid">
              {hotCities.map((city) => (
                <div
                  key={city.code}
                  className="city-item"
                  onClick={() => handleStationSelect(city)}
                >
                  {city.name}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 无内容时的提示 */}
        {!searchKeyword && recentStations.length === 0 && hotCities.length === 0 && (
          <Empty description="暂无数据" size="small" />
        )}
      </div>
    );
  };

  return (
    <Dropdown
      open={showDropdown}
      dropdownRender={renderDropdownContent}
      trigger={[]}
      placement="bottomLeft"
      overlayClassName="station-selector-overlay"
    >
      <Input
        ref={inputRef}
        value={searchKeyword}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        placeholder={placeholder}
        prefix={<EnvironmentOutlined />}
        allowClear
      />
    </Dropdown>
  );
};

export default StationSelector;