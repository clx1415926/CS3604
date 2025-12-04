import React, { useEffect, useState } from 'react';
import HomePage from './pages/HomePage';
import PersonalInfoView from './pages/PersonalInfoView';
import PhoneVerification from './pages/PhoneVerification';
import PassengerList from './pages/PassengerList';
import PassengerEdit from './pages/PassengerEdit';
import AddPassenger from './pages/AddPassenger';
import OrderCenter from './pages/OrderCenter';

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

  const currentPath = route.split('?')[0];

  const Topbar = (
    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', padding: '8px 16px', borderBottom: '1px solid #e5e5e5' }}>
      <a href="http://localhost:8080/" style={{ display: 'inline-block', padding: '6px 10px', background: '#2e6fe7', color: '#fff', borderRadius: 4, textDecoration: 'none' }}>首页</a>
    </div>
  );

  const Sidebar = (
    <div style={{ width: 220, padding: 16, borderRight: '1px solid #e5e5e5', boxSizing: 'border-box' }}>
      <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>个人中心</div>
      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>订单中心</div>
      <a href="#/otn/view/train_order.html" style={{ display: 'block', lineHeight: '28px', color: currentPath === '/otn/view/train_order.html' ? '#fff' : '#333', background: currentPath === '/otn/view/train_order.html' ? '#2e6fe7' : 'transparent', padding: '4px 8px', borderRadius: 2, textDecoration: 'none' }}>火车票订单</a>
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
      <a href="#/otn/view/information.html" style={{ display: 'block', lineHeight: '28px', color: currentPath === '/otn/view/information.html' ? '#fff' : '#333', background: currentPath === '/otn/view/information.html' ? '#2e6fe7' : 'transparent', padding: '4px 8px', borderRadius: 2, textDecoration: 'none' }}>查看个人信息</a>
      <a href="#/otn/view/userSecurity_bindTel.html" style={{ display: 'block', lineHeight: '28px', color: currentPath === '/otn/view/userSecurity_bindTel.html' ? '#fff' : '#333', background: currentPath === '/otn/view/userSecurity_bindTel.html' ? '#2e6fe7' : 'transparent', padding: '4px 8px', borderRadius: 2, textDecoration: 'none' }}>手机核验</a>
      <div style={{ color: '#333', lineHeight: '28px' }}>账号安全</div>
      <div style={{ color: '#333', lineHeight: '28px' }}>账号注销</div>

      <div style={{ fontSize: 16, fontWeight: 600, margin: '16px 0 8px' }}>常用信息管理</div>
      <a href="#/otn/view/passengers.html" style={{ display: 'block', lineHeight: '28px', color: currentPath === '/otn/view/passengers.html' ? '#fff' : '#333', background: currentPath === '/otn/view/passengers.html' ? '#2e6fe7' : 'transparent', padding: '4px 8px', borderRadius: 2, textDecoration: 'none' }}>乘车人</a>
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

  if (currentPath === '/otn/view/information.html') {
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
  if (currentPath === '/otn/view/userSecurity_bindTel.html') {
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
  if (currentPath === '/otn/view/passengers.html') {
    return (
      <div>
        {Topbar}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {Sidebar}
          <div style={{ flex: 1, padding: '0 24px' }}>
            <PassengerList />
          </div>
        </div>
      </div>
    );
  }
  if (currentPath === '/otn/view/add_passenger.html') {
    return (
      <div>
        {Topbar}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {Sidebar}
          <div style={{ flex: 1, padding: '0 24px' }}>
            <AddPassenger />
          </div>
        </div>
      </div>
    );
  }
  if (currentPath === '/otn/view/train_order.html') {
    return (
      <div>
        {Topbar}
        <div style={{ display: 'flex', alignItems: 'flex-start' }}>
          {Sidebar}
          <div style={{ flex: 1, padding: '0 24px' }}>
            <OrderCenter />
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      {Topbar}
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {Sidebar}
        <div style={{ flex: 1, padding: '24px' }}>
           {/* Default to Home or 404 */}
           <HomePage />
        </div>
      </div>
    </div>
  );
}
