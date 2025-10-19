import React, { useState, useEffect } from 'react';
import { DatePicker as AntDatePicker, Button, Space, Dropdown } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const DatePicker = ({ 
  value, 
  onChange, 
  minDate, 
  maxDate, 
  showQuickSelect = true 
}) => {
  const [selectedDate, setSelectedDate] = useState(value ? dayjs(value) : null);
  const [currentMonth, setCurrentMonth] = useState(dayjs());
  const [showCalendar, setShowCalendar] = useState(false);
  const [quickSelectOptions, setQuickSelectOptions] = useState([]);

  useEffect(() => {
    if (showQuickSelect) {
      generateQuickSelectOptions();
    }
  }, [showQuickSelect, minDate]);

  useEffect(() => {
    if (value) {
      setSelectedDate(dayjs(value));
    }
  }, [value]);

  const generateQuickSelectOptions = () => {
    const today = dayjs();
    const options = [
      {
        key: 'today',
        label: '今天',
        date: today,
        disabled: minDate && today.isBefore(dayjs(minDate)),
      },
      {
        key: 'tomorrow',
        label: '明天',
        date: today.add(1, 'day'),
        disabled: minDate && today.add(1, 'day').isBefore(dayjs(minDate)),
      },
      {
        key: 'dayAfterTomorrow',
        label: '后天',
        date: today.add(2, 'day'),
        disabled: minDate && today.add(2, 'day').isBefore(dayjs(minDate)),
      },
    ];

    // TODO: 从系统配置获取节假日信息
    // 临时不添加节假日选项
    setQuickSelectOptions(options.filter(option => !option.disabled));
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    if (onChange) {
      onChange(date ? date.format('YYYY-MM-DD') : '');
    }
    setShowCalendar(false);
  };

  const handleQuickSelect = (option) => {
    handleDateChange(option.date);
  };

  const disabledDate = (current) => {
    if (!current) return false;
    
    // 禁用过去的日期
    if (minDate && current.isBefore(dayjs(minDate))) {
      return true;
    }
    
    // 禁用超出预售期的日期
    if (maxDate && current.isAfter(dayjs(maxDate))) {
      return true;
    }
    
    // TODO: 从系统配置获取禁用日期
    return false;
  };

  const dateRender = (current) => {
    const date = current.date();
    const isToday = current.isSame(dayjs(), 'day');
    const isSelected = selectedDate && current.isSame(selectedDate, 'day');
    
    // TODO: 从系统配置获取节假日和票源紧张信息
    const isHoliday = false;
    const isTicketTight = false;
    
    let className = 'custom-date-cell';
    if (isToday) className += ' today';
    if (isSelected) className += ' selected';
    if (isHoliday) className += ' holiday';
    if (isTicketTight) className += ' ticket-tight';
    
    return (
      <div className={className}>
        <div className="date-number">{date}</div>
        {isHoliday && <div className="date-label holiday-label">假</div>}
        {isTicketTight && <div className="date-label tight-label">紧</div>}
      </div>
    );
  };

  const quickSelectDropdown = (
    <div className="quick-select-dropdown">
      {quickSelectOptions.map((option) => (
        <Button
          key={option.key}
          type="text"
          block
          onClick={() => handleQuickSelect(option)}
          className="quick-select-item"
        >
          <div className="quick-select-content">
            <span className="quick-label">{option.label}</span>
            <span className="quick-date">{option.date.format('MM-DD')}</span>
            <span className="quick-weekday">
              {option.date.format('dddd')}
            </span>
          </div>
        </Button>
      ))}
    </div>
  );

  return (
    <div className="custom-date-picker">
      <Space.Compact style={{ width: '100%' }}>
        <AntDatePicker
          value={selectedDate}
          onChange={handleDateChange}
          disabledDate={disabledDate}
          dateRender={dateRender}
          format="YYYY-MM-DD"
          placeholder="请选择日期"
          suffixIcon={<CalendarOutlined />}
          open={showCalendar}
          onOpenChange={setShowCalendar}
          style={{ flex: 1 }}
        />
        
        {showQuickSelect && quickSelectOptions.length > 0 && (
          <Dropdown
            overlay={quickSelectDropdown}
            trigger={['click']}
            placement="bottomRight"
          >
            <Button icon={<CalendarOutlined />} />
          </Dropdown>
        )}
      </Space.Compact>
    </div>
  );
};

export default DatePicker;