import React, { useState, useEffect } from 'react';
import { authAPI } from '../api';
import { Form, Input, Button, message } from 'antd';
import { UserOutlined, LockOutlined, PhoneOutlined, MailOutlined, IdcardOutlined } from '@ant-design/icons';

const RegisterForm = ({
  onRegisterSuccess,
  onRegisterError,
  initialValues
}) => {
  const [loading, setLoading] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [form] = Form.useForm();

  useEffect(() => {
    let timer;
    if (codeCountdown > 0) {
      timer = setTimeout(() => {
        setCodeCountdown(codeCountdown - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [codeCountdown]);

  const sendVerificationCode = async () => {
    try {
      const phoneNumber = form.getFieldValue('phoneNumber');
      if (!phoneNumber) {
        message.error('请先输入手机号');
        return;
      }
      
      // 验证手机号格式
      const phoneRegex = /^1[3-9]\d{9}$/;
      if (!phoneRegex.test(phoneNumber)) {
        message.error('请输入正确的手机号格式');
        return;
      }
      
      await authAPI.sendVerificationCode({ 
        phoneNumber, 
        type: 'register' 
      });
      message.success('验证码已发送');
      setCodeCountdown(60);
    } catch (error) {
      message.error(error.response?.data?.error || '发送验证码失败');
    }
  };

  const onFinish = async (values) => {
    setLoading(true);
    
    try {
      const result = await authAPI.register({
        phoneNumber: values.phoneNumber,
        email: values.email,
        verificationCode: values.verificationCode,
        password: values.password,
        realName: values.realName,
        idCard: values.idCard
      });
      
      message.success('注册成功！');
      
      if (onRegisterSuccess) {
        onRegisterSuccess();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.error || error.message || '注册失败，请稍后重试';
      message.error(errorMessage);
      
      if (onRegisterError) {
        onRegisterError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      name="register"
      onFinish={onFinish}
      autoComplete="off"
      className="register-form"
      layout="vertical"
      initialValues={initialValues}
    >
      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>手机号</span>}
        name="phoneNumber"
        rules={[
          { required: true, message: '请输入手机号!' },
          { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式!' }
        ]}
      >
        <Input
          className="register-input"
          prefix={<PhoneOutlined />}
          placeholder="请输入手机号"
          maxLength={11}
        />
      </Form.Item>

      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>邮箱</span>}
        name="email"
        rules={[
          { required: true, message: '请输入邮箱!' },
          { type: 'email', message: '请输入正确的邮箱格式!' }
        ]}
      >
        <Input
          className="register-input"
          prefix={<MailOutlined />}
          placeholder="请输入邮箱地址"
        />
      </Form.Item>

      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>验证码</span>}
        name="verificationCode"
        rules={[{ required: true, message: '请输入验证码!' }]}
      >
        <Input
          className="register-verification-input"
          placeholder="请输入验证码"
          addonAfter={
            <Button 
              className="register-verification-btn"
              onClick={sendVerificationCode}
              disabled={codeCountdown > 0}
            >
              {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
            </Button>
          }
        />
      </Form.Item>

      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>密码</span>}
        name="password"
        rules={[
          { required: true, message: '请输入密码!' },
          { min: 6, message: '密码至少6位!' }
        ]}
      >
        <Input.Password
          className="register-password-input"
          prefix={<LockOutlined />}
          placeholder="请输入密码"
        />
      </Form.Item>

      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>确认密码</span>}
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: '请确认密码!' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次输入的密码不一致!'));
            },
          }),
        ]}
      >
        <Input.Password
          className="register-password-input"
          prefix={<LockOutlined />}
          placeholder="请再次输入密码"
        />
      </Form.Item>

      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>真实姓名</span>}
        name="realName"
        rules={[{ required: true, message: '请输入真实姓名!' }]}
      >
        <Input
          className="register-input"
          prefix={<UserOutlined />}
          placeholder="请输入真实姓名"
        />
      </Form.Item>

      <Form.Item
        label={<span className="register-form-label"><span className="required">*</span>身份证号</span>}
        name="idCard"
        rules={[
          { required: true, message: '请输入身份证号!' },
          { pattern: /^[1-9]\d{5}(19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/, message: '请输入正确的身份证号格式!' }
        ]}
      >
        <Input
          className="register-input"
          prefix={<IdcardOutlined />}
          placeholder="请输入身份证号"
          maxLength={18}
        />
      </Form.Item>

      <Form.Item className="register-button-item">
        <Button 
          type="primary" 
          htmlType="submit" 
          loading={loading} 
          block
          className="register-button"
        >
          注册
        </Button>
      </Form.Item>
    </Form>
  );
};

export default RegisterForm;