import React, { useState } from 'react';
import { Form, Button, Row, Col, Select, Checkbox, Space } from 'antd';
import { SwapOutlined, SearchOutlined } from '@ant-design/icons';
import StationSelector from './StationSelector';
import DatePicker from './DatePicker';

const { Option } = Select;

const TicketQueryForm = ({ onSearch, defaultValues, disabled = false }) => {
  const [form] = Form.useForm();
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  // 表单状态
  const [fromStation, setFromStation] = useState(defaultValues?.fromStation || '');
  const [toStation, setToStation] = useState(defaultValues?.toStation || '');
  const [departDate, setDepartDate] = useState(defaultValues?.departDate || '');
  const [returnDate, setReturnDate] = useState(defaultValues?.returnDate || '');
  const [passengerType, setPassengerType] = useState(defaultValues?.passengerType || 'adult');
  const [trainType, setTrainType] = useState(defaultValues?.trainType || 'all');
  const [onlyAvailable, setOnlyAvailable] = useState(defaultValues?.onlyAvailable || false);
  const [includeNoSeat, setIncludeNoSeat] = useState(defaultValues?.includeNoSeat || false);

  const handleSwapStations = () => {
    const temp = fromStation;
    setFromStation(toStation);
    setToStation(temp);
    form.setFieldsValue({
      fromStation: toStation,
      toStation: temp,
    });
  };

  const handleSubmit = async (values) => {
    try {
      setIsLoading(true);
      setErrors({});

      // 表单验证
      if (!fromStation || !toStation) {
        setErrors({ stations: '请选择出发地和目的地' });
        return;
      }

      if (fromStation === toStation) {
        setErrors({ stations: '出发地和目的地不能相同' });
        return;
      }

      if (!departDate) {
        setErrors({ date: '请选择出发日期' });
        return;
      }

      const searchParams = {
        fromStation,
        toStation,
        departDate,
        returnDate,
        passengerType,
        trainType,
        onlyAvailable,
        includeNoSeat,
      };

      // 调用搜索API并保存搜索历史
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // 保存搜索历史
          await fetch('/api/user/search-history', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              fromStation,
              toStation,
              departDate,
              returnDate,
              passengerType,
              trainType
            })
          });
        } catch (error) {
          console.warn('保存搜索历史失败:', error);
        }
      }
      
      if (onSearch) {
        onSearch(searchParams);
      }
    } catch (error) {
      setErrors({ submit: '查询失败，请重试' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="ticket-query-form">
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        disabled={disabled}
      >
        <Row gutter={[16, 16]}>
          {/* 出发地和目的地 */}
          <Col xs={24} md={10}>
            <Form.Item
              label="出发地"
              name="fromStation"
              validateStatus={errors.stations ? 'error' : ''}
            >
              <StationSelector
                value={fromStation}
                onChange={setFromStation}
                placeholder="请选择出发地"
                showHistory={true}
              />
            </Form.Item>
          </Col>
          
          <Col xs={24} md={2} className="swap-button-col">
            <Button
              type="text"
              icon={<SwapOutlined />}
              onClick={handleSwapStations}
              className="swap-button"
            />
          </Col>
          
          <Col xs={24} md={10}>
            <Form.Item
              label="目的地"
              name="toStation"
              validateStatus={errors.stations ? 'error' : ''}
              help={errors.stations}
            >
              <StationSelector
                value={toStation}
                onChange={setToStation}
                placeholder="请选择目的地"
                showHistory={true}
              />
            </Form.Item>
          </Col>

          {/* 出发日期 */}
          <Col xs={24} md={8}>
            <Form.Item
              label="出发日期"
              name="departDate"
              validateStatus={errors.date ? 'error' : ''}
              help={errors.date}
            >
              <DatePicker
                value={departDate}
                onChange={setDepartDate}
                minDate={new Date().toISOString().split('T')[0]}
                showQuickSelect={true}
              />
            </Form.Item>
          </Col>

          {/* 返程日期（可选） */}
          <Col xs={24} md={8}>
            <Form.Item label="返程日期（可选）" name="returnDate">
              <DatePicker
                value={returnDate}
                onChange={setReturnDate}
                minDate={departDate || new Date().toISOString().split('T')[0]}
                showQuickSelect={false}
              />
            </Form.Item>
          </Col>

          {/* 乘客类型 */}
          <Col xs={24} md={8}>
            <Form.Item label="乘客类型" name="passengerType">
              <Select value={passengerType} onChange={setPassengerType}>
                <Option value="adult">成人</Option>
                <Option value="child">儿童</Option>
                <Option value="student">学生</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* 车次类型 */}
          <Col xs={24} md={12}>
            <Form.Item label="车次类型" name="trainType">
              <Select value={trainType} onChange={setTrainType}>
                <Option value="all">全部</Option>
                <Option value="G">高速动车组(G)</Option>
                <Option value="D">动车组(D)</Option>
                <Option value="C">城际动车组(C)</Option>
                <Option value="Z">直达特快(Z)</Option>
                <Option value="T">特快(T)</Option>
                <Option value="K">快速(K)</Option>
              </Select>
            </Form.Item>
          </Col>

          {/* 查询选项 */}
          <Col xs={24} md={12}>
            <Form.Item label="查询选项">
              <Space direction="vertical">
                <Checkbox
                  checked={onlyAvailable}
                  onChange={(e) => setOnlyAvailable(e.target.checked)}
                >
                  只看有票
                </Checkbox>
                <Checkbox
                  checked={includeNoSeat}
                  onChange={(e) => setIncludeNoSeat(e.target.checked)}
                >
                  包含无座票
                </Checkbox>
              </Space>
            </Form.Item>
          </Col>

          {/* 查询按钮 */}
          <Col xs={24}>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                size="large"
                icon={<SearchOutlined />}
                loading={isLoading}
                block
                className="search-button"
              >
                查询车票
              </Button>
              {errors.submit && (
                <div className="error-message">{errors.submit}</div>
              )}
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </div>
  );
};

export default TicketQueryForm;