import React, { useEffect, useState } from 'react';
import './Header.css';
import '../../assets/home_assets/iconfont.css';
import logoDefault from '../../assets/logo.png';
import logo2xDefault from '../../assets/logo@2x.png';

type Props = {
  homeHref?: string;
  myHref?: string;
  loginHref?: string;
  registerHref?: string;
  logoUrl?: string;
  logo2xUrl?: string;
  ticketsHref?: string;
};

const SharedHeader: React.FC<Props> = ({
  homeHref = 'http://localhost:8080/',
  myHref,
  loginHref = 'http://localhost:8082/login.html',
  registerHref = 'http://localhost:8082/register.html',
  logoUrl,
  logo2xUrl,
  ticketsHref = 'http://localhost:5173/index.html',
}) => {
  const [nick, setNick] = useState('');
  const [logged, setLogged] = useState(false);

  useEffect(() => {
    const sid = sessionStorage.getItem('session_id') || localStorage.getItem('SESSION_ID') || '';
    setLogged(!!sid);
    
    if (sid) {
      fetch('http://localhost:8082/api/v1/auth/session/profile', {
        headers: { Authorization: 'Bearer ' + sid }
      })
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(res => {
        if (res.ok && res.data && (res.data.username || res.data.name)) {
          const displayName = (res.data.username || '') + (res.data.name ? '（' + res.data.name + '）' : '');
          setNick(displayName);
        } else {
          // Fallback to local storage
          const name = localStorage.getItem('UC_NICK') || localStorage.getItem('ACCOUNT_NICK') || sessionStorage.getItem('UC_NICK') || '';
          setNick(name || '用户');
        }
      })
      .catch(() => {
        const name = localStorage.getItem('UC_NICK') || localStorage.getItem('ACCOUNT_NICK') || sessionStorage.getItem('UC_NICK') || '';
        setNick(name || '用户');
      });
    } else {
      setNick('');
    }
  }, []);

  const computedMyHref = myHref || ((typeof window !== 'undefined' && window.location && window.location.origin)
    ? `${window.location.origin}/index.html`
    : 'http://localhost:5176/index.html');

  const onLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    try {
      localStorage.removeItem('SESSION_ID');
      sessionStorage.removeItem('session_id');
      localStorage.removeItem('UC_NICK');
      sessionStorage.removeItem('UC_NICK');
    } catch (e) {}
    setLogged(false);
    setNick('');
  };

  const styleVars: React.CSSProperties = {
    ['--logo-url' as any]: `url(${logoUrl || logoDefault})`,
    ['--logo-2x-url' as any]: `url(${logo2xUrl || logo2xDefault})`,
  };

  return (
    <div className="header" style={styleVars}>
      <div className="wrapper">
        <div className="header-con">
          <h1 className="logo">
            <a href={homeHref}>中国铁路12306</a>
          </h1>
          <div className="header-right">
            <div className="header-search">
              <div className="search-bd">
                <input type="text" className="search-input" placeholder="搜索车票、餐饮、常旅客、相关规章" aria-label="搜索" />
              </div>
              <a className="search-btn" href="#" aria-label="搜索" onClick={(e) => e.preventDefault()}>
                <i className="icon icon-search"></i>
              </a>
            </div>
            <ul className="header-menu" role="menubar">
              <li className="menu-item"><a href="#" onClick={(e) => e.preventDefault()} className="menu-nav-hd">无障碍</a></li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item"><a href="#" onClick={(e) => e.preventDefault()} className="menu-nav-hd">敬老版</a></li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item"><a href="#" onClick={(e) => e.preventDefault()} className="menu-nav-hd">English <i className="caret" /></a></li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-nav" role="menuitem">
                <a href={computedMyHref} className="menu-nav-hd item">我的12306 <i className="caret" /></a>
                <ul className="menu-nav-bd" role="menu" aria-hidden="true" id="megamenu-2">
                  <li><a name="g_href" data-type="2" data-href="view/train_order.html" data-redirect="Y" href="javascript:;">火车票订单</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/lineUp_order.html" data-redirect="Y" href="javascript:;">候补订单</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/commutation_order.html" data-redirect="Y" href="javascript:;">计次•定期票订单</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/commutation_ticket_order.html" data-redirect="Y" href="javascript:;">约号订单</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/invoice_index.html" data-redirect="Y" href="javascript:;">电子发票</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/personal_travel.html" data-redirect="Y" href="javascript:;">本人车票</a></li>
                  <li className="nav-line"></li>
                  <li><a name="g_href" data-type="10" data-href="queryMyOrder.html" data-redirect="Y" href="javascript:;">我的餐饮•特产</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/my_insurance.html" data-redirect="Y" href="javascript:;">我的保险</a></li>
                  <li><a name="g_href" data-type="3" data-href="welcome.html" data-redirect="Y" href="javascript:;">我的会员</a></li>
                  <li className="nav-line"></li>
                  <li><a name="g_href" data-type="2" data-href="view/information.html" data-redirect="Y" href="javascript:;">查看个人信息</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/userSecurity.html" data-redirect="Y" href="javascript:;">账户安全</a></li>
                  <li className="nav-line"></li>
                  <li><a name="g_href" data-type="2" data-href="view/passengers.html" data-redirect="Y" href="javascript:;">乘车人</a></li>
                  <li><a name="g_href" data-type="2" data-href="view/address_init.html" data-redirect="Y" href="javascript:;">地址管理</a></li>
                  <li className="nav-line"></li>
                  <li><a name="g_href" data-type="2" data-href="view/icentre_serviceQuery.html" data-redirect="Y" href="javascript:;">温馨服务查询</a></li>
                </ul>
              </li>
              <li className="menu-item menu-line">|</li>
              {logged ? (
                <li id="J-header-logout" className="menu-item menu-login" role="menuitem">
                  您好，<a id="welcome-user" href="#" onClick={(e) => e.preventDefault()} className="txt-primary menu-nav-my-hd">{nick || '用户'}</a>&nbsp;|&nbsp;<a id="regist_out" className="logout" href="#" onClick={onLogout}>退出</a>
                </li>
              ) : (
                <li id="J-header-login" className="menu-item menu-login" role="menuitem">
                  <a id="J-btn-login" href={loginHref} className="menu-nav-hd">登录</a>
                  <a href={registerHref} className="ml">注册</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="nav-box" role="navigation">
        <div className="wrapper">
          <ul className="nav" role="menubar">
            <li role="menuitem" className="nav-item nav-item-w1 active">
              <a href={homeHref} className="nav-hd">首页</a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href={ticketsHref} className="nav-hd item">车票 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="#" onClick={(e) => e.preventDefault()} className="nav-hd item">团购服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="#" onClick={(e) => e.preventDefault()} className="nav-hd item">会员服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="#" onClick={(e) => e.preventDefault()} className="nav-hd item">站车服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="#" onClick={(e) => e.preventDefault()} className="nav-hd item">商旅服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="#" onClick={(e) => e.preventDefault()} className="nav-hd item">出行指南 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item last">
              <a href="#" onClick={(e) => e.preventDefault()} className="nav-hd item">信息查询 <i className="icon icon-down"></i></a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SharedHeader;
