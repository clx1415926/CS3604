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
        const rc = await fetch('http://localhost:8083/api/v1/passengers?showFull=true', {
          headers: { 'Authorization': `Bearer ${sid}` }
        });
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

    // Expose fetchContacts to global scope for button click
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
    if (passengers.length === 0) {
      setMessage('请选择乘车人');
      return;
    }
    setMessage('');
    setShowWarmTip(true);
  };

  const confirmLock = async () => {
    setShowWarmTip(false);
    try {
      const res = await fetch('http://localhost:3001/api/v1/tickets/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          train_id: trainId,
          seat_type: '二等座', // Simplified
          passengers: passengers.map(p => ({
             passenger_id: p.passenger_id,
             seat_type: '二等座' 
          }))
        })
      });
      if (res.ok) {
        const data = await res.json();
        setSeatLocks(data.locks || []);
        setShowSeat(true);
      } else {
        setMessage('锁座失败，余票不足');
      }
    } catch (e) {
      setMessage('网络错误');
    }
  };

  const submitOrder = async () => {
    setMessage('');
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const res = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sid}`
        },
        body: JSON.stringify({
          train_id: trainId,
          travel_date: travelDate,
          from_station: fromStation,
          to_station: toStation,
          passengers: passengers,
          seat_locks: seatLocks.map(lock => ({ lock_token: lock.lock_token }))
        })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.status === 201) {
        const orderId = data.order_id || 'o-001';
        window.location.hash = `#payment?order_id=${orderId}&sid=${encodeURIComponent(sid)}`;
      } else {
        setMessage('提交订单失败');
      }
    } catch (e) {
      setMessage('网络错误');
    }
  };

  const togglePassenger = (p: any) => {
    if (passengers.find(x => x.passenger_id === p.passenger_id)) {
      setPassengers(passengers.filter(x => x.passenger_id !== p.passenger_id));
    } else {
      setPassengers([...passengers, p]);
    }
  };

  return (
    <div className="order-filling-page">
      <div className="header">
        <h1>订单填写</h1>
      </div>
      
      <div className="train-info">
        <h3>{trainId}次列车</h3>
        <p>{travelDate} {fromStation} {'->'} {toStation}</p>
      </div>

      <div className="passenger-selection">
        <div className="section-header">
            <h3>选择乘车人</h3>
            <div className="actions">
                <button onClick={handleRefresh} disabled={isSyncing} className="refresh-btn">
                    {isSyncing ? '刷新中...' : '刷新列表'}
                </button>
                {syncError && <span className="error-text" style={{color: 'red', marginLeft: '10px', fontSize: '12px'}}>{syncError}</span>}
            </div>
        </div>
        <div className="contacts-list">
          {contacts.map(c => (
            <label key={c.passenger_id} className="contact-item">
              <input 
                type="checkbox" 
                checked={!!passengers.find(x => x.passenger_id === c.passenger_id)}
                onChange={() => togglePassenger(c)}
              />
              {c.name} ({c.masked_id_number})
            </label>
          ))}
        </div>
      </div>

      {message && <div className="msg-box">{message}</div>}

      <div className="actions">
        <button className="btn-primary" onClick={lockSeat}>提交订单</button>
      </div>

      {showWarmTip && (
        <WarmTipModal 
          onConfirm={confirmLock} 
          onCancel={() => setShowWarmTip(false)} 
        />
      )}

      {showSeat && (
        <SeatSelectionModal 
          locks={seatLocks}
          onConfirm={submitOrder}
        />
      )}
    </div>
  );
}
