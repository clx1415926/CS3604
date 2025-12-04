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

  const getAuthHeaders = () => {
    const sid = getSid();
    return sid ? { 'Authorization': `Bearer ${sid}` } : {};
  };

  const fetchPassengers = async () => {
    setLoading(true);
    setError('');
    try {
      let url = 'http://localhost:8083/api/v1/passengers';
      if (keyword) {
        url += `?name=${encodeURIComponent(keyword)}`;
      }
      const res = await fetch(url, {
        headers: getAuthHeaders() as HeadersInit
      });
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
        headers: getAuthHeaders() as HeadersInit
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
    
    for (const id of Array.from(selectedIds)) {
      await fetch(`http://localhost:8083/api/v1/passengers/${id}`, { 
        method: 'DELETE',
        headers: getAuthHeaders() as HeadersInit
      });
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPassengers();
  };

  return (
    <div className="passenger-list-page">
      <div className="header">
        <h2>乘车人管理</h2>
        <div className="actions">
          <a href="#/otn/view/add_passenger.html" className="btn-primary">添加乘车人</a>
        </div>
      </div>

      <div className="search-bar">
        <form onSubmit={handleSearch}>
          <input 
            type="text" 
            placeholder="请输入乘车人姓名" 
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />
          <button type="submit">查询</button>
        </form>
      </div>

      {error && <div className="error-msg">{error}</div>}
      
      <div className="list-container">
        {loading ? <div>加载中...</div> : (
          <table>
            <thead>
              <tr>
                <th>
                  <input 
                    type="checkbox" 
                    onChange={(e) => {
                      if (e.target.checked) setSelectedIds(new Set(passengers.map(p => p.passenger_id)));
                      else setSelectedIds(new Set());
                    }}
                    checked={passengers.length > 0 && selectedIds.size === passengers.length}
                  />
                </th>
                <th>姓名</th>
                <th>证件类型</th>
                <th>证件号码</th>
                <th>手机号</th>
                <th>旅客类型</th>
                <th>核验状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {passengers.length === 0 && <tr><td colSpan={8} style={{textAlign:'center'}}>暂无乘车人</td></tr>}
              {passengers.map(p => (
                <tr key={p.passenger_id}>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedIds.has(p.passenger_id)}
                      onChange={() => toggleSelect(p.passenger_id)}
                    />
                  </td>
                  <td>{p.name}{p.is_self && <span className="tag">本人</span>}</td>
                  <td>{p.id_type}</td>
                  <td>{p.id_number_masked || p.id_number}</td>
                  <td>{p.phone_number_masked || p.phone_number}</td>
                  <td>{p.traveler_type}</td>
                  <td>
                    <span className={`status-${p.verified_status === '已通过' ? 'success' : 'pending'}`}>
                      {p.verified_status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => handleDelete(p.passenger_id)} disabled={p.is_self}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {selectedIds.size > 0 && (
        <div className="batch-actions">
          <button onClick={handleBatchDelete}>批量删除</button>
        </div>
      )}
    </div>
  );
}
