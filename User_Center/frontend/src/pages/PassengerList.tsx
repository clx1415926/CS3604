import React, { useEffect, useState } from 'react';

interface Passenger {
  passenger_id: string;
  name: string;
  id_type: string;
  id_number: string;
  id_number_masked?: string;
  phone_country_code: string;
  phone_number: string;
  phone_number_masked?: string;
  traveler_type: string;
  verified_status: string;
  is_self: boolean;
}

export default function PassengerList() {
  const [passengers, setPassengers] = useState<Passenger[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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

  const fetchPassengers = async () => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:8083/api/v1/passengers';
      if (keyword) {
        url += `?name=${encodeURIComponent(keyword)}`;
      }
      const sid = getSid();
      // For now, assuming API doesn't strictly require Auth header for the mock, 
      // but passing it is good practice if middleware enforced it.
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch passengers');
      const data = await res.json();
      setPassengers(data.passengers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengers();
  }, []);

  const handleDelete = async (id: string) => {
    if (!window.confirm('确认删除该乘车人吗？')) return;
    try {
      const res = await fetch(`http://localhost:8083/api/v1/passengers/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const d = await res.json();
        alert(d.error || '删除失败');
        return;
      }
      fetchPassengers();
    } catch (e) {
      alert('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!window.confirm(`确认删除选中的 ${selectedIds.size} 位乘车人吗？`)) return;
    
    // API doesn't support batch delete yet, so we loop (not ideal but works for prototype)
    // Or we could update API. Requirement mentioned batch delete.
    // For now, loop.
    for (const id of Array.from(selectedIds)) {
      await fetch(`http://localhost:8083/api/v1/passengers/${id}`, { method: 'DELETE' });
    }
    setSelectedIds(new Set());
    fetchPassengers();
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 20, fontSize: 14, color: '#666' }}>
        当前位置：个人中心 &gt; 常用信息管理 &gt; 乘车人
      </div>

      <div style={{ display: 'flex', marginBottom: 20 }}>
        <div style={{ position: 'relative', display: 'inline-block', marginRight: 10 }}>
          <input
            type="text"
            placeholder="请输入乘客姓名"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            style={{ padding: '5px 25px 5px 10px', width: 200, boxSizing: 'border-box' }}
          />
          {keyword && (
            <span 
              onClick={() => { setKeyword(''); }}
              style={{ 
                position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', 
                cursor: 'pointer', color: '#999', fontSize: 18, lineHeight: 1 
              }}
            >
              ×
            </span>
          )}
        </div>
        <button 
          onClick={fetchPassengers}
          style={{ padding: '5px 15px', background: '#ff9900', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}
        >
          查询
        </button>
      </div>

      {error && <div style={{ color: 'red', marginBottom: 10 }}>{error}</div>}

      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #e5e5e5' }}>
        <thead style={{ background: '#f8f8f8' }}>
          <tr>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>序号</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5', textAlign: 'left' }}>姓名</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>证件类型</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>证件号码</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>手机/电话</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>旅客类型</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>核验状态</th>
            <th style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>操作</th>
          </tr>
        </thead>
        <tbody>
          {passengers.map((p, index) => (
            <tr key={p.passenger_id} style={{ textAlign: 'center' }}>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>
                {!p.is_self && (
                  <input 
                    type="checkbox" 
                    checked={selectedIds.has(p.passenger_id)}
                    onChange={() => toggleSelect(p.passenger_id)}
                    style={{ marginRight: 5 }}
                  />
                )}
                {index + 1}
              </td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5', textAlign: 'left' }}>{p.name}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>{p.id_type}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>{p.id_number_masked || p.id_number}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>{p.phone_number_masked || p.phone_number}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>{p.traveler_type}</td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5', color: p.verified_status === '已通过' ? 'green' : '#f90' }}>
                {p.verified_status}
              </td>
              <td style={{ padding: 10, borderBottom: '1px solid #e5e5e5' }}>
                <span 
                  style={{ cursor: 'pointer', color: '#2e6fe7', marginRight: 10 }}
                  onClick={() => window.location.hash = `#/otn/view/passenger_edit.html?id=${p.passenger_id}`}
                >
                  修改
                </span>
                {!p.is_self && (
                  <span 
                    style={{ cursor: 'pointer', color: '#ff9900' }}
                    onClick={() => handleDelete(p.passenger_id)}
                  >
                    删除
                  </span>
                )}
              </td>
            </tr>
          ))}
          {passengers.length === 0 && !loading && (
            <tr>
              <td colSpan={8} style={{ padding: 20, textAlign: 'center', color: '#999' }}>暂无乘车人</td>
            </tr>
          )}
        </tbody>
      </table>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => window.location.hash = '#/otn/view/passenger_edit.html?type=add'}
          style={{ padding: '8px 20px', background: '#2e6fe7', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', marginRight: 10 }}
        >
          + 添加乘车人
        </button>
        <button
          onClick={handleBatchDelete}
          style={{ padding: '8px 20px', background: '#fff', color: '#2e6fe7', border: '1px solid #2e6fe7', borderRadius: 4, cursor: 'pointer' }}
        >
          批量删除
        </button>
      </div>
    </div>
  );
}
