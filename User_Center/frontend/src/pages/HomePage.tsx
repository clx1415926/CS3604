import React, { useEffect, useState } from 'react';
import PersonalInfoView from './PersonalInfoView';
import PhoneVerification from './PhoneVerification';

export default function HomePage() {
  const [sid, setSid] = useState('');
  const [sidValid, setSidValid] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [showInfo, setShowInfo] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  useEffect(() => {
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
      if (sid) { try { localStorage.setItem('SESSION_ID', sid); } catch (e) {} }
      return sid;
    };
    const sid = getSid();
    setSid(sid);
    const tryFetch = async (url: string) => {
      try {
        const r = await fetch(url, { headers: sid ? { Authorization: `Bearer ${sid}` } : {} });
        return r.ok;
      } catch (e) { return false; }
    };
    (async () => {
      const ok = await tryFetch('http://localhost:8080/api/v1/auth/session/account');
      if (ok) { setSidValid(true); return; }
      const ok2 = await tryFetch('http://127.0.0.1:8082/api/v1/auth/session/account');
      setSidValid(ok2);
    })();
  }, []);
  const onGoPhoneVerify = (e?: React.MouseEvent) => {
    if (!sid || !sidValid) {
      if (e) e.preventDefault();
      setErrorText('您还未登录，请先登录');
      return;
    }
    if (e) e.preventDefault();
    setShowVerify(true);
  };
  const onGoPersonalInfo = (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    setShowInfo(true);
  };
  return (
    <div style={{ display: 'flex', gap: '16px' }}>
      <div>
        <h1>中国铁路12306</h1>
        <a href="#" onClick={(e) => onGoPersonalInfo(e)}>个人中心</a>
        <span> ｜ </span>
        <a href="#" onClick={(e) => onGoPhoneVerify(e)}>手机核验</a>
        {errorText ? <div>{errorText}</div> : null}
      </div>
      <div style={{ flex: 1 }}>
        {showInfo ? <PersonalInfoView /> : null}
        {showVerify ? <PhoneVerification /> : null}
      </div>
    </div>
  );
}
