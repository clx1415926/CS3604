import React, { useEffect, useState } from 'react';
import './PersonalInfoView.css';

export default function PersonalInfoView() {
  const [username, setUsername] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [idType, setIdType] = useState<string>('');
  const [idMasked, setIdMasked] = useState<string>('');
  const [country, setCountry] = useState<string>('');
  const [phoneMasked, setPhoneMasked] = useState<string>('');
  const [phoneCountryCode, setPhoneCountryCode] = useState<string>('');
  const [emailMasked, setEmailMasked] = useState<string>('');
  const [travelerType, setTravelerType] = useState<string>('');
  const [verifiedStatus, setVerifiedStatus] = useState<string>('');
  const [showEditOptions, setShowEditOptions] = useState<boolean>(false);
  const [sid, setSid] = useState<string>('');
  const [errorText, setErrorText] = useState<string>('');
  const [sidValid, setSidValid] = useState<boolean>(false);
  const [showTravelerEdit, setShowTravelerEdit] = useState<boolean>(false);
  const [newTravelerType, setNewTravelerType] = useState<string>('成人');
  const [additionalMessage, setAdditionalMessage] = useState<string>('');
  useEffect(() => {
    let keepAliveTimer: any = null;

    const uniqueBases = (bases: string[]) => Array.from(new Set(bases.filter(Boolean)));

    const getAuthBases = () =>
      uniqueBases([
        (window as any).API_BASE,
        localStorage.getItem('UC_AUTH_BASE') || '',
        'http://localhost:8080/api/v1',
        'http://127.0.0.1:8082/api/v1',
      ]);

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
    const sid = getSid();
    setSid(sid);
    const tryFetch = async (url: string) => {
      try {
        const r = await fetch(url, { headers: sid ? { Authorization: `Bearer ${sid}` } : {} });
        if (r.ok) {
          const data = await r.json();
          if (data && data.username) setUsername(String(data.username));
          if (data && data.name) setName(String(data.name));
          if (data && data.id_type) setIdType(String(data.id_type));
          if (data && data.id_number_masked) setIdMasked(String(data.id_number_masked));
          if (data && data.country) setCountry(String(data.country));
          if (data && data.phone_masked) setPhoneMasked(String(data.phone_masked));
          if (data && data.phone_country_code) setPhoneCountryCode(String(data.phone_country_code));
          if (data && data.email_masked) setEmailMasked(String(data.email_masked));
          if (data && data.traveler_type) setTravelerType(String(data.traveler_type));
          if (data && data.traveler_type) setNewTravelerType(String(data.traveler_type));
          if (data && data.verified_status) setVerifiedStatus(String(data.verified_status));
          return true;
        }
      } catch (e) {}
      return false;
    };
    (async () => {
      if (!sid) {
        setSidValid(false);
        try {
          window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } }));
        } catch (e) {}
        return;
      }

      const bases = getAuthBases();
      for (const base of bases) {
        const ok = await tryFetch(`${base}/auth/session/account`);
        if (ok) {
          setSidValid(true);
          try {
            localStorage.setItem('UC_AUTH_BASE', base);
            window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid, logged_in: true, base } }));
          } catch (e) {}

          if (keepAliveTimer) clearInterval(keepAliveTimer);
          keepAliveTimer = setInterval(async () => {
            try {
              const r = await fetch(`${base}/auth/session`, { headers: { Authorization: `Bearer ${sid}` } });
              if (r.status === 401) {
                setSidValid(false);
                window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } }));
              }
            } catch (e) {}
          }, 5 * 60 * 1000);

          return;
        }
      }

      setSidValid(false);
      try {
        window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } }));
      } catch (e) {}
    })();

    return () => {
      if (keepAliveTimer) clearInterval(keepAliveTimer);
    };
  }, []);
  useEffect(() => {
    const t = sessionStorage.getItem('UC_ERROR_TEXT') || '';
    if (t) {
      setErrorText(t);
      sessionStorage.removeItem('UC_ERROR_TEXT');
    }
  }, []);
  const onGoPhoneVerify = (e?: React.MouseEvent) => {
    if (!sid || !sidValid) {
      if (e) e.preventDefault();
      setErrorText('您还未登录，请先登录');
      return;
    }
    window.location.hash = '/otn/view/userSecurity_bindTel.html';
  };
  const onSaveTravelerType = async () => {
    setAdditionalMessage('');
    const allowed = ['成人', '儿童', '学生', '残疾军人'];
    if (!allowed.includes(newTravelerType)) { setAdditionalMessage('请选择优惠类型'); return; }
    try {
      const r = await fetch('http://localhost:8083/api/v1/user/profile/traveler-type', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ traveler_type: newTravelerType, session_id: sid })
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { setAdditionalMessage(d.message || '修改失败，请稍后再试'); return; }
      setTravelerType(String(d.traveler_type || newTravelerType));
      setAdditionalMessage('修改成功');
      setShowTravelerEdit(false);
    } catch (e) { setAdditionalMessage('网络异常，请稍后再试'); }
  };

  return (
    <div className="personal-info-container">
      <div className="info-section">
        <div className="section-header">
            <div className="section-title">基本信息</div>
        </div>
        
        <div className="info-item">
            <div className="info-label"><span className="required-star">*</span>用户名：</div>
            <div className="info-value">{username || '未登录'}</div>
        </div>
        
        <div className="info-item">
            <div className="info-label"><span className="required-star">*</span>姓名：</div>
            <div className="info-value">{name || '未登录'}</div>
        </div>

        <div className="info-item">
            <div className="info-label">国家/地区：</div>
            <div className="info-value">{country || '中国China'}</div>
        </div>

        <div className="info-item">
            <div className="info-label"><span className="required-star">*</span>证件类型：</div>
            <div className="info-value">{idType || '居民身份证'}</div>
        </div>

        <div className="info-item">
            <div className="info-label"><span className="required-star">*</span>证件号码：</div>
            <div className="info-value">{idMasked || ''}</div>
        </div>

        <div className="info-item">
            <div className="info-label">核验状态：</div>
            <div className="info-value" style={{ color: '#FF8000' }}>{verifiedStatus === 'VERIFIED' ? '已通过' : (verifiedStatus || '已通过')}</div>
        </div>
      </div>

      <div className="dashed-line"></div>

      <div className="info-section">
        <div className="section-header">
            <div className="section-title">联系方式</div>
            <button className="edit-btn" onClick={() => setShowEditOptions(!showEditOptions)}>{showEditOptions ? '收起' : '编辑'}</button>
        </div>

        <div className="info-item">
            <div className="info-label"><span className="required-star">*</span>手机号：</div>
            <div className="info-value">
                {phoneMasked ? `(${phoneCountryCode || '+86'}) ${phoneMasked}` : `(${phoneCountryCode || '+86'}) `}
            </div>
            {verifiedStatus === 'VERIFIED' && <span className="verify-link">已通过核验</span>}
        </div>

        <div className="info-item">
            <div className="info-label">邮箱：</div>
            <div className="info-value">{emailMasked}</div>
        </div>

        {showEditOptions && (
          <div className="edit-area">
            <div style={{ marginBottom: 10 }}>
                <a 
                    href="#/otn/view/userSecurity_bindTel.html" 
                    onClick={(e) => onGoPhoneVerify(e)}
                    style={{ color: '#0077FF', textDecoration: 'none', fontSize: 14 }}
                >
                    去手机核验更改 &gt;
                </a>
            </div>
            {errorText ? <div style={{ color: 'red', fontSize: 12 }}>{errorText}</div> : null}
          </div>
        )}
      </div>

      <div className="dashed-line"></div>

      <div className="info-section">
        <div className="section-header">
            <div className="section-title">附加信息</div>
            <button className="edit-btn" onClick={(e) => {
                if (!sid || !sidValid) {
                    if (e) e.preventDefault();
                    setAdditionalMessage('您还未登陆，请先登录');
                    setShowTravelerEdit(false);
                    return;
                }
                setShowTravelerEdit(!showTravelerEdit);
                setNewTravelerType(travelerType || '成人');
                setAdditionalMessage('');
            }}>{showTravelerEdit ? '收起' : '编辑'}</button>
        </div>

        <div className="info-item">
            <div className="info-label"><span className="required-star">*</span>优惠(待)类型：</div>
            <div className="info-value">{travelerType || '成人'}</div>
        </div>

        {showTravelerEdit && (
          <div className="edit-area">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <select 
                    value={newTravelerType} 
                    onChange={(e) => setNewTravelerType(e.target.value)}
                    style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #ddd' }}
                >
                    <option value="成人">成人</option>
                    <option value="儿童">儿童</option>
                    <option value="学生">学生</option>
                    <option value="残疾军人">残疾军人</option>
                </select>
                <button 
                    onClick={() => {
                        if (!sid || !sidValid) { setAdditionalMessage('您还未登陆，请先登录'); return; }
                        onSaveTravelerType();
                    }}
                    style={{ background: '#FF8000', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: 4, cursor: 'pointer' }}
                >
                    保存
                </button>
            </div>
            {additionalMessage ? <div style={{ color: '#FF8000', fontSize: 12 }}>{additionalMessage}</div> : null}
          </div>
        )}
      </div>
    </div>
  );
}
