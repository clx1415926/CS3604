import React, { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import PersonalInfoView from './pages/PersonalInfoView';
import PhoneVerification from './pages/PhoneVerification';

function getRoute() {
  const h = window.location.hash.replace('#', '');
  if (!h || h === '/' || h === '') return '/otn/view/information.html';
  return h;
}

export default function App() {
  const [route, setRoute] = useState(getRoute());
  useEffect(() => {
    const onHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const Topbar = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #e5e5e5' }}>
      <a href="http://localhost:8080/" style={{ display: 'inline-block', padding: '6px 10px', background: '#2e6fe7', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>首页</a>
    </div>
  );

  const Sidebar = (
    <div style={{ width: 220, padding: 16, borderRight: '1px solid #e5e5e5', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>个人中心</div>
      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>订单中心</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>火车票订单</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>候补订单</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>订单·定期票</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>约号订单</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>雪具快运订单</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>餐饮·特产</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>保险订单</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>电子发票</div>

      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>本人车票</div>
      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>会员中心</div>

      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>个人信息</div>
      <a href="#/otn/view/information.html" style={{ display: 'block', lineHeight: '28px', color: route === '/otn/view/information.html' ? '#fff' : '#333', background: route === '/otn/view/information.html' ? '#2e6fe7' : 'transparent', padding: '4px 8px', borderRadius: 2, textDecoration: 'none' }}>查看个人信息</a>
      <a href="#/otn/view/userSecurity_bindTel.html" style={{ display: 'block', lineHeight: '28px', color: route === '/otn/view/userSecurity_bindTel.html' ? '#fff' : '#333', background: route === '/otn/view/userSecurity_bindTel.html' ? '#2e6fe7' : 'transparent', padding: '4px 8px', borderRadius: 2, textDecoration: 'none' }}>手机核验</a>
      <div style={{ color: '#333', lineHeight: '28px' }}>账号安全</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>账号注销</div>

      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>常用信息管理</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>乘车人</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>地址管理</div>

      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>温馨服务</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>重点旅客预约</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>遗失物品查找</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>服务查询</div>

      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>投诉和建议</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>投诉</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>建议</div>
    </div>
  );

  if (route === '/otn/view/information.html') {
    return (
      <div>
        {Topbar}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {Sidebar}
          <div style={{ flex: 1, padding: '0 24px' }}>
            <PersonalInfoView />
          </div>
        </div>
      </div>
    );
  }
  if (route === '/otn/view/userSecurity_bindTel.html') {
    return (
      <div>
        {Topbar}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {Sidebar}
          <div style={{ flex: 1, padding: '0 24px' }}>
            <PhoneVerification />
          </div>
        </div>
      </div>
    );
  }
  return <HomePage />;
}
