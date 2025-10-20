import React from 'react'
import { Link } from 'react-router-dom'
import { Row, Col } from 'antd'
import RegisterForm from '../components/RegisterForm'
import './RegisterPage.css'

const RegisterPage = () => {
  return (
    <div className="register-page">
      {/* 页面头部 - 12306官方导航栏 */}
      <div className="register-page-header">
        <div className="register-header-content">
          <div className="register-header-left">
            <div className="register-site-logo">
              <div className="register-site-logo-icon">
                12306
              </div>
              <div className="register-site-name">中国铁路12306</div>
            </div>
          </div>
          <div className="register-header-right">
            <div className="register-header-nav">
              <Link to="/" className="register-nav-link">首页</Link>
              <Link to="/login" className="register-nav-link">登录</Link>
              <a href="#" className="register-nav-link">帮助</a>
            </div>
          </div>
        </div>
      </div>

      {/* 主要内容区域 */}
      <div className="register-page-main">
        <div className="register-bg-decoration">
          <div className="register-bg-pattern"></div>
        </div>
        
        <div className="register-container">
          <div className="register-content">
            <div className="register-form-container">
              {/* 注册头部 - Logo 和标题区域 */}
              <div className="register-header">
                <div className="register-logo-section">
                  <div className="register-logo-icon">
                    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect width="40" height="40" rx="20" fill="white" fillOpacity="0.2"/>
                      <path d="M12 14h16v2H12v-2zm0 4h16v2H12v-2zm0 4h12v2H12v-2z" fill="white"/>
                      <circle cx="26" cy="24" r="2" fill="white"/>
                    </svg>
                  </div>
                  <div className="register-logo-text">
                    <div className="register-main-title">中国铁路12306</div>
                    <div className="register-sub-title">China Railway</div>
                  </div>
                </div>
              </div>

              {/* 注册表单包装器 */}
              <div className="register-form-wrapper">
                <div className="register-info-title">用户注册</div>
                <RegisterForm />
              </div>

              {/* 登录提示区域 */}
              <div className="register-login-prompt">
                <span className="register-login-text">已有账号？</span>
                <Link to="/login" className="register-login-link">立即登录</Link>
              </div>

              {/* 底部链接区域 */}
              <div className="register-footer">
                <Row gutter={[16, 8]} justify="center">
                  <Col>
                    <a href="#" className="register-footer-link">网站声明</a>
                  </Col>
                  <Col>
                    <span className="register-divider">|</span>
                  </Col>
                  <Col>
                    <a href="#" className="register-footer-link">法律声明</a>
                  </Col>
                  <Col>
                    <span className="register-divider">|</span>
                  </Col>
                  <Col>
                    <a href="#" className="register-footer-link">帮助中心</a>
                  </Col>
                  <Col>
                    <span className="register-divider">|</span>
                  </Col>
                  <Col>
                    <a href="#" className="register-footer-link">意见建议</a>
                  </Col>
                </Row>
                
                <div className="register-service-info">
                  <p>客服电话：12306</p>
                  <p>服务时间：7:00-23:00</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 页面底部 */}
      <div className="register-page-footer">
        <div className="register-footer-content">
          <div className="register-footer-links">
            <a href="#">关于我们</a>
            <a href="#">联系我们</a>
            <a href="#">法律声明</a>
            <a href="#">隐私政策</a>
            <a href="#">网站地图</a>
          </div>
          <div className="register-copyright">
            © 2024 中国铁路12306 版权所有
          </div>
        </div>
      </div>
    </div>
  )
}

export default RegisterPage