import React, { useState } from 'react';
import { Form, Input, Button, Tabs, Select, Checkbox, message, Row, Col } from 'antd';
import { PhoneOutlined, LockOutlined, IdcardOutlined, SafetyOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { authAPI } from '../api';
import './LoginForm.css';

const { Option } = Select;

const LoginForm = ({ onLoginSuccess, onLoginError, onForgotPassword }) => {
  const [loading, setLoading] = useState(false);
  const [phoneForm] = Form.useForm();
  const [idForm] = Form.useForm();
  const [loginType, setLoginType] = useState('phone');
  const [idType, setIdType] = useState('身份证');
  const [rememberMe, setRememberMe] = useState(false);

  const handleLogin = async (values, type) => {
    setLoading(true);
    try {
      console.log(`${type} 登录请求:`, values);
      
      const loginData = {
        ...values,
        loginType: type
      };
      
      const response = await authAPI.login(loginData);
      console.log('登录响应:', response);
      
      if (response.success) {
        message.success('登录成功！');
        if (rememberMe) {
          localStorage.setItem('rememberLogin', 'true');
        }
        if (onLoginSuccess) {
          onLoginSuccess(response.data);
        }
      } else {
        message.error(response.message || '登录失败');
        if (onLoginError) {
          onLoginError(response.message);
        }
      }
    } catch (error) {
      console.error('登录错误:', error);
      const errorMessage = error.response?.data?.message || error.message || '登录失败，请稍后重试';
      message.error(errorMessage);
      if (onLoginError) {
        onLoginError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneLogin = (values) => {
    handleLogin(values, 'phone');
  };

  const handleIdLogin = (values) => {
    handleLogin(values, 'id');
  };

  const handleForgotPassword = () => {
    message.info('请联系客服或前往12306官网找回密码');
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  const handleTabChange = (key) => {
    setLoginType(key);
    // 清空表单
    if (key === 'phone') {
      phoneForm.resetFields();
    } else {
      idForm.resetFields();
    }
  };

  const validatePhone = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入手机号'));
    }
    if (!/^1[3-9]\d{9}$/.test(value)) {
      return Promise.reject(new Error('请输入正确的手机号格式'));
    }
    return Promise.resolve();
  };

  const validateIdNumber = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入证件号码'));
    }
    if (idType === '身份证') {
      if (!/^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/.test(value)) {
        return Promise.reject(new Error('请输入正确的身份证号码'));
      }
    }
    return Promise.resolve();
  };

  const validatePassword = (_, value) => {
    if (!value) {
      return Promise.reject(new Error('请输入密码'));
    }
    if (value.length < 6) {
      return Promise.reject(new Error('密码长度不能少于6位'));
    }
    return Promise.resolve();
  };

  // 手机号登录表单
  const PhoneLoginForm = () => (
    <Form
      form={phoneForm}
      name="phone_login"
      onFinish={handlePhoneLogin}
      autoComplete="off"
      className="login-form"
      layout="vertical"
    >
      <div className="account-info-title">账户信息</div>
      
      <Form.Item
        label={<span className="form-label"><span className="required">*</span>用户名</span>}
        name="phone"
        rules={[
          { validator: validatePhone }
        ]}
      >
        <Input
          className="login-input"
          prefix={<PhoneOutlined className="input-icon" />}
          placeholder="手机号"
          maxLength={11}
        />
      </Form.Item>

      <Form.Item
        label={<span className="form-label"><span className="required">*</span>密码</span>}
        name="password"
        rules={[
          { validator: validatePassword }
        ]}
      >
        <Input.Password
          className="login-input"
          prefix={<LockOutlined className="input-icon" />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item className="form-options">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox 
            className="remember-checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          >
            记住用户名
          </Checkbox>
          <Button type="link" onClick={handleForgotPassword} className="forgot-link">
            忘记密码？
          </Button>
        </div>
      </Form.Item>

      <Form.Item className="login-button-item">
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          className="login-button"
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  // 证件登录表单
  const IdLoginForm = () => (
    <Form
      form={idForm}
      name="id_login"
      onFinish={handleIdLogin}
      autoComplete="off"
      className="login-form"
      layout="vertical"
    >
      <div className="account-info-title">账户信息</div>
      
      <Form.Item
        label={<span className="form-label"><span className="required">*</span>证件类型</span>}
        name="idType"
        rules={[{ required: true, message: '请选择证件类型!' }]}
        initialValue="身份证"
      >
        <Select 
          className="id-type-select" 
          placeholder="请选择证件类型"
          onChange={(value) => setIdType(value)}
        >
          <Option value="身份证">身份证</Option>
          <Option value="护照">护照</Option>
          <Option value="港澳通行证">港澳通行证</Option>
          <Option value="台湾通行证">台湾通行证</Option>
        </Select>
      </Form.Item>

      <Form.Item
        label={<span className="form-label"><span className="required">*</span>证件号码</span>}
        name="idNumber"
        rules={[
          { validator: validateIdNumber }
        ]}
      >
        <Input
          className="login-input"
          prefix={<IdcardOutlined className="input-icon" />}
          placeholder="证件号码"
          maxLength={18}
        />
      </Form.Item>

      <Form.Item
        label={<span className="form-label"><span className="required">*</span>密码</span>}
        name="password"
        rules={[
          { validator: validatePassword }
        ]}
      >
        <Input.Password
          className="login-input"
          prefix={<LockOutlined className="input-icon" />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item className="form-options">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox 
            className="remember-checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMe(e.target.checked)}
          >
            记住用户名
          </Checkbox>
          <Button type="link" onClick={handleForgotPassword} className="forgot-link">
            忘记密码？
          </Button>
        </div>
      </Form.Item>

      <Form.Item className="login-button-item">
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          className="login-button"
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <div className="login-form-container">
      {/* 12306 Logo 和标题 */}
      <div className="login-header">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="15" fill="#ff6b35"/>
              <text x="16" y="21" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">12306</text>
            </svg>
          </div>
          <div className="logo-text">
            <div className="main-title">中国铁路12306</div>
            <div className="sub-title">12306 CHINA RAILWAY</div>
          </div>
        </div>
      </div>

      {/* 登录表单区域 */}
      <div className="login-form-wrapper">
        <Tabs 
          activeKey={loginType}
          onChange={handleTabChange}
          centered={false}
          className="login-tabs"
          items={[
            {
              key: 'phone',
              label: (
                <span className="tab-label">
                  <PhoneOutlined />
                  账号登录
                </span>
              ),
              children: <PhoneLoginForm />
            },
            {
              key: 'qr',
              label: (
                <span className="tab-label">
                  <SafetyOutlined />
                  扫码登录
                </span>
              ),
              children: (
                <div className="qr-login-section">
                  <div className="qr-code-placeholder">
                    <div className="qr-icon">
                      <SafetyOutlined style={{ fontSize: '48px', color: '#ccc' }} />
                    </div>
                    <p>请使用铁路12306手机客户端扫码登录</p>
                    <div className="qr-tips">
                      <p>1. 请确保您的手机已安装并登录12306客户端</p>
                      <p>2. 打开12306手机客户端，点击右上角扫一扫</p>
                      <p>3. 扫描上方二维码即可完成登录</p>
                      <p>4. 如果您尚未安装12306手机客户端，可前往各大应用商店搜索"铁路12306"下载安装</p>
                      <p>5. 首次使用需要在手机客户端完成注册和实名认证</p>
                    </div>
                  </div>
                </div>
              )
            }
          ]}
        />
      </div>

      {/* 注册提示区域 */}
      <div className="register-prompt">
        <span className="register-text">没有账号？</span>
        <Link to="/register" className="register-link">立即注册</Link>
      </div>

      {/* 底部链接区域 */}
      <div className="login-footer">
        <Row gutter={[16, 8]} justify="center">
          <Col>
            <a href="#" className="footer-link">网站声明</a>
          </Col>
          <Col>
            <span className="divider">|</span>
          </Col>
          <Col>
            <a href="#" className="footer-link">法律声明</a>
          </Col>
          <Col>
            <span className="divider">|</span>
          </Col>
          <Col>
            <a href="#" className="footer-link">帮助中心</a>
          </Col>
          <Col>
            <span className="divider">|</span>
          </Col>
          <Col>
            <a href="#" className="footer-link">意见建议</a>
          </Col>
        </Row>
        
        <div className="service-info">
          <p>客服电话：12306</p>
          <p>服务时间：7:00-23:00</p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;