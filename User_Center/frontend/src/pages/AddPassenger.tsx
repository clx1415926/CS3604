import React, { useState } from 'react';
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

export default function AddPassenger() {
  const [formData, setFormData] = useState({
    name: '',
    id_type: '居民身份证',
    id_number: '',
    phone_country_code: '+86',
    phone_number: '',
    traveler_type: '成人',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

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

  const validateField = (name: string, value: string) => {
    let msg = '';
    if (name === 'name') {
      if (!value) msg = '请输入姓名';
      else if (!/^[\u4e00-\u9fa5a-zA-Z·.]{2,20}$/.test(value)) msg = '姓名只能包含汉字、字母、点(.)或中点(·)，且长度为2-20位';
    }
    if (name === 'id_number') {
        if (!value) msg = '请输入证件号码';
        else if (formData.id_type === '居民身份证') {
            let id = value;
            if (id.length === 15) id = convert15to18(id); // Check against converted
            if (!validateIdCard18(id)) msg = '身份证号码格式不正确';
        }
    }
    if (name === 'phone_number') {
        if (!value) msg = '请输入手机号码';
        else if (!validatePhone(formData.phone_country_code, value)) msg = '手机号码格式错误';
    }
    setFieldErrors(prev => ({ ...prev, [name]: msg }));
    return msg;
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      validateField(e.target.name, e.target.value);
  };

  const handleChange = (key: string, value: string) => {
      setFormData(prev => ({ ...prev, [key]: value }));
      if (fieldErrors[key]) {
          setFieldErrors(prev => ({ ...prev, [key]: '' }));
      }
  };

  const validate = () => {
    const errName = validateField('name', formData.name);
    const errId = validateField('id_number', formData.id_number);
    const errPhone = validateField('phone_number', formData.phone_number);
    
    if (errName || errId || errPhone) return '请检查输入信息';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    // Auto upgrade before submit
    let finalId = formData.id_number;
    if (formData.id_type === '居民身份证' && finalId.length === 15) {
        finalId = convert15to18(finalId);
    }
    const payload = { ...formData, id_number: finalId };

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
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sid}`
      };

      const res = await fetch('http://localhost:8083/api/v1/passengers', {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (res.ok) {
        alert('添加成功');
        window.location.hash = '#/otn/view/passengers.html';
      } else {
        const d = await res.json().catch(() => ({}));
        let msg = d.error || '添加失败';
        if (msg === 'PASSENGER_LIMIT_EXCEEDED') msg = '乘车人数量已达上限';
        if (msg.startsWith('MISSING_')) msg = '缺少必填信息';
        if (msg === 'INVALID_ID_NUMBER_FORMAT') msg = '身份证号格式错误';
        if (msg === 'INVALID_PHONE_FORMAT') msg = '手机号格式错误';
        if (msg === 'INVALID_NAME_FORMAT') msg = '姓名格式错误';
        if (d.message) msg = d.message; // Prefer backend message if available
        setError(msg);
      }
    } catch (e: any) {
      clearTimeout(timeoutId);
      if (e.name === 'AbortError') {
        setError('请求超时，请检查网络状况');
      } else {
        setError('网络连接失败，请稍后重试');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="passenger-edit-page">
      <div className="header">
        <h2>添加乘车人</h2>
      </div>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-item">
            <label>姓名:</label>
            <input 
              type="text" 
              name="name"
              value={formData.name} 
              onChange={e => handleChange('name', e.target.value)}
              onBlur={handleBlur}
              placeholder="请输入姓名"
              className={fieldErrors.name ? 'error' : ''}
            />
            {fieldErrors.name && <span className="field-error" style={{color:'red', fontSize:'12px'}}>{fieldErrors.name}</span>}
          </div>
          <div className="form-item">
            <label>证件类型:</label>
            <select 
              value={formData.id_type} 
              onChange={e => setFormData({...formData, id_type: e.target.value})}
            >
              {ID_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-item">
            <label>证件号码:</label>
            <input 
              type="text" 
              name="id_number"
              value={formData.id_number} 
              onChange={e => handleChange('id_number', e.target.value)}
              onBlur={handleBlur}
              placeholder="请输入证件号码"
              className={fieldErrors.id_number ? 'error' : ''}
            />
            {fieldErrors.id_number && <span className="field-error" style={{color:'red', fontSize:'12px'}}>{fieldErrors.id_number}</span>}
          </div>
          <div className="form-item">
            <label>手机号码:</label>
            <div style={{display:'flex', flexDirection: 'column', flex: 1}}>
                <div style={{display:'flex'}}>
                  <select 
                    value={formData.phone_country_code}
                    onChange={e => setFormData({...formData, phone_country_code: e.target.value})}
                    style={{width: 80, marginRight: 8}}
                  >
                    <option value="+86">+86</option>
                    <option value="+852">+852</option>
                    <option value="+853">+853</option>
                    <option value="+886">+886</option>
                  </select>
                  <input 
                    type="text" 
                    name="phone_number"
                    value={formData.phone_number} 
                    onChange={e => handleChange('phone_number', e.target.value)}
                    onBlur={handleBlur}
                    placeholder="请输入手机号码"
                    style={{flex:1}}
                    className={fieldErrors.phone_number ? 'error' : ''}
                  />
                </div>
                {fieldErrors.phone_number && <span className="field-error" style={{color:'red', fontSize:'12px'}}>{fieldErrors.phone_number}</span>}
            </div>
          </div>
          <div className="form-item">
            <label>旅客类型:</label>
            <select 
              value={formData.traveler_type} 
              onChange={e => setFormData({...formData, traveler_type: e.target.value})}
            >
              {TRAVELER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {error && <div className="error-msg" style={{color:'red', marginBottom: 10}}>{error}</div>}

          <div className="form-actions">
            <button type="submit" disabled={submitting} className="btn-primary">保存</button>
            <button type="button" onClick={() => window.history.back()} style={{marginLeft: 10}}>取消</button>
          </div>
        </form>
      </div>
    </div>
  );
}
