import React, { useEffect, useRef, useState } from 'react';
const HOME_URL = (typeof window !== 'undefined' && window.location && window.location.origin) || 'http://localhost:8099/';

const Header = () => {
  const [userInfo, setUserInfo] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    // 使用统一认证中间件
    const onAuthChange = (state) => {
      console.log('[Header] Auth state changed:', state);
      if (state.logged && state.user) {
        setUserInfo(state.user);
      } else {
        setUserInfo(null);
      }
    };
    
    // 兼容模式：直接查询后端
    const checkAuth = () => {
      const sid = (() => { try { return localStorage.getItem('SESSION_ID'); } catch(e) { return null; } })();
      console.log('[Header] Checking auth, sid:', sid ? 'exists' : 'none');
      if (!sid) { setUserInfo(null); return; }
      fetch('http://localhost:8082/api/v1/auth/session/profile', { headers: { Authorization: 'Bearer ' + sid } })
        .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
        .then(res => { 
          console.log('[Header] Auth response:', res.ok, res.data);
          if (res.ok) setUserInfo(res.data); else setUserInfo(null); 
        })
        .catch((e) => { console.log('[Header] Auth error:', e); setUserInfo(null); });
    };
    
    // 优先使用 AuthMiddleware，否则用兼容模式
    if (window.AuthMiddleware) {
      console.log('[Header] Using AuthMiddleware');
      window.AuthMiddleware.onChange(onAuthChange);
      window.AuthMiddleware.checkAuth(true).then(onAuthChange);
    } else {
      console.log('[Header] AuthMiddleware not found, using fallback');
      checkAuth();
      const timer = setInterval(checkAuth, 3000);
      window.addEventListener('focus', checkAuth);
      return () => {
        clearInterval(timer);
        window.removeEventListener('focus', checkAuth);
      };
    }

    // 移除 header::before 伪元素
    try {
      const headerEl = document.querySelector('.header');
      if (headerEl) {
        const beforeStyle = window.getComputedStyle(headerEl, '::before');
        const beforeContent = beforeStyle && beforeStyle.getPropertyValue('content');
        if (beforeContent && beforeContent !== 'none' && beforeContent !== 'normal' && beforeContent !== '""') {
          const st = document.createElement('style');
          st.textContent = '.header::before{content:none !important;display:none !important;background:transparent !important;}';
          document.head.appendChild(st);
        }
      }
    } catch (e) {}
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
    if (window.AuthMiddleware) {
      window.AuthMiddleware.logout().then((state) => {
        setUserInfo(null);
      });
    } else {
      // 兼容模式
      const sid = (() => { try { return localStorage.getItem('SESSION_ID'); } catch(e) { return null; } })();
      const done = () => {
        try { localStorage.removeItem('SESSION_ID'); } catch (err) {}
        try { sessionStorage.removeItem('session_id'); } catch (err) {}
        setUserInfo(null);
      };
      if (sid) {
        fetch('http://localhost:8082/api/v1/auth/logout', { method: 'POST', headers: { Authorization: 'Bearer ' + sid } })
          .then(() => done()).catch(() => done());
      } else {
        done();
      }
    }
  };

  return (
    <div className="header" role="banner">
      <div className="wrapper">
        <div className="header-con">
          <h1 className="logo">
            <a href="javascript:;">中国铁路12306</a>
          </h1>
          <div className="header-right">
            <div className="header-search">
              <div className="search-bd">
                <input type="text" className="search-input" id="search-input" ref={inputRef} placeholder="搜索车票、餐饮、常旅客、相关规章" aria-label="搜索车票、餐饮、常旅客、相关规章" />
              </div>
              <a className="search-btn" href="javascript:;" aria-label="点击搜索">
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
                <a href="javascript:;" className="menu-nav-hd item">English <i className="caret"></i></a>
              </li>
              <li className="menu-item menu-line">|</li>
              <li className="menu-item menu-nav" role="menuitem">
                <a href="javascript:;" className="menu-nav-hd item" id="my12306">我的12306 <i className="caret"></i></a>
              </li>
              <li className="menu-item menu-line">|</li>
              <li id="J-header-login" className="menu-item menu-login" role="menuitem" style={{ display: userInfo ? 'none' : '' }}>
                <a id="J-btn-login" href="http://localhost:8082/login.html" className="menu-nav-hd">登录</a>
                <a href="http://localhost:8082/login.html" className="ml">注册</a>
              </li>
              <li id="J-header-logout" className="menu-item menu-nav menu-login" role="menuitem" style={{ display: userInfo ? '' : 'none' }}>
                您好，<a href="javascript:;" className="txt-primary menu-nav-my-hd" id="welcome-user">{(userInfo && (userInfo.username || userInfo.name)) || ''}</a>&nbsp;|&nbsp;<a id="regist_out" className="logout" href="javascript:;" onClick={handleLogout}>退出</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="nav-box" role="navigation">
        <div className="wrapper">
          <ul className="nav" role="menubar">
            <li role="menuitem" className="nav-item nav-item-w1 active">
              <a href="javascript:;" className="nav-hd">首页</a>
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
