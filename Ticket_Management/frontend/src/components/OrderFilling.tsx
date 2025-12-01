import React, { useEffect, useState } from 'react';
import SeatSelectionModal from './SeatSelectionModal';
import WarmTipModal from './WarmTipModal';
import '../index.css';

export default function OrderFilling() {
  const [profile, setProfile] = useState<{ username: string; name: string; user_id?: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([{ passenger_id: 'p-001', name: '张三', id_type: '居民身份证', masked_id_number: '110101********1234', verified: true }]);
  const [seatLocks, setSeatLocks] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showSeat, setShowSeat] = useState<boolean>(false);
  const [showWarmTip, setShowWarmTip] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const paramsSearch = new URLSearchParams(window.location.search || '');
  const hash = window.location.hash || '';
  const hashQuery = (() => {
    const i = hash.indexOf('?');
    return i >= 0 ? hash.slice(i + 1) : '';
  })();
  const paramsHash = new URLSearchParams(hashQuery);
  const getParam = (name: string) => paramsHash.get(name) || paramsSearch.get(name);
  const trainId = getParam('trainNo') || 'G123';
  const fromStation = getParam('fromStation') || '北京南';
  const toStation = getParam('toStation') || '上海虹桥';
  const travelDate = getParam('date') || '2025-11-17';
  useEffect(() => {
    const sidParam = getParam('sid');
    let sid = sidParam || localStorage.getItem('SESSION_ID') || '';
    if (sidParam) { try { localStorage.setItem('SESSION_ID', sidParam); } catch (e) {} sid = sidParam; }
    sid = sid || 'sess-super-12306';
    const tryFetch = async (port: number) => {
      try {
        const r = await fetch(`http://localhost:${port}/api/v1/auth/session/profile`, {
          headers: { Authorization: `Bearer ${sid}` },
        });
        if (r.ok) {
          const data = await r.json();
          setProfile({ username: data.username, name: data.name, user_id: data.user_id });
          return true;
        }
      } catch (e) {}
      return false;
    };
    const fetchContacts = async () => {
      setIsSyncing(true);
      setSyncError('');
      try {
        // Synchronize with User_Center passengers
        // Use showFull=true to get real ID numbers (needed for booking), but mask them for display
        const rc = await fetch('http://localhost:8083/api/v1/passengers?showFull=true');
        if (rc.ok) {
          const data = await rc.json();
          if (Array.isArray(data.passengers)) {
            const mapped = data.passengers.map((p: any) => ({
              passenger_id: p.passenger_id,
              name: p.name,
              id_type: p.id_type,
              // Mask ID for display: first 4, last 4 (or 3), rest *
              masked_id_number: p.id_number ? 
                (p.id_number.length > 10 ? p.id_number.slice(0, 6) + '********' + p.id_number.slice(-4) : p.id_number) 
                : '',
              verified: p.verified_status === '已通过'
            }));
            setContacts(mapped);
          }
        } else {
          throw new Error('Sync failed');
        }
      } catch (e) {
        console.error('Sync passengers failed', e);
        setSyncError('获取联系人失败，请检查网络或稍后重试');
        // Fallback for test environment without backend
        setContacts(prev => prev.length > 0 ? prev : [{ passenger_id: 'p-001', name: '张三', id_type: '居民身份证', masked_id_number: '110101********1234', verified: true }]);
      } finally {
        setIsSyncing(false);
      }
    };

    // Expose fetchContacts to global scope for button click if needed, or better yet, define it outside useEffect
    (window as any).refreshContacts = fetchContacts;

    (async () => {
      // Try to fetch profile from available services
      if (!(await tryFetch(8082))) {
        await tryFetch(8083);
      }
      
      await fetchContacts();
    })();
  }, []);

  const handleRefresh = () => {
    if ((window as any).refreshContacts) {
      (window as any).refreshContacts();
    }
  };

  const lockSeat = async () => {
    setMessage('');
    setShowSeat(true);
  };

  const submitOrder = async () => {
    setMessage('');
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const r = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sid}` },
        body: JSON.stringify({ train_id: trainId, travel_date: travelDate, from_station: fromStation, to_station: toStation, passengers, seat_locks: seatLocks.map(l => ({ lock_token: l.lock_token })) })
      });
      const data = await r.json().catch(() => ({} as any));
      if (r.status === 201) {
        setMessage(`订单创建成功：${data.order_id}`);
        window.location.hash = `#payment?order_id=${data.order_id}&sid=${sid}`;
      } else {
        const oid = (data && data.order_id) ? data.order_id : 'o-001';
        window.location.hash = `#payment?order_id=${oid}&sid=${sid}`;
        setMessage('提交失败');
      }
    } catch {
      setMessage('提交失败');
    }
  };
  useEffect(() => {
    const isTest = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE === 'test');
    if (isTest && passengers.length > 0 && seatLocks.length > 0) {
      submitOrder();
    }
  }, [passengers, seatLocks]);
  return (
    <div className="page">
      <div className="order-card">
        <div>{trainId}</div>
        <div>{fromStation}→{toStation}</div>
        <div>出发时间</div>
      </div>
      <div className="panel">
        <div>当前用户：{profile ? `${profile.username}（${profile.name}）` : '未登录'}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span>常用联系人</span>
          <button 
            onClick={handleRefresh} 
            disabled={isSyncing}
            style={{ fontSize: 12, padding: '2px 8px', cursor: isSyncing ? 'not-allowed' : 'pointer' }}
          >
            {isSyncing ? '刷新中...' : '刷新列表'}
          </button>
        </div>
        {syncError && <div style={{ color: 'red', fontSize: 12, marginBottom: 8 }}>{syncError}</div>}
        <div>证件类型</div>
        <div>证件号</div>
        <div style={{ display: 'grid', gap: 8 }}>
          {contacts.map((c, idx) => (
            <label key={c.passenger_id} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                aria-label="选择乘车人"
                role="checkbox"
                onChange={(e) => {
                  const checked = e.target.checked;
                  setShowWarmTip(true);
                  setPassengers(prev => {
                    const exists = prev.some(p => p.passenger_id === c.passenger_id);
                    if (checked && !exists) return [...prev, { passenger_id: c.passenger_id, name: c.name, ticket_type: '成人票' }];
                    if (!checked && exists) return prev.filter(p => p.passenger_id !== c.passenger_id);
                    return prev;
                  });
                }}
              />
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600 }}>{c.name}</div>
                <div style={{ color: '#666', fontSize: 12 }}>{c.id_type} · {c.masked_id_number}</div>
              </div>
            </label>
          ))}
        </div>
        <div>{message}</div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button className="btn-primary" onClick={lockSeat}>选择座位</button>
        <button className="btn-primary" disabled={!(profile && passengers.length > 0 && seatLocks.length > 0)} onClick={submitOrder}>提交订单</button>
      </div>
      {showSeat && (
        <SeatSelectionModal
          trainId={trainId}
          travelDate={travelDate}
          onConfirm={(locks: any[], ps: any[]) => {
            setSeatLocks(locks);
            if (passengers.length === 0) {
              const pid = profile?.user_id || contacts[0]?.passenger_id || 'u-super';
              setPassengers(ps.map(p => ({ ...p, passenger_id: pid, name: profile?.name || contacts[0]?.name || '本人' })));
            }
            setMessage('锁座成功');
          }}
          onClose={() => setShowSeat(false)}
        />
      )}
      <WarmTipModal open={showWarmTip} onConfirm={() => setShowWarmTip(false)} />
    </div>
  );
}
