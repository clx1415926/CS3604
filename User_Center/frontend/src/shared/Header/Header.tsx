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
    const uniqueBases = (bases: string[]) => Array.from(new Set(bases.filter(Boolean)));

    const getSid = () => {
      const fromHash = (() => {
        const h = window.location.hash || '';
        const m = h.match(/sid=([^&]+)/);
        return m ? decodeURIComponent(m[1]) : '';
      })();
      const fromSearch = (() => {
        const s = window.location.search || '';
        const m = s.match(/sid=([^&]+)/);
        return m ? decodeURIComponent(m[1]) : '';
      })();
      const fromSession = sessionStorage.getItem('session_id') || '';
      const fromLocal = localStorage.getItem('SESSION_ID') || '';
      const sid = fromHash || fromSearch || fromSession || fromLocal;
      if (sid) {
        try {
          localStorage.setItem('SESSION_ID', sid);
          sessionStorage.setItem('session_id', sid);
        } catch (e) {}
      }
      return sid;
    };
    const getAuthBases = () =>
      uniqueBases([
        (typeof window !== 'undefined' && (window as any).API_BASE) || '',
        localStorage.getItem('UC_AUTH_BASE') || '',
        'http://localhost:8080/api/v1',
        'http://127.0.0.1:8082/api/v1',
      ]);

    const loadNick = async (sid: string) => {
      if (!sid) {
        setLogged(false);
        setNick('');
        return;
      }

      setLogged(true);

      const fetchProfile = async (base: string) => {
        try {
          const r = await fetch(`${base}/auth/session/profile`, {
            headers: { Authorization: 'Bearer ' + sid },
          });
          const d = await r.json().catch(() => null);
          return { ok: r.ok, data: d };
        } catch (e) {
          return { ok: false, data: null };
        }
      };

      const bases = getAuthBases();
      for (const base of bases) {
        const result = await fetchProfile(base);
        if (result.ok && result.data && (result.data.username || result.data.name)) {
          const displayName =
            (result.data.username || '') +
            (result.data.name ? '（' + result.data.name + '）' : '');
          setNick(displayName);
          try {
            localStorage.setItem('UC_NICK', displayName);
            sessionStorage.setItem('UC_NICK', displayName);
            localStorage.setItem('UC_AUTH_BASE', base);
          } catch (e) {}
          return;
        }
      }

      const name =
        localStorage.getItem('UC_NICK') ||
        localStorage.getItem('ACCOUNT_NICK') ||
        sessionStorage.getItem('UC_NICK') ||
        '';
      setNick(name || '用户');
    };

    const sync = () => {
      const sid = getSid();
      loadNick(sid);
    };

    const onStorage = (e: StorageEvent) => {
      if (!e || (e.key !== 'SESSION_ID' && e.key !== 'UC_NICK' && e.key !== 'UC_AUTH_BASE')) return;
      sync();
    };

    const onAuthChanged = () => {
      sync();
    };

    window.addEventListener('storage', onStorage);
    window.addEventListener('uc:auth-changed' as any, onAuthChanged);
    sync();

    const poll = async () => {
      const sid = getSid();
      if (!sid) { setLogged(false); setNick(''); return; }
      const bases = getAuthBases();
      for (const base of bases) {
        try {
          const r = await fetch(`${base}/auth/session/profile`, { headers: { Authorization: 'Bearer ' + sid } });
          const d = await r.json().catch(() => null);
          if (r.ok && d && (d.username || d.name)) {
            const displayName = (d.username || '') + (d.name ? '（' + d.name + '）' : '');
            setLogged(true);
            setNick(displayName);
            try {
              localStorage.setItem('UC_NICK', displayName);
              sessionStorage.setItem('UC_NICK', displayName);
              localStorage.setItem('UC_AUTH_BASE', base);
            } catch (e) {}
            return;
          }
        } catch (e) {}
      }
      try {
        localStorage.removeItem('SESSION_ID');
        sessionStorage.removeItem('session_id');
      } catch (e) {}
      setLogged(false);
      setNick('');
      try {
        window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } }));
      } catch (e) {}
    };
    const timer = setInterval(poll, 2000);
    const onFocus = () => { poll(); };
    window.addEventListener('focus', onFocus);

    const hubOrigin = 'http://localhost:8080';
    const hubUrl = hubOrigin + '/auth-sync.html';
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    (iframe.style as any).display = 'none';
    iframe.src = hubUrl;
    document.body.appendChild(iframe);
    const sendHub = (payload: any) => {
      try { const w = (iframe as any).contentWindow; if (w) w.postMessage(payload, hubOrigin); } catch (e) {}
    };
    const onLocalAuthChanged = (ev: any) => {
      const sid0 = (ev && ev.detail && ev.detail.sid) || localStorage.getItem('SESSION_ID') || '';
      sendHub({ type: 'uc-auth', sid: sid0 || '', logged_in: !!(ev && ev.detail && ev.detail.logged_in), from: window.location.origin });
    };
    window.addEventListener('uc:auth-changed' as any, onLocalAuthChanged);
    const onHubMessage = (e: MessageEvent) => {
      const d = (e && (e as any).data) as any;
      if (!d || d.type !== 'uc-auth' || !d.forwarded) return;
      try {
        if (d.logged_in) {
          localStorage.setItem('SESSION_ID', d.sid || '');
          sessionStorage.setItem('session_id', d.sid || '');
        } else {
          localStorage.removeItem('SESSION_ID');
          sessionStorage.removeItem('session_id');
        }
      } catch (e2) {}
      sync();
    };
    window.addEventListener('message', onHubMessage);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('uc:auth-changed' as any, onAuthChanged);
      clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('uc:auth-changed' as any, onLocalAuthChanged);
      window.removeEventListener('message', onHubMessage);
    };
  }, []);

  const computedMyHref = myHref || ((typeof window !== 'undefined' && window.location && window.location.origin)
    ? `${window.location.origin}/index.html`
    : 'http://localhost:5176/index.html');

  const onLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    const sid = (() => {
      try {
        return localStorage.getItem('SESSION_ID') || sessionStorage.getItem('session_id') || '';
      } catch (e) {
        return '';
      }
    })();
    const finalize = () => {
      try {
        localStorage.removeItem('SESSION_ID');
        sessionStorage.removeItem('session_id');
        localStorage.removeItem('UC_NICK');
        sessionStorage.removeItem('UC_NICK');
        localStorage.removeItem('UC_AUTH_BASE');
      } catch (e) {}
      setLogged(false);
      setNick('');
      try {
        window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } }));
      } catch (e) {}
    };
    if (sid) {
      const bases = [ 'http://localhost:8080/api/v1', 'http://127.0.0.1:8082/api/v1' ];
      const doLogout = async () => {
        for (const base of bases) {
          try {
            await fetch(`${base}/auth/logout`, { method: 'POST', headers: { Authorization: 'Bearer ' + sid } });
            finalize();
            return;
          } catch (e) {}
        }
        finalize();
      };
      doLogout();
    } else {
      finalize();
    }
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
