import React, { useEffect, useState } from 'react';

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
    const getApiBase = () => (window as any).API_BASE || 'http://127.0.0.1:8082/api/v1';
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
    const base = getApiBase();
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
      const ok = await tryFetch(`${base}/auth/session/account`);
      setSidValid(ok);
      if (!ok) {
        const altBase = base.replace('8082', '8083');
        const okAlt = await tryFetch(`${altBase}/auth/session/account`);
        setSidValid(okAlt);
      }
    })();
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
    <div>
      <section>
        <h2>基本信息</h2>
        <div>用户名: {username || '未登录'}</div>
        <div>姓名: {name || '未登录'}</div>
        <div>国家/地区: {country || '中国'}</div>
        <div>证件类型: {idType || '居民身份证'}</div>
        <div>证件号码(脱敏): {idMasked || ''}</div>
        <div>核验状态: {verifiedStatus || '已通过'}</div>
      </section>

      <section>
        <h2>联系方式</h2>
        <div>{phoneMasked ? `(${phoneCountryCode || '+86'}) ${phoneMasked}` : `(${phoneCountryCode || '+86'}) `}</div>
        <div>{emailMasked}</div>
        <button onClick={() => setShowEditOptions(true)}>编辑</button>
        {showEditOptions && (
          <div>
            <a href="#/otn/view/userSecurity_bindTel.html" onClick={(e) => onGoPhoneVerify(e)}>去手机核验更改</a>
            {errorText ? <div>{errorText}</div> : null}
          </div>
        )}
      </section>

      <section>
        <h2>附加信息</h2>
        <div>优惠(待)类型: {travelerType || '成人'}</div>
        <button onClick={(e) => {
          if (!sid || !sidValid) {
            if (e) e.preventDefault();
            setAdditionalMessage('您还未登陆，请先登录');
            setShowTravelerEdit(false);
            return;
          }
          setShowTravelerEdit(true);
          setNewTravelerType(travelerType || '成人');
          setAdditionalMessage('');
        }}>编辑</button>
        {showTravelerEdit && (
          <div>
            <select value={newTravelerType} onChange={(e) => setNewTravelerType(e.target.value)}>
              <option value="成人">成人</option>
              <option value="儿童">儿童</option>
              <option value="学生">学生</option>
              <option value="残疾军人">残疾军人</option>
            </select>
            <button onClick={() => {
              if (!sid || !sidValid) { setAdditionalMessage('您还未登陆，请先登录'); return; }
              onSaveTravelerType();
            }}>保存</button>
            <button onClick={() => { setShowTravelerEdit(false); }}>取消</button>
            {additionalMessage ? <div>{additionalMessage}</div> : null}
          </div>
        )}
      </section>
    </div>
  );
}
