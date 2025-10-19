import React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import LoginForm from '../components/LoginForm'

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLoginSuccess = (user) => {
    console.log('登录成功，用户信息:', user);
    // 可以跳转到主页或其他页面
    // navigate('/');
  };

  const handleLoginError = (error) => {
    console.log('登录失败:', error);
  };

  return (
    <div className="page-container">
      <div className="form-container">
        <h2 className="form-title">用户登录</h2>
        <LoginForm 
          onLoginSuccess={handleLoginSuccess}
          onLoginError={handleLoginError}
        />
        <div className="form-footer">
          <Link to="/register">还没有账号？立即注册</Link>
        </div>
      </div>
    </div>
  )
}

export default LoginPage