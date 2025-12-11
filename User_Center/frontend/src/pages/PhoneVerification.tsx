import React, { useEffect, useState } from 'react';
import './BindTelForm.css';

export default function PhoneVerification() {
  const [countryCode, setCountryCode] = useState('+86');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [currentMasked, setCurrentMasked] = useState('');
  const [verifiedStatus, setVerifiedStatus] = useState('');
  const [sid, setSid] = useState('');
  const [blocked, setBlocked] = useState(false);

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
    (async () => {
      if (!sid) {
        setMessage('您还未登录，请先登录');
        setBlocked(true);
        try { sessionStorage.setItem('UC_ERROR_TEXT', '您还未登录，请先登录'); } catch (e) {}
        setTimeout(() => { window.location.hash = '/otn/view/information.html'; }, 500);
        return;
      }
      const tryFetchSession = async (base: string) => {
        try {
          const r = await fetch(`${base}/auth/session/account`, { headers: sid ? { Authorization: `Bearer ${sid}` } : {} });
          if (!r.ok) return false;
          const d = await r.json();
          if (d && d.phone_country_code) setCountryCode(String(d.phone_country_code));
          if (d && d.phone_masked) setCurrentMasked(`${String(d.phone_country_code || '+86')}-${String(d.phone_masked)}`);
          if (d && d.verified_status) setVerifiedStatus(String(d.verified_status));
          return true;
        } catch (e) { return false; }
      };
      const ok8080 = await tryFetchSession('http://localhost:8080/api/v1');
      const ok8082 = ok8080 ? true : await tryFetchSession('http://127.0.0.1:8082/api/v1');
      if (!(ok8080 || ok8082)) {
        setMessage('您还未登录，请先登录');
        setBlocked(true);
        try { sessionStorage.setItem('UC_ERROR_TEXT', '您还未登录，请先登录'); } catch (e) {}
        setTimeout(() => { window.location.hash = '/otn/view/information.html'; }, 500);
        return;
      }
    })();
  }, []);

  const onConfirm = async () => {
    setMessage('');
    if (countryCode === '+86' && !/^\d{11}$/.test(phone)) {
      setMessage('手机号格式错误，请检查');
      return;
    }
    try {
      const res = await fetch('http://localhost:8083/api/v1/user/security/phone/change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone_country_code: countryCode, phone_number: phone, login_password: password, session_id: sid })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (res.status === 401) {
          if (data && data.error === 'SESSION_EXPIRED') setMessage('登录已过期，请重新登录');
          else setMessage('密码错误，请重新输入');
        } else if (res.status === 400) setMessage('手机号格式错误，请检查');
        else if (res.status === 409) setMessage('该手机号已被占用，请更换');
        else if (res.status === 422) setMessage('修改失败，请稍后再试');
        else setMessage(data.message || '请求失败');
        return;
      }
      setMessage('修改成功');
      if (data.phone_number_masked) setCurrentMasked(String(data.phone_number_masked));
      const target = data.redirect_to || 'http://localhost:8082/login.html';
      setTimeout(() => { window.location.href = String(target); }, 800);
    } catch (e) {
      setMessage('网络异常，请稍后再试');
    }
  };

  if (blocked) {
    return (
      <div className="bind-tel-container">
        <h1 style={{ fontSize: '18px', marginBottom: '20px' }}>手机核验</h1>
        {message && <div style={{ color: '#FF8000' }}>{message}</div>}
      </div>
    );
  }
  return (
    <div className="bind-tel-container">
      <h1 style={{ fontSize: '18px', marginBottom: '20px' }}>手机核验</h1>
      
      <div className="form-item">
        <label><span className="required-star">*</span>原手机号：</label>
        <span>{currentMasked}</span>
        <span className="verified-link">已通过核验</span>
      </div>

      <div className="form-item">
        <label><span className="required-star">*</span>新手机号：</label>
        <select 
            className="input" 
            style={{ width: '80px', marginRight: '10px' }} 
            value={countryCode} 
            onChange={(e) => setCountryCode(e.target.value)}
        >
          <option value="+86">+86</option>
          <option value="+1">+1</option>
        </select>
        <input 
            className="input" 
            style={{ width: '220px' }}
            value={phone} 
            data-testid="phone-input"
            onChange={(e) => setPhone(e.target.value)} 
        />
      </div>

      <div className="dashed-line"></div>
      
      <div className="form-item">
        <label><span className="required-star">*</span>登录密码：</label>
        <input 
            type="password" 
            className="input" 
            value={password} 
            data-testid="password-input"
            onChange={(e) => setPassword(e.target.value)} 
        />
        <span className="input-hint">正确输入密码才能修改密保</span>
      </div>
      
      {message && <div style={{ color: '#FF8000', marginLeft: '110px', marginBottom: '10px' }}>{message}</div>}

      <div className="actions">
        <button className="cancel-btn" onClick={() => { window.location.hash = '/otn/view/information.html'; }}>取消</button>
        <button className="btn-primary" onClick={onConfirm}>确认</button>
      </div>
    </div>
  );
}
