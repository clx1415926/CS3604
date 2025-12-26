import React, { useEffect, useState } from 'react';
import './PassengerList.css';

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
  const [confirmState, setConfirmState] = useState<{
    open: boolean;
    title: string;
    message: string;
    mode: 'confirm' | 'alert';
    confirmText: string;
    cancelText: string;
    onConfirm: null | (() => Promise<void> | void);
  }>({
    open: false,
    title: '提示',
    message: '',
    mode: 'alert',
    confirmText: '确定',
    cancelText: '取消',
    onConfirm: null,
  });
  const [confirmPending, setConfirmPending] = useState(false);

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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const msg = (data && (data.message || data.error)) || '获取乘车人信息失败，请稍后重试';
        setError(msg);
        setPassengers([]);
        return;
      }
      const data = await res.json();
      setPassengers(data.passengers || []);
    } catch (err: any) {
      if (err && err.message === 'Failed to fetch') {
        setError('获取乘车人信息失败，请检查网络或稍后重试');
      } else {
        setError('获取乘车人信息失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPassengers();
  }, []);

  const showAlert = (message: string, title = '提示') => {
    setConfirmPending(false);
    setConfirmState({
      open: true,
      title,
      message,
      mode: 'alert',
      confirmText: '确定',
      cancelText: '取消',
      onConfirm: null,
    });
  };

  const showConfirm = (opts: { title?: string; message: string; confirmText?: string; cancelText?: string; onConfirm: () => Promise<void> | void }) => {
    setConfirmPending(false);
    setConfirmState({
      open: true,
      title: opts.title || '提示',
      message: opts.message,
      mode: 'confirm',
      confirmText: opts.confirmText || '确认',
      cancelText: opts.cancelText || '取消',
      onConfirm: opts.onConfirm,
    });
  };

  const deletePassengers = async (ids: string[]) => {
    if (!ids.length) return;
    try {
      for (const id of ids) {
        const res = await fetch(`http://localhost:8083/api/v1/passengers/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders() as HeadersInit,
        });
        if (!res.ok) {
          const d = await res.json().catch(() => ({} as any));
          throw new Error(d?.message || d?.error || '删除失败');
        }
      }

      setSelectedIds((prev) => {
        const next = new Set(prev);
        for (const id of ids) next.delete(id);
        return next;
      });
      await fetchPassengers();
    } catch (e: any) {
      showAlert(e?.message || '删除失败');
    }
  };

  const handleDelete = (id: string) => {
    showConfirm({
      message: '确认删除该乘车人吗？',
      onConfirm: async () => {
        setConfirmPending(true);
        setConfirmState((s) => ({ ...s, open: false }));
        await deletePassengers([id]);
        setConfirmPending(false);
      },
    });
  };

  const handleBatchDelete = () => {
    if (selectedIds.size === 0) {
      showAlert('请选择要删除的乘车人');
      return;
    }
    const ids = Array.from(selectedIds);
    showConfirm({
      message: `确认删除选中的 ${ids.length} 位乘车人吗？`,
      onConfirm: async () => {
        setConfirmPending(true);
        setConfirmState((s) => ({ ...s, open: false }));
        await deletePassengers(ids);
        setConfirmPending(false);
      },
    });
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

      {confirmState.open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 4, width: 480, maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', fontSize: 14 }}>
            <div style={{ padding: '0 16px', height: 40, lineHeight: '40px', background: '#2d7dd2', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{confirmState.title}</span>
              <span style={{ cursor: confirmPending ? 'not-allowed' : 'pointer', fontSize: 20, opacity: 0.8 }} onClick={() => { if (!confirmPending) setConfirmState((s) => ({ ...s, open: false })); }}>×</span>
            </div>
            <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ fontSize: 32, color: confirmState.mode === 'alert' ? '#2ecc71' : '#ffb800', lineHeight: 1 }}>{confirmState.mode === 'alert' ? '✔' : '⚠'}</div>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 'bold' }}>{confirmState.message}</div>
            </div>
            <div style={{ padding: '10px 20px 20px', display: 'flex', justifyContent: 'center', gap: 12 }}>
              {confirmState.mode === 'confirm' && (
                <button
                  style={{ background: '#fff', color: '#666', border: '1px solid #dcdfe6', padding: '9px 23px', borderRadius: 4, cursor: confirmPending ? 'not-allowed' : 'pointer', fontSize: 14, opacity: confirmPending ? 0.6 : 1 }}
                  disabled={confirmPending}
                  onClick={() => setConfirmState((s) => ({ ...s, open: false }))}
                >
                  {confirmState.cancelText}
                </button>
              )}
              <button
                style={{ background: '#ff8a00', color: '#fff', border: 'none', padding: '9px 23px', borderRadius: 4, cursor: confirmPending ? 'not-allowed' : 'pointer', fontSize: 14, opacity: confirmPending ? 0.6 : 1 }}
                disabled={confirmPending}
                onClick={async () => {
                  if (confirmPending) return;
                  if (confirmState.mode === 'alert') {
                    setConfirmState((s) => ({ ...s, open: false }));
                    return;
                  }
                  const cb = confirmState.onConfirm;
                  if (!cb) {
                    setConfirmState((s) => ({ ...s, open: false }));
                    return;
                  }
                  await cb();
                }}
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
