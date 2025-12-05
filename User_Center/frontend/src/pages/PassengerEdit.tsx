import React, { useState, useEffect } from 'react';
import { validateIdCard18, convert15to18, validatePhone } from '../utils/validators';

const ID_TYPES = [
  '居民身份证',
  '港澳居民来往内地通行证',
  '台湾居民来往大陆通行证',
  '护照',
  '外国人永久居留身份证',
  '港澳台居民居住证',
  '海员证',
  '外国人护照'
];

const TRAVELER_TYPES = ['成人', '儿童', '学生', '残疾军人'];

export default function PassengerEdit() {
  console.log('🚀 PassengerEdit component is rendering');
  
  const [mode, setMode] = useState<'add' | 'edit'>('add');
  const [passengerId, setPassengerId] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    id_type: '居民身份证',
    id_number: '',
    phone_country_code: '+86',
    phone_number: '',
    traveler_type: '成人',
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    id_number: '',
    phone_number: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  // SMS Verification
  const [smsCode, setSmsCode] = useState('');
  const [smsSent, setSmsSent] = useState(false);
  const [smsCountdown, setSmsCountdown] = useState(0);
  const [smsVerified, setSmsVerified] = useState(false);

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
    return fromHash || fromSearch || fromSession || fromLocal;
  };

  const getAuthHeaders = () => {
    const sid = getSid();
    return sid ? { 'Authorization': `Bearer ${sid}` } : {};
  };


  useEffect(() => {
    const hash = window.location.hash;
    const match = hash.match(/[?&]id=([^&]+)/);
    if (match) {
      const id = match[1];
      setMode('edit');
      setPassengerId(id);
      fetchPassenger(id);
    }
  }, []);

  const fetchPassenger = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8083/api/v1/passengers/${id}`, {
        headers: getAuthHeaders() as HeadersInit
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          name: data.name,
          id_type: data.id_type,
          id_number: data.id_number, // Note: This might be masked if backend masks it. The requirement says core info is read-only in edit mode, so masked is fine for display, but we shouldn't submit it back if we don't change it.
          phone_country_code: data.phone_country_code || '+86',
          phone_number: data.phone_number, // This might be masked. We need to handle this.
          traveler_type: data.traveler_type,
        });
      } else {
        setError('无法加载乘车人信息');
      }
    } catch (e) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const validateField = (name: string, value: string) => {
    let msg = '';
    if (name === 'name') {
      if (!value) msg = '请输入姓名';
      else if (!/^[\u4e00-\u9fa5a-zA-Z·.]{2,20}$/.test(value)) msg = '姓名只能包含汉字、字母、点(.)或中点(·)，且长度为2-20位';
    }
    if (name === 'id_number') {
        if (!value) msg = '请输入证件号码';
        else if (formData.id_type === '居民身份证' && !value.includes('*')) {
            let id = value;
            if (id.length === 15) id = convert15to18(id);
            if (!validateIdCard18(id)) msg = '身份证号码格式不正确';
        }
    }
    if (name === 'phone_number') {
        if (!value) msg = '请输入手机号码';
        else if (formData.phone_country_code === '+86' && !value.includes('*')) {
            if (!validatePhone(formData.phone_country_code, value)) msg = '手机号码格式错误';
        }
    }
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
    return msg;
  };

  const validate = () => {
    const err1 = validateField('name', formData.name);
    const err2 = validateField('id_number', formData.id_number);
    const err3 = validateField('phone_number', formData.phone_number);
    if (err1 || err2 || err3) return '请修正表单中的错误';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setSubmitting(true);
    setError('');

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    try {
      const url = mode === 'add' 
        ? 'http://localhost:8083/api/v1/passengers'
        : `http://localhost:8083/api/v1/passengers/${passengerId}`;
      
      const method = mode === 'add' ? 'POST' : 'PATCH';
      const body = mode === 'add' ? formData : {
        phone_country_code: formData.phone_country_code,
        phone_number: formData.phone_number.includes('*') ? undefined : formData.phone_number,
        traveler_type: formData.traveler_type
      };

      const headers: any = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };

      const res = await fetch(url, {
        method,
        headers,
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data.error === 'PASSENGER_LIMIT_EXCEEDED') setError('常用联系人已超过上限(15人)');
        else if (data.error === 'INVALID_TRAVELER_TYPE') setError('无效的旅客类型');
        else if (data.error === 'PASSENGER_NOT_FOUND') setError('乘车人不存在');
        else if (data.error === 'INVALID_ID_NUMBER_FORMAT') setError('身份证号格式错误');
        else if (data.error === 'INVALID_NAME_FORMAT') setError('姓名格式错误');
        else if (data.error && data.error.startsWith('MISSING_')) setError('缺少必填信息');
        else setError(data.error || '操作失败');
      } else {
        alert(mode === 'add' ? '添加成功' : '修改成功');
        window.location.hash = '#/otn/view/passengers.html';
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        setError('请求超时，请检查网络状况');
      } else {
        setError('网络异常，请稍后再试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendSms = async () => {
    // 验证手机号
    const phoneErr = validateField('phone_number', formData.phone_number);
    if (phoneErr) {
      setError('请先输入正确的手机号码');
      return;
    }

    try {
      const res = await fetch('http://localhost:8083/api/v1/sms/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          phone_country_code: formData.phone_country_code,
          phone_number: formData.phone_number
        })
      });

      if (res.ok) {
        setSmsSent(true);
        setSmsCountdown(60);
        const timer = setInterval(() => {
          setSmsCountdown(prev => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
        alert('验证码已发送');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '发送验证码失败');
      }
    } catch (e) {
      setError('网络错误，无法发送验证码');
    }
  };

  const handleVerifySms = async () => {
    if (!smsCode) {
      setError('请输入验证码');
      return;
    }

    try {
      const res = await fetch('http://localhost:8083/api/v1/sms/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          phone_country_code: formData.phone_country_code,
          phone_number: formData.phone_number,
          code: smsCode
        })
      });

      if (res.ok) {
        setSmsVerified(true);
        setError('');
        alert('验证成功');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error || '验证码错误');
      }
    } catch (e) {
      setError('网络错误，无法验证');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, fontSize: 14, color: '#666' }}>
        当前位置：个人中心 &gt; 常用信息管理 &gt; 乘车人 &gt; {mode === 'add' ? '添加' : '修改'}
      </div>

      <div style={{ width: 600, margin: '0 auto', border: '1px solid #e5e5e5', padding: 30, borderRadius: 4 }}>
        <h3 style={{ marginTop: 0, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10 }}>
          {mode === 'add' ? '基本信息' : '修改乘车人信息'}
        </h3>
        
        {error && <div style={{ background: '#ffebeb', border: '1px solid #ffbdbe', color: '#e4393c', padding: '10px', marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          {/* 姓名 */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', position: 'relative' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>
              {mode === 'add' && <span style={{ color: 'red' }}>*</span>}姓名：
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={e => {
                  setFormData({...formData, name: e.target.value});
                  if (fieldErrors.name) setFieldErrors({...fieldErrors, name: ''});
              }}
              onBlur={() => validateField('name', formData.name)}
              disabled={mode === 'edit'}
              style={{ flex: 1, padding: '8px 10px', border: `1px solid ${fieldErrors.name ? 'red' : '#ccc'}`, borderRadius: 4, background: mode === 'edit' ? '#f5f5f5' : '#fff' }}
              placeholder="请输入姓名"
            />
            {mode === 'add' && <div style={{ position: 'absolute', left: '100%', marginLeft: 10, width: 200, color: '#999', fontSize: 12 }}>
              (2-20个字符，支持汉字、字母)
            </div>}
          </div>
          {fieldErrors.name && <div style={{ marginLeft: 115, color: 'red', fontSize: 12, marginTop: -10, marginBottom: 10 }}>{fieldErrors.name}</div>}

          {/* 证件类型 - Add: Select, Edit: ReadOnly */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>
              {mode === 'add' && <span style={{ color: 'red' }}>*</span>}证件类型：
            </label>
            {mode === 'add' ? (
              <select
                value={formData.id_type}
                onChange={e => setFormData({...formData, id_type: e.target.value})}
                style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              >
                {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            ) : (
              <span>{formData.id_type}</span>
            )}
          </div>

          {/* 证件号码 - Add: Input, Edit: ReadOnly */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', position: 'relative' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>
              {mode === 'add' && <span style={{ color: 'red' }}>*</span>}证件号码：
            </label>
            {mode === 'add' ? (
              <input 
                type="text" 
                value={formData.id_number}
                onChange={e => {
                    setFormData({...formData, id_number: e.target.value});
                    if (fieldErrors.id_number) setFieldErrors({...fieldErrors, id_number: ''});
                }}
                onBlur={() => validateField('id_number', formData.id_number)}
                placeholder="请输入证件号码"
                style={{ flex: 1, padding: '8px 10px', border: `1px solid ${fieldErrors.id_number ? 'red' : '#ccc'}`, borderRadius: 4 }}
              />
            ) : (
              <span>{formData.id_number}</span>
            )}
          </div>
          {fieldErrors.id_number && <div style={{ marginLeft: 115, color: 'red', fontSize: 12, marginTop: -10, marginBottom: 10 }}>{fieldErrors.id_number}</div>}

          {/* 手机号码 - Always Editable */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', position: 'relative' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>手机号码：</label>
            <span style={{ marginRight: 5 }}>{formData.phone_country_code}</span>
            <input 
              type="text" 
              value={formData.phone_number}
              onChange={e => {
                  setFormData({...formData, phone_number: e.target.value});
                  if (fieldErrors.phone_number) setFieldErrors({...fieldErrors, phone_number: ''});
                  if (smsVerified) setSmsVerified(false);
              }}
              onBlur={() => validateField('phone_number', formData.phone_number)}
              placeholder="请输入手机号码"
              style={{ flex: 1, padding: '8px 10px', border: `1px solid ${fieldErrors.phone_number ? 'red' : '#ccc'}`, borderRadius: 4 }}
            />
          </div>
          {fieldErrors.phone_number && <div style={{ marginLeft: 115, color: 'red', fontSize: 12, marginTop: -10, marginBottom: 10 }}>{fieldErrors.phone_number}</div>}

          {/* SMS Verification (Only for Add) */}
          {mode === 'add' && (
            <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center' }}>
               <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>验证码：</label>
               <input
                 type="text"
                 value={smsCode}
                 onChange={e => setSmsCode(e.target.value)}
                 placeholder="短信验证码"
                 style={{ width: 120, padding: '8px 10px', border: '1px solid #ccc', borderRadius: 4, marginRight: 10 }}
               />
               <button
                 type="button"
                 onClick={handleSendSms}
                 disabled={smsCountdown > 0 || !formData.phone_number}
                 style={{ padding: '8px 15px', background: smsCountdown > 0 ? '#ccc' : '#fff', border: '1px solid #ccc', borderRadius: 4, cursor: smsCountdown > 0 ? 'default' : 'pointer', color: '#333' }}
               >
                 {smsCountdown > 0 ? `${smsCountdown}s后重发` : '获取验证码'}
               </button>
               <button
                  type="button"
                  onClick={handleVerifySms}
                  disabled={!smsCode || smsVerified}
                  style={{ marginLeft: 10, padding: '8px 15px', background: smsVerified ? '#52c41a' : '#1890ff', color: '#fff', border: 'none', borderRadius: 4, cursor: smsVerified ? 'default' : 'pointer' }}
               >
                  {smsVerified ? '已验证' : '验证'}
               </button>
            </div>
          )}

          {/* 旅客类型 - Always Editable */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>
              <span style={{ color: 'red' }}>*</span>旅客类型：
            </label>
            <select
              value={formData.traveler_type}
              onChange={e => setFormData({...formData, traveler_type: e.target.value})}
              style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            >
              {TRAVELER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* 温馨提示 */}
          <div style={{ margin: '20px 0', padding: 15, background: '#fffbe5', border: '1px solid #fbd800', fontSize: 12, color: '#e4393c' }}>
            <h4>温馨提示：</h4>
            <ol style={{ paddingLeft: 20, margin: 0 }}>
              <li>请确保姓名与证件号码一致，否则将导致核验失败。</li>
              <li>身份核验将在24小时内完成，请耐心等待。</li>
              <li>每位用户最多可添加15位常用乘车人。</li>
            </ol>
          </div>

          <div style={{ paddingLeft: 115, marginTop: 30 }}>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                padding: '10px 30px', 
                background: submitting ? '#ccc' : '#ff9900', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 16
              }}
            >
              {submitting ? '处理中...' : (mode === 'add' ? '下一步' : '保存')}
            </button>
            <button
               type="button"
               onClick={() => window.location.hash = '#/otn/view/passengers.html'}
               style={{ marginLeft: 15, padding: '10px 30px', background: '#eee', color: '#666', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 16 }}
            >
              取消
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
