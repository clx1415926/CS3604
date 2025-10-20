import React from 'react';
import LoginForm from '../components/LoginForm';
import './LoginPage.css';

const LoginPage = () => {
  return (
    <div className="login-page">
      {/* 页面头部 - 12306官方导航栏 */}
      <header className="page-header">
        <div className="header-content">
          <div className="header-left">
            <div className="site-logo">
              <div className="site-logo-icon">
                中国
              </div>
              <span className="site-name">中国铁路12306</span>
            </div>
          </div>
          <div className="header-right">
            <nav className="header-nav">
              <a href="#" className="nav-link">购票</a>
              <a href="#" className="nav-link">餐饮</a>
              <a href="#" className="nav-link">旅游</a>
              <a href="#" className="nav-link">客运服务</a>
            </nav>
            <span className="welcome-text">欢迎登录</span>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="page-main">
        {/* 背景装饰 */}
        <div className="bg-decoration">
          <div className="bg-pattern"></div>
        </div>

        {/* 登录表单容器 */}
        <div className="login-container">
          <div className="login-content">
            <LoginForm />
          </div>
        </div>

        {/* 侧边信息区域 */}
        <div className="side-info">
          <div className="info-card">
            <h3>铁路畅行</h3>
            <p>中国铁路客户服务中心，为您提供便捷的购票服务</p>
            
            <div className="service-features">
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>全国铁路客票预订</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>列车时刻表查询</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>余票信息查询</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>在线支付购票</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">✓</div>
                <span>改签退票服务</span>
              </div>
            </div>

            <div className="download-section">
              <p>扫码下载铁路12306APP</p>
              <div className="qr-code-area">
                <div className="qr-item">
                  <div className="qr-placeholder">
                    <span className="qr-icon">📱</span>
                  </div>
                  <p>手机APP</p>
                </div>
                <div className="qr-item">
                  <div className="qr-placeholder">
                    <span className="qr-icon">💻</span>
                  </div>
                  <p>微信小程序</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 页面底部 */}
      <footer className="page-footer">
        <div className="footer-content">
          {/* 友情链接 */}
          <div className="footer-links">
            <div className="link-group">
              <h4>友情链接</h4>
              <div className="links">
                <a href="#">中国铁路总公司</a>
                <a href="#">中国铁道科学研究院集团有限公司</a>
                <a href="#">中铁程科技有限责任公司</a>
                <a href="#">中国铁路信息科技有限责任公司</a>
                <a href="#">铁科院电子所</a>
                <a href="#">12306 公众号</a>
                <a href="#">铁路12306</a>
                <a href="#">问询12306</a>
              </div>
            </div>
          </div>

          {/* 底部信息区域 */}
          <div className="footer-info">
            {/* APP下载提示 */}
            <div className="app-download">
              <p>
                中国铁路客户服务中心(12306网)为您提供高品质的购票服务。
                请使用官方APP或访问官方网站进行购票，谨防虚假网站。
                如有疑问，请拨打全国铁路客服热线：12306。
              </p>
            </div>

            {/* 二维码区域 */}
            <div className="qr-codes">
              <div className="qr-group">
                <div className="qr-placeholder">
                  <span className="qr-icon">📱</span>
                </div>
                <p>铁路12306</p>
              </div>
              <div className="qr-group">
                <div className="qr-placeholder">
                  <span className="qr-icon">💬</span>
                </div>
                <p>12306 公众号</p>
              </div>
              <div className="qr-group">
                <div className="qr-placeholder">
                  <span className="qr-icon">🎫</span>
                </div>
                <p>问询12306</p>
              </div>
              <div className="qr-group">
                <div className="qr-placeholder">
                  <span className="qr-icon">🚄</span>
                </div>
                <p>铁路12306</p>
              </div>
            </div>
          </div>

          {/* 版权信息 */}
          <div className="copyright">
            <p>版权所有©2008-2023 中国铁道科学研究院集团有限公司 技术支持：铁科院电子所</p>
            <p>京ICP备11019520号 京公网安备110108006580号</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LoginPage;