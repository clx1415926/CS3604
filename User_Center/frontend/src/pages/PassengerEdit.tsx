import React, { useState, useEffect } from 'react';

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

function validateIdCard(id: string) {
  if (!/^\d{17}[\dXx]$/.test(id)) return false;
  return true;
}

export default function PassengerEdit() {
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
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showRule, setShowRule] = useState(false);


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
      const res = await fetch(`http://localhost:8083/api/v1/passengers/${id}`);
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

  const validate = () => {
    if (!formData.name) return '请输入姓名';
    if (!/^[\u4e00-\u9fa5a-zA-Z·.]+$/.test(formData.name)) return '姓名只能包含汉字、字母、点(.)或中点(·)';
    
    if (!formData.id_number) return '请输入证件号码';
    if (formData.id_type === '居民身份证' && !formData.id_number.includes('*')) {
      if (!validateIdCard(formData.id_number)) return '身份证号码格式不正确';
    }
    
    if (formData.phone_country_code === '+86' && formData.phone_number) {
      if (!/^1[3-9]\d{9}$/.test(formData.phone_number) && !formData.phone_number.includes('*')) {
        return '手机号码格式错误';
      }
    }
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

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) {
        if (data.error === 'PASSENGER_LIMIT_EXCEEDED') setError('常用联系人已超过上限(15人)');
        else if (data.error === 'INVALID_TRAVELER_TYPE') setError('无效的旅客类型');
        else if (data.error === 'PASSENGER_NOT_FOUND') setError('乘车人不存在');
        else setError(data.error || '操作失败');
      } else {
        alert(mode === 'add' ? '添加成功' : '修改成功');
        window.location.hash = '#/otn/view/passengers.html';
      }
    } catch (e) {
      setError('网络异常，请稍后再试');
    } finally {
      setSubmitting(false);
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
          {/* 姓名 - Add: Editable, Edit: ReadOnly */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center', position: 'relative' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>
              {mode === 'add' && <span style={{ color: 'red' }}>*</span>}姓名：
            </label>
            {mode === 'add' ? (
              <>
                <input 
                  type="text" 
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  placeholder="请输入姓名"
                  style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
                />
                <span 
                  style={{ marginLeft: 10, fontSize: 12, color: '#2e6fe7', cursor: 'pointer' }}
                  onClick={() => setShowRule(!showRule)}
                >
                  姓名填写规则
                </span>
                {showRule && (
                  <div style={{
                    position: 'absolute', top: 40, left: 115, zIndex: 10,
                    background: '#fff', border: '1px solid #ccc', padding: 10,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.15)', width: 300, fontSize: 12, color: '#333'
                  }}>
                    <h5 style={{ margin: '0 0 5px 0' }}>姓名填写规则</h5>
                    <ul style={{ paddingLeft: 20, margin: 0 }}>
                      <li>确认姓名中生僻字无法输入时，可用生僻字拼音或同音字替代。</li>
                      <li>姓名中包含繁体字可直接输入。</li>
                      <li>姓名较长，汉字与英文字母连用时，请留意区分。</li>
                    </ul>
                    <div style={{ textAlign: 'right', marginTop: 5 }}>
                      <button type="button" onClick={() => setShowRule(false)}>关闭</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <span>{formData.name}</span>
            )}
          </div>

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
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>
              {mode === 'add' && <span style={{ color: 'red' }}>*</span>}证件号码：
            </label>
            {mode === 'add' ? (
              <input 
                type="text" 
                value={formData.id_number}
                onChange={e => setFormData({...formData, id_number: e.target.value})}
                placeholder="请输入证件号码"
                style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
              />
            ) : (
              <span>{formData.id_number}</span>
            )}
          </div>

          {/* 手机号码 - Always Editable */}
          <div style={{ marginBottom: 15, display: 'flex', alignItems: 'center' }}>
            <label style={{ width: 100, textAlign: 'right', marginRight: 15 }}>手机号码：</label>
            <span style={{ marginRight: 5 }}>{formData.phone_country_code}</span>
            <input 
              type="text" 
              value={formData.phone_number}
              onChange={e => setFormData({...formData, phone_number: e.target.value})}
              placeholder="请输入手机号码"
              style={{ flex: 1, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}
            />
          </div>

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
