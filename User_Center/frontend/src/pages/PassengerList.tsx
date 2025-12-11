import React, { useEffect, useState } from 'react';
import './PassengerList.css';
import gonganIcon from '../assets/passenger_assets/gongan.png';

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
  protected_flag?: number;
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
        alert(d.message || d.error || '删除失败');
        return;
      }
      fetchPassengers();
    } catch (e) {
      alert('删除失败');
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.size === 0) {
      alert('请选择要删除的乘车人');
      return;
    }
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
      {/* Search Bar */}
      <div className="search-box">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <input 
              id="_search_name"
              className="search-input"
              type="text" 
              placeholder="请输入乘客姓名" 
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
            {keyword && (
              <span className="search-clear-icon" onClick={() => { setKeyword(''); fetchPassengers(); }}>
                ✖
              </span>
            )}
          </div>
          <button type="submit" id="serch_btn" className="search-btn">查询</button>
        </form>
      </div>

      {error && <div className="error-msg">{error}</div>}
      
      <div className="list-container">
        {loading ? <div>加载中...</div> : (
          <>
             {/* Toolbar */}
            <div className="toolbar">
              <a href="#/otn/view/add_passenger.html" className="toolbar-btn add-btn" style={{ textDecoration: 'none' }}>
                {/* Spec doesn't use the circle icon anymore */}
                添加
              </a>
              <button className="toolbar-btn delete-batch-btn" onClick={handleBatchDelete}>
                <span className="icon-delete-trash"></span>
                批量删除
              </button>
            </div>

            <table className="passenger-table order-panel-head">
              <thead>
                <tr>
                  <th className="col-seq">序号</th>
                  <th className="col-name">姓名</th>
                  <th className="col-id-type">证件类型</th>
                  <th className="col-id-no">证件号码</th>
                  <th className="col-phone">手机／电话</th>
                  <th className="col-status">核验状态</th>
                  <th className="col-op">操作</th>
                </tr>
              </thead>
              <tbody>
                {passengers.length === 0 && <tr><td colSpan={7} style={{textAlign:'center'}}>暂无乘车人</td></tr>}
                {passengers.map((p, index) => (
                  <tr key={p.passenger_id} className="passenger-row">
                    <td>
                       <div className="seq-wrapper">
                         {!(p.is_self || p.protected_flag === 1) && (
                           <input 
                             type="checkbox" 
                             className="row-checkbox"
                             checked={selectedIds.has(p.passenger_id)}
                             onChange={() => toggleSelect(p.passenger_id)}
                           />
                         )}
                         <span className="seq-num">{index + 1}</span>
                       </div>
                    </td>
                    <td>{p.name}</td>
                    <td>{p.id_type}</td>
                    <td>{p.id_number_masked || p.id_number}</td>
                    <td>{p.phone_number_masked || p.phone_number ? `(+${p.phone_country_code || '86'})${p.phone_number_masked || p.phone_number}` : ''}</td>
                    <td>
                       <div className={`status-${p.verified_status === '已通过' ? 'verified' : 'pending'}`}>
                          {p.verified_status === '已通过' ? (
                            '已通过'
                          ) : (
                            <span>{p.verified_status}</span>
                          )}
                       </div>
                    </td>
                    <td>
                      {(p.is_self || p.protected_flag === 1) ? (
                         null
                      ) : (
                        <span className="op-btn" onClick={() => handleDelete(p.passenger_id)}>删除</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
}
