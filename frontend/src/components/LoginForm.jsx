import React, { useState } from 'react';
import { authAPI } from '../api';
import { Form, Input, Button, Tabs, Checkbox, message } from 'antd';
import { PhoneOutlined, LockOutlined, MailOutlined } from '@ant-design/icons';

const LoginForm = ({
  onLoginSuccess,
  onLoginError,
  onForgotPassword,
  initialValues
}) => {
  const [loading, setLoading] = useState(false);
  const [phoneForm] = Form.useForm();
  const [emailForm] = Form.useForm();

  const onFinish = async (values) => {
    console.log('=== 登录表单提交开始 ===');
    console.log('表单数据:', values);
    console.log('Loading状态:', loading);
    
    setLoading(true);
    
    try {
      console.log('=== 开始调用登录API ===');
      console.log('API调用参数:', {
        account: values.account,
        password: values.password
      });
      
      const result = await authAPI.login({
        account: values.account,
        password: values.password
      });
      
      console.log('=== 登录API响应成功 ===');
      console.log('响应结果:', result);
      
      // 保存登录信息
      if (result.token) {
        localStorage.setItem('authToken', result.token);
        console.log('Token已保存到localStorage');
      }
      if (result.user) {
        localStorage.setItem('userInfo', JSON.stringify(result.user));
        console.log('用户信息已保存到localStorage');
      }
      
      console.log('显示成功消息');
      message.success('登录成功！');
      
      if (onLoginSuccess) {
        console.log('调用onLoginSuccess回调');
        onLoginSuccess(result.user);
      }
    } catch (error) {
      console.log('=== 登录API响应失败 ===');
      console.error('登录错误详情:', error);
      console.error('错误响应:', error.response);
      console.error('错误消息:', error.message);
      
      const errorMessage = error.response?.data?.error || error.message || '登录失败，请稍后重试';
      console.log('准备显示错误信息:', errorMessage);
      message.error(errorMessage);
      
      if (onLoginError) {
        console.log('调用onLoginError回调');
        onLoginError(errorMessage);
      }
    } finally {
      console.log('=== 登录请求完成，重置loading状态 ===');
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    if (onForgotPassword) {
      onForgotPassword();
    }
  };

  const PhoneLoginForm = () => (
    <Form
      form={phoneForm}
      name="phone_login"
      onFinish={(values) => {
        console.log('PhoneLoginForm onFinish 被调用:', values);
        onFinish(values);
      }}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="account"
        rules={[
          { required: true, message: '请输入手机号!' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式!' }
        ]}
      >
        <Input
          prefix={<PhoneOutlined />}
          placeholder="手机号"
          maxLength={11}
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码!' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <Button type="link" onClick={handleForgotPassword} style={{ padding: 0 }}>
            忘记密码？
          </Button>
        </div>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  const EmailLoginForm = () => (
    <Form
      form={emailForm}
      name="email_login"
      onFinish={(values) => {
        console.log('EmailLoginForm onFinish 被调用:', values);
        onFinish(values);
      }}
      autoComplete="off"
      size="large"
    >
      <Form.Item
        name="account"
        rules={[
          { required: true, message: '请输入邮箱!' },
          { type: 'email', message: '请输入正确的邮箱格式!' }
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder="邮箱"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: '请输入密码!' }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder="密码"
        />
      </Form.Item>

      <Form.Item>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Form.Item name="remember" valuePropName="checked" noStyle>
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <Button type="link" onClick={handleForgotPassword} style={{ padding: 0 }}>
            忘记密码？
          </Button>
        </div>
      </Form.Item>

      <Form.Item>
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          onClick={() => {
            console.log('EmailLoginForm 登录按钮被点击');
            console.log('当前表单值:', emailForm.getFieldsValue());
          }}
        >
          登录
        </Button>
      </Form.Item>
    </Form>
  );

  return (
    <Tabs 
      defaultActiveKey="phone" 
      centered
      items={[
        {
          key: 'phone',
          label: '手机号登录',
          children: <PhoneLoginForm />
        },
        {
          key: 'email',
          label: '邮箱登录',
          children: <EmailLoginForm />
        }
      ]}
    />
  );
};

export default LoginForm;