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
  
  const getSid = () => {
    const fromLocal = localStorage.getItem('SESSION_ID') || localStorage.getItem('session_id') || '';
    const fromSession = sessionStorage.getItem('session_id') || sessionStorage.getItem('SESSION_ID') || '';
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
    const incoming = fromHash || fromSearch;
    if (incoming) {
      try {
        localStorage.setItem('SESSION_ID', incoming);
        sessionStorage.setItem('session_id', incoming);
      } catch (e) {}
    }
    if (fromLocal) return fromLocal;
    if (fromSession) return fromSession;
    return incoming;
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

    const sid = getSid();
    if (!sid) {
      setError('登录失效，请重新登录');
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
        'Authorization': `Bearer ${sid}`
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

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <div style={{ marginBottom: 20, fontSize: 14, color: '#666' }}>
        当前位置：个人中心 &gt; 常用信息管理 &gt; 乘车人 &gt; {mode === 'add' ? '添加' : '修改'}
      </div>

      {/* 温馨提示 Banner */}
      <div style={{ marginBottom: 20, padding: '10px 15px', background: '#fffbe5', border: '1px solid #fbd800', fontSize: 12, color: '#e4393c', display: 'flex', alignItems: 'center' }}>
         <span style={{ marginRight: 5 }}>💡</span>
         <span>如旅客身份信息未能添加后的24小时内通过核验，请乘车人持有效身份证原件到车站办理身份核验。</span>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', background: '#fff', padding: 30, borderRadius: 4, border: '1px solid #e5e5e5' }}>
        
        {error && <div style={{ background: '#ffebeb', border: '1px solid #ffbdbe', color: '#e4393c', padding: '10px', marginBottom: 20 }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Basic Info */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', borderLeft: '4px solid #1890ff', paddingLeft: 10, marginBottom: 20, color: '#333' }}>
              基本信息
            </h3>

            {/* 证件类型 */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
              <label style={{ width: 120, textAlign: 'right', marginRight: 15, color: '#333' }}>
                <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>证件类型：
              </label>
              {mode === 'add' ? (
                <select
                  value={formData.id_type}
                  onChange={e => setFormData({...formData, id_type: e.target.value})}
                  style={{ width: 240, padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 2, height: 32 }}
                >
                  {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              ) : (
                <span style={{ padding: '6px 0' }}>{formData.id_type}</span>
              )}
            </div>

            {/* 姓名 */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start' }}>
              <label style={{ width: 120, textAlign: 'right', marginRight: 15, paddingTop: 6, color: '#333' }}>
                <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>姓名：
              </label>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={e => {
                        setFormData({...formData, name: e.target.value});
                        if (fieldErrors.name) setFieldErrors({...fieldErrors, name: ''});
                    }}
                    onBlur={() => validateField('name', formData.name)}
                    disabled={mode === 'edit'}
                    style={{ width: 240, padding: '6px 10px', border: `1px solid ${fieldErrors.name ? '#ff4d4f' : '#d9d9d9'}`, borderRadius: 2, height: 32, background: mode === 'edit' ? '#f5f5f5' : '#fff' }}
                    placeholder="请输入姓名"
                  />
                  {mode === 'add' && <span style={{ marginLeft: 10, color: '#ff9900', fontSize: 12 }}>姓名填写规则（用于身份核验）</span>}
                </div>
                {fieldErrors.name && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{fieldErrors.name}</div>}
              </div>
            </div>

            {/* 证件号码 */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start' }}>
              <label style={{ width: 120, textAlign: 'right', marginRight: 15, paddingTop: 6, color: '#333' }}>
                <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>证件号码：
              </label>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
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
                      style={{ width: 240, padding: '6px 10px', border: `1px solid ${fieldErrors.id_number ? '#ff4d4f' : '#d9d9d9'}`, borderRadius: 2, height: 32 }}
                    />
                  ) : (
                    <span style={{ padding: '6px 0' }}>{formData.id_number}</span>
                  )}
                  {mode === 'add' && <span style={{ marginLeft: 10, color: '#ff9900', fontSize: 12 }}>用于身份核验，请正确填写。</span>}
                </div>
                {fieldErrors.id_number && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{fieldErrors.id_number}</div>}
              </div>
            </div>
          </div>

          {/* Section 2: Contact Info */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', borderLeft: '4px solid #1890ff', paddingLeft: 10, marginBottom: 20, color: '#333' }}>
              联系方式<span style={{ fontSize: 12, color: '#ff9900', fontWeight: 'normal', marginLeft: 10 }}>(请提供乘车人真实有效的联系方式)</span>
            </h3>

            {/* 手机号码 */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'flex-start' }}>
              <label style={{ width: 120, textAlign: 'right', marginRight: 15, paddingTop: 6, color: '#333' }}>
                手机号码：
              </label>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <select 
                    value={formData.phone_country_code}
                    onChange={e => setFormData({...formData, phone_country_code: e.target.value})}
                    style={{ width: 80, padding: '6px 5px', border: '1px solid #d9d9d9', borderRadius: 2, height: 32, marginRight: 10 }}
                  >
                    <option value="+86">+86</option>
                    <option value="+852">+852</option>
                    <option value="+853">+853</option>
                    <option value="+886">+886</option>
                  </select>
                  <input 
                    type="text" 
                    value={formData.phone_number}
                    onChange={e => {
                        setFormData({...formData, phone_number: e.target.value});
                        if (fieldErrors.phone_number) setFieldErrors({...fieldErrors, phone_number: ''});
                    }}
                    onBlur={() => validateField('phone_number', formData.phone_number)}
                    placeholder="请输入手机号码"
                    style={{ width: 150, padding: '6px 10px', border: `1px solid ${fieldErrors.phone_number ? '#ff4d4f' : '#d9d9d9'}`, borderRadius: 2, height: 32 }}
                  />
                  <span style={{ marginLeft: 10, color: '#ff9900', fontSize: 12 }}>请填写乘车人真实有效的联系方式，以便接收铁路部门推送的重要服务信息，以及在紧急特殊情况下的联系。</span>
                </div>
                {fieldErrors.phone_number && <div style={{ color: '#ff4d4f', fontSize: 12, marginTop: 4 }}>{fieldErrors.phone_number}</div>}
              </div>
            </div>
          </div>

          {/* Section 3: Additional Info */}
          <div style={{ marginBottom: 30 }}>
            <h3 style={{ fontSize: 16, fontWeight: 'bold', borderLeft: '4px solid #1890ff', paddingLeft: 10, marginBottom: 20, color: '#333' }}>
              附加信息
            </h3>

            {/* 旅客类型 */}
            <div style={{ marginBottom: 20, display: 'flex', alignItems: 'center' }}>
              <label style={{ width: 120, textAlign: 'right', marginRight: 15, color: '#333' }}>
                <span style={{ color: '#ff4d4f', marginRight: 4 }}>*</span>优惠(待)类型：
              </label>
              <select
                value={formData.traveler_type}
                onChange={e => setFormData({...formData, traveler_type: e.target.value})}
                style={{ width: 240, padding: '6px 10px', border: '1px solid #d9d9d9', borderRadius: 2, height: 32 }}
              >
                {TRAVELER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: 40, borderTop: '1px solid #e5e5e5', paddingTop: 20 }}>
            <button
               type="button"
               onClick={() => window.location.hash = '#/otn/view/passengers.html'}
               style={{ padding: '8px 30px', background: '#f5f5f5', color: '#666', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer', fontSize: 14, marginRight: 15 }}
            >
              取消
            </button>
            <button 
              type="submit" 
              disabled={submitting}
              style={{ 
                padding: '8px 30px', 
                background: submitting ? '#ccc' : '#ff9900', 
                color: '#fff', 
                border: 'none', 
                borderRadius: 4, 
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: 14
              }}
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
