import React, { useEffect, useRef, useState } from 'react';
const HOME_URL = import.meta.env?.VITE_HOME_URL || 'http://localhost:8099/';

const Header = () => {
  const [userInfo, setUserInfo] = useState(null);
  const [showMyMenu, setShowMyMenu] = useState(false);
  const [showLangMenu, setShowLangMenu] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    try {
      const sid = (() => { try { return localStorage.getItem('SESSION_ID'); } catch(e) { return null; } })();
      if (sid) {
        fetch('http://localhost:8082/api/v1/auth/session/profile', { headers: { Authorization: 'Bearer ' + sid } })
          .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
          .then(res => { if (res.ok) setUserInfo(res.data); })
          .catch(() => {});
      }
    } catch (e) {}

    const onDocClick = () => { setShowMyMenu(false); setShowLangMenu(false); };
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const kw = inputRef.current && inputRef.current.value ? inputRef.current.value.trim() : '';
    const base = window.location.origin + window.location.pathname;
    const params = new URLSearchParams(window.location.search || '');
    if (kw) { params.set('search', kw); } else { params.delete('search'); }
    const next = base + (params.toString() ? ('?' + params.toString()) : '');
    window.location.href = next;
  };

  const handleLogout = (e) => {
    e.preventDefault();
    try { localStorage.removeItem('SESSION_ID'); } catch (err) {}
    setUserInfo(null);
  };

  const toggleMyMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowMyMenu(v => !v);
    setShowLangMenu(false);
  };

  const toggleLangMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowLangMenu(v => !v);
    setShowMyMenu(false);
  };

  return (
    <div className="header" role="banner">
      <div className="wrapper">
        <div className="header-con">
          <h1 className="logo">
            <a href={HOME_URL}>中国铁路12306</a>
          </h1>
          <div className="header-right">
            <div className="header-search">
              <div className="search-bd">
                <input type="text" className="search-input" id="search-input" ref={inputRef} placeholder="搜索车票、餐饮、常旅客、相关规章" aria-label="搜索车票、餐饮、常旅客、相关规章" />
              </div>
              <a className="search-btn" href="#" aria-label="点击搜索" onClick={handleSearch}>
                <i className="icon icon-search"></i>
              </a>
            </div>
            <ul className="header-menu" role="menubar">
              <li className="menu-item">
                <a href="javascript:;" className="menu-nav-hd">无障碍</a>
              </li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item">
                <a href="javascript:;" className="menu-nav-hd">敬老版</a>
              </li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-nav" role="menuitem">
                <a href="#" className="menu-nav-hd item" onClick={toggleLangMenu}>English <i className="caret"></i></a>
                {showLangMenu && (
                  <div className="dropdown">
                    <a href="javascript:;">简体中文</a>
                    <a href="javascript:;">English</a>
                  </div>
                )}
              </li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-nav" role="menuitem">
                <a href="#" className="menu-nav-hd item" id="my12306" onClick={toggleMyMenu}>我的12306 <i className="caret"></i></a>
                {showMyMenu && (
                  <div className="dropdown">
                    <a href="http://localhost:5176/index.html">个人中心</a>
                    <a href="http://localhost:3001/">订单管理</a>
                  </div>
                )}
              </li>
              <li className="menu-item menu-line">|</li>
              {!userInfo && (
                <li id="J-header-login" className="menu-item menu-login" role="menuitem">
                  <a id="J-btn-login" href="http://localhost:8082/login.html" className="menu-nav-hd">登录</a>
                  <a href="http://localhost:8082/login.html" className="ml">注册</a>
                </li>
              )}
              {userInfo && (
                <li id="J-header-logout" className="menu-item menu-nav menu-login" role="menuitem">
                  您好，<a href="javascript:;" className="txt-primary menu-nav-my-hd" id="welcome-user">{userInfo.username || userInfo.name || ''}</a>&nbsp;|&nbsp;<a id="regist_out" className="logout" href="#" onClick={handleLogout}>退出</a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>
      <div className="nav-box" role="navigation">
        <div className="wrapper">
          <ul className="nav" role="menubar">
            <li role="menuitem" className="nav-item nav-item-w1">
              <a href={HOME_URL} className="nav-hd">首页</a>
            </li>
            <li role="menuitem" className="nav-item nav-item-w1">
              <a href="javascript:void(0)" className="nav-hd item">车票 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="javascript:void(0)" className="nav-hd item">团购服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="javascript:void(0)" className="nav-hd item">会员服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="javascript:void(0)" className="nav-hd item">站车服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="javascript:void(0)" className="nav-hd item">商旅服务 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item">
              <a href="javascript:void(0)" className="nav-hd item">出行指南 <i className="icon icon-down"></i></a>
            </li>
            <li role="menuitem" className="nav-item last">
              <a href="javascript:void(0)" className="nav-hd item">信息查询 <i className="icon icon-down"></i></a>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Header;
